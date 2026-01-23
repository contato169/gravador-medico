// ================================================================
// WhatsApp Presence Helpers (Evolution API)
// ================================================================

type PresenceKind = 'composing' | 'recording' | 'available' | 'unavailable' | string

const normalizeNumber = (value: string) => value.replace(/@s\.whatsapp\.net$/i, '')

function getEvolutionConfig() {
  const apiUrl = process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME

  if (!apiUrl || !apiKey || !instanceName) {
    throw new Error('Variáveis de ambiente da Evolution API não configuradas')
  }

  return { apiUrl, apiKey, instanceName }
}

export async function sendChatPresence(params: {
  number: string
  presence: PresenceKind
  delay?: number
}) {
  const { apiUrl, apiKey, instanceName } = getEvolutionConfig()

  const payload: Record<string, unknown> = {
    number: normalizeNumber(params.number),
    presence: params.presence
  }

  if (params.delay !== undefined) {
    payload.delay = params.delay
  }

  const url = `${apiUrl}/chat/sendPresence/${instanceName}`

  console.log('🟢 [Presence] Enviando presença:', {
    url,
    number: payload.number,
    presence: payload.presence,
    delay: payload.delay
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ [Presence] Erro da Evolution API:', {
      status: response.status,
      statusText: response.statusText,
      error
    })
    throw new Error(`Erro ao enviar presença: ${response.statusText}. ${error}`)
  }

  const data = await response.json()
  console.log('✅ [Presence] Resposta da Evolution API:', data)
  return data
}

export async function sendChatPresenceWithPulse(params: {
  number: string
  presence: PresenceKind
  delay?: number
  pulses?: number
  intervalMs?: number
}) {
  const pulses = params.pulses ?? 2
  const intervalMs = params.intervalMs ?? 700

  for (let i = 0; i < pulses; i += 1) {
    await sendChatPresence({
      number: params.number,
      presence: params.presence,
      delay: params.delay
    })

    if (i < pulses - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }
}

export function startPresenceLoop(params: {
  number: string
  presence: PresenceKind
  delay?: number
  intervalMs?: number
  maxIntervalMs?: number
  backoffFactor?: number
  alternateAvailable?: boolean
  availableDelayMs?: number
}) {
  let active = true
  const baseIntervalMs = params.intervalMs ?? 2000
  const maxIntervalMs = params.maxIntervalMs ?? 6000
  const backoffFactor = params.backoffFactor ?? 1.5
  const alternateAvailable = params.alternateAvailable ?? true
  const availableDelayMs = params.availableDelayMs ?? 600
  let currentIntervalMs = baseIntervalMs

  const tick = async () => {
    if (!active) return
    try {
      if (alternateAvailable && params.presence !== 'available') {
        await sendChatPresence({
          number: params.number,
          presence: 'available',
          delay: params.delay
        })
        await new Promise((resolve) => setTimeout(resolve, availableDelayMs))
      }

      await sendChatPresence({
        number: params.number,
        presence: params.presence,
        delay: params.delay
      })

      currentIntervalMs = baseIntervalMs
    } catch (error) {
      currentIntervalMs = Math.min(
        maxIntervalMs,
        Math.max(baseIntervalMs, Math.round(currentIntervalMs * backoffFactor))
      )
      console.warn('⚠️ [Presence] Falha no loop de presença:', {
        error,
        nextIntervalMs: currentIntervalMs
      })
    }

    if (active) {
      setTimeout(tick, currentIntervalMs)
    }
  }

  void tick()

  return {
    stop() {
      active = false
    }
  }
}
