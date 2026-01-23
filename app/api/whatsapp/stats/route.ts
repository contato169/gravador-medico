// ================================================================
// API: Estatísticas do inbox WhatsApp (server-side)
// ================================================================

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const [contactsResult, messagesResult, unreadResult] = await Promise.all([
      supabaseAdmin
        .from('whatsapp_contacts')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('whatsapp_messages')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('whatsapp_contacts')
        .select('unread_count')
    ])

    const totalUnread =
      unreadResult.data?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalContacts: contactsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalUnread
      }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
