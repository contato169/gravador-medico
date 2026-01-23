// ================================================================
// API: Notifications Snapshot (WhatsApp + Admin Chat)
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lastWhatsAppId = searchParams.get('lastWhatsAppId')
    const lastAdminChatId = searchParams.get('lastAdminChatId')

    const [{ data: whatsapp }, { data: adminChat }] = await Promise.all([
      supabaseAdmin
        .from('whatsapp_messages')
        .select('id, remote_jid, content, from_me, timestamp')
        .order('timestamp', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('admin_chat_messages')
        .select('id, conversation_id, sender_id, content, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
    ])

    const normalizeFromMe = (value: unknown) =>
      value === true || value === 'true' || value === 1 || value === '1'

    const latestWhatsApp =
      whatsapp?.find((item) => !normalizeFromMe(item.from_me)) || null
    const latestAdminChat = adminChat?.[0] || null

    let contact = null
    if (latestWhatsApp?.remote_jid) {
      const { data: contactData } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('name, push_name, profile_picture_url')
        .eq('remote_jid', latestWhatsApp.remote_jid)
        .single()
      contact = contactData || null
    }

    return NextResponse.json({
      success: true,
      whatsapp:
        latestWhatsApp && latestWhatsApp.id !== lastWhatsAppId
          ? { ...latestWhatsApp, contact }
          : null,
      adminChat:
        latestAdminChat && latestAdminChat.id !== lastAdminChatId
          ? latestAdminChat
          : null
    })
  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
