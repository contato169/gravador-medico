// ================================================================
// API: Enviar mensagem WhatsApp via Evolution API
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { upsertWhatsAppMessage } from '@/lib/whatsapp-db'
import { sendChatPresenceWithPulse, startPresenceLoop } from '@/lib/whatsapp-presence'

// ================================================================
// Mapear status da Evolution API para nosso schema
// ================================================================
function mapEvolutionStatus(evolutionStatus?: string): 'sent' | 'delivered' | 'read' | 'error' {
  if (!evolutionStatus) return 'sent'
  
  const status = evolutionStatus.toUpperCase()
  
  if (status === 'PENDING' || status === 'SENT') return 'sent'
  if (status === 'SERVER_ACK' || status === 'DELIVERY_ACK') return 'delivered'
  if (status === 'READ' || status === 'PLAYED') return 'read'
  if (status === 'ERROR' || status === 'FAILED') return 'error'
  
  return 'sent' // default
}

export async function POST(request: NextRequest) {
  try {
    const { remoteJid, message, quotedMessageId } = await request.json()

    console.log('📨 [/api/whatsapp/send] Payload:', {
      remoteJid,
      messagePreview: typeof message === 'string' ? message.slice(0, 120) : message,
      quotedMessageId
    })

    if (!remoteJid || !message) {
      return NextResponse.json(
        { success: false, message: 'remoteJid e message são obrigatórios' },
        { status: 400 }
      )
    }

    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      throw new Error('Variáveis de ambiente da Evolution API não configuradas')
    }

    // Endpoint Evolution v2: POST /message/sendText/{instance}
    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`

    console.log('📤 Enviando mensagem:', { remoteJid, message: message.substring(0, 50) })

    const presenceLoop = startPresenceLoop({
      number: remoteJid,
      presence: 'composing',
      delay: 3500,
      intervalMs: 2200,
      maxIntervalMs: 7000,
      backoffFactor: 1.6,
      alternateAvailable: true,
      availableDelayMs: 600
    })

    try {
      await sendChatPresenceWithPulse({
        number: remoteJid,
        presence: 'composing',
        delay: 3500,
        pulses: 2,
        intervalMs: 900
      })
      await new Promise((resolve) => setTimeout(resolve, 1200))
    } catch (presenceError) {
      console.warn('⚠️ Não foi possível enviar presença (digitando):', presenceError)
    }

    const bodyPayload: Record<string, unknown> = {
      number: remoteJid,
      text: message,
      delay: 1200 // Delay para parecer mais humano
    }

    if (quotedMessageId) {
      bodyPayload.quoted = {
        key: {
          id: quotedMessageId
        }
      }
    }

    let data: any

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ Erro da Evolution API:', error)
        throw new Error(`Erro ao enviar mensagem: ${response.statusText}`)
      }

      data = await response.json()
      console.log('✅ [/api/whatsapp/send] Resposta Evolution:', data)
    } finally {
      presenceLoop.stop()
    }
    console.log('✅ Mensagem enviada com sucesso:', data)

    // ================================================================
    // SALVAR MENSAGEM NO BANCO (já que webhook pode não disparar para msgs enviadas)
    // ================================================================
    try {
      console.log('💾 Salvando mensagem enviada no banco...')
      
      // Mapear status da Evolution API
      const messageStatus = data.status ? mapEvolutionStatus(data.status) : 'sent'
      
      const savedMessage = await upsertWhatsAppMessage({
        message_id: data.key?.id || `fallback-${Date.now()}`,
        remote_jid: data.key?.remoteJid || remoteJid,
        content: message,
        message_type: 'text',
        from_me: true,  // ← FORÇAR TRUE para mensagens enviadas
        timestamp: new Date(data.messageTimestamp * 1000).toISOString(),
        status: messageStatus,
        raw_payload: data
      })
      
      console.log('✅ Mensagem salva no banco:', savedMessage.id, 'from_me:', savedMessage.from_me, 'status:', savedMessage.status)
    } catch (dbError) {
      console.error('❌ Erro ao salvar no banco (não-fatal):', dbError)
      // Não falha a requisição se houver erro no banco
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data
    })

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
