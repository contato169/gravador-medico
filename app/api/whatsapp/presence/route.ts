// ================================================================
// API: Enviar presença (digitando/gravando) via Evolution API
// ================================================================

import { NextRequest, NextResponse } from 'next/server'

const normalizeNumber = (value: string) => value.replace(/@s\.whatsapp\.net$/i, '')

export async function POST(request: NextRequest) {
  try {
    const { number, remoteJid, presence, delay } = await request.json()

    console.log('🟢 [/api/whatsapp/presence] Payload:', {
      number,
      remoteJid,
      presence,
      delay
    })

    const target = typeof number === 'string' ? number : typeof remoteJid === 'string' ? remoteJid : null

    if (!target) {
      return NextResponse.json(
        { success: false, message: 'number ou remoteJid é obrigatório' },
        { status: 400 }
      )
    }

    if (!presence || typeof presence !== 'string') {
      return NextResponse.json(
        { success: false, message: 'presence é obrigatório' },
        { status: 400 }
      )
    }

    if (delay !== undefined && typeof delay !== 'number') {
      return NextResponse.json(
        { success: false, message: 'delay deve ser número (ms)' },
        { status: 400 }
      )
    }

  const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || process.env.NEXT_PUBLIC_EVOLUTION_API_URL
  const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || process.env.NEXT_PUBLIC_EVOLUTION_API_KEY
  const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      throw new Error('Variáveis de ambiente da Evolution API não configuradas')
    }

    const url = `${EVOLUTION_API_URL}/chat/sendPresence/${EVOLUTION_INSTANCE_NAME}`

    const payload: Record<string, unknown> = {
      number: normalizeNumber(target),
      presence
    }

    if (delay !== undefined) {
      payload.delay = delay
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erro da Evolution API:', error)
      throw new Error(`Erro ao enviar presença: ${response.statusText}`)
    }

  const data = await response.json()
  console.log('✅ [/api/whatsapp/presence] Resposta Evolution:', data)

    return NextResponse.json({
      success: true,
      message: 'Presença enviada com sucesso',
      data
    })
  } catch (error) {
    console.error('❌ Erro ao enviar presença:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
