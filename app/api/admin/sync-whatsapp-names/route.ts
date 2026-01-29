import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * 🔄 ENDPOINT: Sincronizar nomes dos contatos WhatsApp
 * 
 * Busca os nomes reais dos contatos na API do Evolution
 * e atualiza no banco de dados
 */

// 🚫 LISTA DE NOMES QUE NÃO DEVEM SER SALVOS
const BLOCKED_NAMES = [
  'gravador medico',
  'gravador médico',
  'gravadormedico',
  'assistente virtual',
  'bot',
  'atendimento',
  'suporte'
]

const isBlockedName = (name?: string | null): boolean => {
  if (!name) return true
  return BLOCKED_NAMES.includes(name.toLowerCase().trim())
}

export async function GET() {
  try {
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis de ambiente do Evolution não configuradas'
      }, { status: 500 })
    }

    // 1. Buscar todos os contatos do banco
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('remote_jid, push_name, name')
      .eq('is_group', false)
      .order('last_message_timestamp', { ascending: false, nullsFirst: false })
      .limit(100)

    if (contactsError) {
      throw contactsError
    }

    console.log(`📋 Encontrados ${contacts?.length || 0} contatos para sincronizar`)

    const results = {
      total: contacts?.length || 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    }

    // 2. Para cada contato, buscar nome na API do Evolution
    for (const contact of contacts || []) {
      try {
        const phoneNumber = contact.remote_jid.split('@')[0]
        
        // Buscar contato na API
        const response = await fetch(
          `${EVOLUTION_API_URL}/chat/findContacts/${EVOLUTION_INSTANCE_NAME}`,
          {
            method: 'POST',
            headers: {
              'apikey': EVOLUTION_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number: phoneNumber })
          }
        )

        if (!response.ok) {
          console.warn(`⚠️ Erro ao buscar ${phoneNumber}: ${response.status}`)
          results.skipped++
          continue
        }

        const data = await response.json()
        const contactsArray = Array.isArray(data) ? data : (data ? [data] : [])
        
        if (contactsArray.length === 0) {
          results.skipped++
          continue
        }

        // Encontrar o contato correto
        const targetContact = contactsArray.find((c: any) => 
          c.remoteJid === contact.remote_jid || 
          c.id === contact.remote_jid
        ) || contactsArray[0]

        // Extrair nome
        const newName = 
          targetContact.pushName ||
          targetContact.name ||
          targetContact.verifiedName ||
          targetContact.notify ||
          targetContact.displayName

        // Verificar se é um nome válido
        if (!newName || isBlockedName(newName)) {
          console.log(`⏭️ Pulando ${phoneNumber} - nome inválido: "${newName}"`)
          results.skipped++
          continue
        }

        // Atualizar no banco
        const { error: updateError } = await supabaseAdmin
          .from('whatsapp_contacts')
          .update({ push_name: newName })
          .eq('remote_jid', contact.remote_jid)

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${phoneNumber}:`, updateError)
          results.errors++
        } else {
          console.log(`✅ Atualizado: ${phoneNumber} → "${newName}"`)
          results.updated++
          results.details.push({
            phone: phoneNumber,
            oldName: contact.push_name,
            newName: newName
          })
        }

        // Aguardar um pouco para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (contactError) {
        console.error(`❌ Erro ao processar contato:`, contactError)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização de nomes concluída',
      results
    })

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
