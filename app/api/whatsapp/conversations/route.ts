// ================================================================
// API: Buscar conversas WhatsApp (server-side)
// ================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('*')
      .order('last_message_timestamp', { ascending: false, nullsFirst: false })

    if (!error) {
      return NextResponse.json({ success: true, conversations: data || [] })
    }

    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('*')
      .order('last_message_timestamp', { ascending: false, nullsFirst: false })

    if (contactsError) {
      throw contactsError
    }

    const conversations = (contacts || []).map((contact) => ({
      ...contact,
      total_messages: 0
    }))

    return NextResponse.json({ success: true, conversations })
  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
