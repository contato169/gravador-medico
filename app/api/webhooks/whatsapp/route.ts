// ================================================================
// WEBHOOK: Evolution API v2 - MESSAGES_UPSERT
// ================================================================
// Endpoint: POST /api/webhooks/whatsapp
// Recebe eventos de mensagens da Evolution API e salva no banco
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { upsertWhatsAppMessage, upsertWhatsAppContact, messageExists } from '@/lib/whatsapp-db'
import type { EvolutionMessagePayload, CreateMessageInput } from '@/lib/types/whatsapp'

/**
 * Busca a foto de perfil do contato usando endpoint correto Evolution v2
 * 
 * ESTRATÉGIA DEFINITIVA (confirmada via fetchInstances):
 * 1. Tenta extrair do próprio payload da mensagem
 * 2. Usa POST /chat/findContacts/{instance} com body {number: xxx} (CONFIRMADO FUNCIONANDO)
 * 3. BUSCA O CONTATO ESPECÍFICO no array (não pega o primeiro)
 * 4. Se falhar, retorna null e NÃO TRAVA o processo
 * 
 * IMPORTANTE: 
 * - Body usa apenas o número (sem @s.whatsapp.net)
 * - Resposta é ARRAY - precisa encontrar o contato correto por remoteJid
 * - Campo da foto: "profilePicUrl" ou "profilePictureUrl"
 * - Mensagem SEMPRE será salva, mesmo sem foto
 */
async function fetchProfilePicture(
  remoteJid: string, 
  participant: string | undefined,
  messagePayload?: any
): Promise<string | null> {
  // Wrapper try-catch global para garantir que NUNCA trava
  try {
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      console.warn('⚠️ [DEBUG FOTO] Variáveis de ambiente não configuradas - salvando sem foto')
      return null
    }

    // ================================================================
    // ESTRATÉGIA 1: Verificar se a foto já vem no payload da mensagem
    // ================================================================
    if (messagePayload) {
      const photoFromPayload = 
        messagePayload.profilePictureUrl ||
        messagePayload.profilePicUrl ||
        messagePayload.picture ||
        messagePayload.imgUrl ||
        (messagePayload.pushName && messagePayload.profilePicture) ||
        null

      if (photoFromPayload) {
        console.log(`✅ [DEBUG FOTO] Encontrada no payload: ${photoFromPayload}`)
        return photoFromPayload
      }
    }

    // ================================================================
    // ESTRATÉGIA 2: POST /chat/findContacts (VALIDADO via terminal)
    // Body: {"number": "5521988960217"} (apenas número, sem @s.whatsapp.net)
    // Response: Array com campo profilePicUrl
    // CORREÇÃO: Identifica remetente correto (grupo usa participant)
    // ================================================================
    
    // 🎯 IDENTIFICAR REMETENTE CORRETO
    // Se for grupo (@g.us), usar participant
    // Se for privado (@s.whatsapp.net), usar remoteJid
    const isGroup = remoteJid.includes('@g.us')
    const actualSenderJid = isGroup && participant ? participant : remoteJid
    const phoneNumber = actualSenderJid.split('@')[0]  // "5521988960217@s.whatsapp.net" → "5521988960217"
    
    console.log(`📸 [DEBUG FOTO] ===== INÍCIO BUSCA FOTO =====`)
    console.log(`📸 [DEBUG FOTO] RemoteJid completo: ${remoteJid}`)
    console.log(`📸 [DEBUG FOTO] É grupo: ${isGroup}`)
    console.log(`📸 [DEBUG FOTO] Participant (se grupo): ${participant || 'N/A'}`)
    console.log(`📸 [DEBUG FOTO] Remetente real (JID): ${actualSenderJid}`)
    console.log(`📸 [DEBUG FOTO] Phone number extraído: ${phoneNumber}`)
    console.log(`📸 [DEBUG FOTO] ===========================`)
    
    const url = `${EVOLUTION_API_URL}/chat/findContacts/${EVOLUTION_INSTANCE_NAME}`
    const requestBody = { number: phoneNumber }
    
    console.log(`📸 [DEBUG FOTO] URL: ${url}`)
    console.log(`📸 [DEBUG FOTO] Método: POST`)
    console.log(`📸 [DEBUG FOTO] Body: ${JSON.stringify(requestBody)}`)
    
    // Timeout de 5 segundos para não travar o webhook
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log(`📸 [DEBUG FOTO] ===== RESPOSTA RECEBIDA =====`)
    console.log(`📸 [DEBUG FOTO] Status HTTP: ${response.status}`)
    console.log(`📸 [DEBUG FOTO] Status OK: ${response.ok}`)

    // Log detalhado de erro se não for 200/201
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [DEBUG FOTO] ERRO HTTP ${response.status}`)
      console.error(`❌ [DEBUG FOTO] Corpo da resposta: ${errorText}`)
      console.error(`❌ [DEBUG FOTO] Headers da resposta:`, Object.fromEntries(response.headers.entries()))
      console.warn(`⚠️ [DEBUG FOTO] Salvando mensagem sem foto`)
      return null
    }

    const data = await response.json()
    
    console.log(`📸 [DEBUG FOTO] Resposta JSON completa:`, JSON.stringify(data, null, 2))
    
    // A resposta pode ser um array ou objeto único
    const contacts = Array.isArray(data) ? data : (data ? [data] : [])
    console.log(`📸 [DEBUG FOTO] Total de contatos retornados: ${contacts.length}`)
    
    if (contacts.length === 0) {
      console.log(`⚠️ [DEBUG FOTO] Nenhum contato retornado`)
      console.log(`📸 [DEBUG FOTO] ===========================`)
      return null
    }
    
    // 🎯 BUSCAR CONTATO ESPECÍFICO (não pegar o primeiro!)
    // Precisamos encontrar o contato correto pelo remoteJid
    const targetContact = contacts.find(c => c.remoteJid === actualSenderJid)
    
    if (!targetContact) {
      console.log(`⚠️ [DEBUG FOTO] Contato ${actualSenderJid} não encontrado no array`)
      console.log(`📸 [DEBUG FOTO] Contatos retornados:`, contacts.map(c => c.remoteJid))
      console.log(`📸 [DEBUG FOTO] ===========================`)
      return null
    }
    
    console.log(`📸 [DEBUG FOTO] Contato encontrado:`, JSON.stringify(targetContact, null, 2))
    
    const photoUrl = 
      targetContact.profilePicUrl ||
      targetContact.profilePictureUrl || 
      targetContact.picture ||
      targetContact.imgUrl ||
      null
    
    console.log(`📸 [DEBUG FOTO] Campo profilePicUrl: ${targetContact.profilePicUrl}`)
    console.log(`📸 [DEBUG FOTO] Campo profilePictureUrl: ${targetContact.profilePictureUrl}`)
    console.log(`📸 [DEBUG FOTO] Foto final selecionada: ${photoUrl}`)
    console.log(`📸 [DEBUG FOTO] ===========================`)

    if (photoUrl && typeof photoUrl === 'string') {
      console.log(`✅ [DEBUG FOTO] Foto encontrada via findContacts: ${photoUrl}`)
      return photoUrl
    }

    console.log(`⚠️ [DEBUG FOTO] Contato encontrado mas sem foto`)
    return null
    
  } catch (error) {
    // CRÍTICO: Mesmo com erro, retorna null para não travar o webhook
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏱️ [DEBUG FOTO] Timeout ao buscar foto - continuando sem foto')
    } else {
      console.error('❌ [DEBUG FOTO] Erro ao buscar (não crítico - continuando):', error)
    }
    return null
  }
}

/**
 * Extrai conteúdo e tipo da mensagem do payload da Evolution API
 */
function extractMessageContent(message: any, messageType: string) {
  let content: string | undefined
  let media_url: string | undefined
  let caption: string | undefined
  let type: CreateMessageInput['message_type'] = 'text'

  // Texto simples
  if (message.conversation) {
    content = message.conversation
    type = 'text'
  }
  // Texto estendido (resposta, etc)
  else if (message.extendedTextMessage?.text) {
    content = message.extendedTextMessage.text
    type = 'text'
  }
  // Imagem
  else if (message.imageMessage) {
    media_url = message.imageMessage.url
    caption = message.imageMessage.caption
    content = caption || '[Imagem]'
    type = 'image'
  }
  // Vídeo
  else if (message.videoMessage) {
    media_url = message.videoMessage.url
    caption = message.videoMessage.caption
    content = caption || '[Vídeo]'
    type = 'video'
  }
  // Áudio
  else if (message.audioMessage) {
    media_url = message.audioMessage.url
    content = '[Áudio]'
    type = 'audio'
  }
  // Documento
  else if (message.documentMessage) {
    media_url = message.documentMessage.url
    caption = message.documentMessage.caption
    content = message.documentMessage.fileName || '[Documento]'
    type = 'document'
  }
  // Sticker
  else if (message.stickerMessage) {
    media_url = message.stickerMessage.url
    content = '[Sticker]'
    type = 'sticker'
  }
  // Localização
  else if (message.locationMessage) {
    content = `📍 Localização: ${message.locationMessage.degreesLatitude}, ${message.locationMessage.degreesLongitude}`
    type = 'location'
  }
  // Contato
  else if (message.contactMessage) {
    content = `👤 Contato: ${message.contactMessage.displayName || 'Sem nome'}`
    type = 'contact'
  }
  // Tipo desconhecido
  else {
    content = `[${messageType}]`
  }

  return { content, media_url, caption, type }
}

export async function POST(request: NextRequest) {
  try {
    const payload: EvolutionMessagePayload = await request.json()

    // ================================================================
    // 🔍 DEBUG COMPLETO DO PAYLOAD (para identificar estrutura real)
    // ================================================================
    const payloadKey = payload?.data?.key
    
    console.log('=' .repeat(60))
    console.log('[DEBUG KEY] PAYLOAD COMPLETO:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('=' .repeat(60))
    console.log('[DEBUG KEY] key:', JSON.stringify(payloadKey, null, 2))
    console.log('[DEBUG FOTO] remoteJid:', payloadKey?.remoteJid)
    console.log('[DEBUG FOTO] participant:', payloadKey?.participant)
    console.log('[DEBUG FOTO] fromMe:', payloadKey?.fromMe)
    console.log('[DEBUG FOTO] É grupo?', payloadKey?.remoteJid?.includes('@g.us'))
    console.log('=' .repeat(60))

    console.log('📥 Webhook recebido:', {
      event: payload.event,
      instance: payload.instance,
      remoteJid: payload.data.key.remoteJid,
      fromMe: payload.data.key.fromMe,
      messageType: payload.data.messageType
    })

    // Ignorar eventos que não são de mensagens
    if (payload.event !== 'messages.upsert') {
      return NextResponse.json({ 
        success: true, 
        message: 'Evento ignorado (não é messages.upsert)' 
      })
    }

    const { key, message, messageType, messageTimestamp, pushName, status } = payload.data

    // Verificar se mensagem já existe (evitar duplicatas)
    const exists = await messageExists(key.id)
    if (exists) {
      console.log('⚠️ Mensagem já existe:', key.id)
      return NextResponse.json({ 
        success: true, 
        message: 'Mensagem já existe' 
      })
    }

    // Extrair conteúdo da mensagem
    const { content, media_url, caption, type } = extractMessageContent(message, messageType)

    // ================================================================
    // PASSO 1: Buscar foto de perfil (NÃO CRÍTICO - nunca trava)
    // Usa endpoint /chat/findContacts confirmado via teste curl
    // IMPORTANTE: Passa participant para identificar remetente em grupos
    // ================================================================
    console.log('📸 [FOTO] Iniciando busca de foto de perfil...')
    const profilePictureUrl = await fetchProfilePicture(
      key.remoteJid, 
      key.participant,  // Para mensagens de grupo
      payload.data
    )
    
    if (profilePictureUrl) {
      console.log(`✅ [FOTO] Foto obtida com sucesso: ${profilePictureUrl.substring(0, 50)}...`)
    } else {
      console.log(`ℹ️ [FOTO] Nenhuma foto encontrada - salvando contato sem foto`)
    }

    // ================================================================
    // PASSO 2: UPSERT do contato PRIMEIRO (resolver FK constraint)
    // GARANTIA: Sempre salva o contato, mesmo sem foto
    // ================================================================
    console.log('🔄 [CONTATO] Criando/atualizando contato...')
    try {
      await upsertWhatsAppContact({
        remote_jid: key.remoteJid,
        push_name: pushName || undefined,
        profile_picture_url: profilePictureUrl || undefined, // ✅ null é aceito
        is_group: key.remoteJid.includes('@g.us')
      })
      console.log(`✅ [CONTATO] Salvo: ${key.remoteJid} (foto: ${profilePictureUrl ? 'SIM' : 'NÃO'})`)
    } catch (contactError) {
      console.error('❌ [CONTATO] Erro ao salvar contato:', contactError)
      throw contactError // Re-throw para não salvar mensagem órfã
    }

    // ================================================================
    // PASSO 3: INSERT da mensagem (agora o FK existe)
    // ================================================================
    console.log('💬 [MENSAGEM] Salvando mensagem...')
    const messageInput: CreateMessageInput = {
      message_id: key.id,
      remote_jid: key.remoteJid,
      content,
      message_type: type,
      media_url,
      caption,
      from_me: key.fromMe,
      timestamp: new Date(messageTimestamp * 1000).toISOString(),
      status: status as any,
      raw_payload: payload.data
    }

    const savedMessage = await upsertWhatsAppMessage(messageInput)
    console.log(`✅ [MENSAGEM] Salva com sucesso: ${savedMessage.id}`)

    return NextResponse.json({
      success: true,
      message: 'Mensagem processada com sucesso',
      messageId: savedMessage.id,
      hasProfilePicture: !!profilePictureUrl
    })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Permitir GET para health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'whatsapp-evolution-api-v2',
    timestamp: new Date().toISOString()
  })
}
