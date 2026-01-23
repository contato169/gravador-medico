// ================================================================
// API: Buscar mensagens de uma conversa WhatsApp (server-side)
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const remoteJid = searchParams.get('remoteJid')
    const limitParam = searchParams.get('limit')
    const beforeParam = searchParams.get('before')
    const limit = Number(limitParam || 100)

    if (!remoteJid) {
      return NextResponse.json(
        { success: false, error: 'remoteJid é obrigatório' },
        { status: 400 }
      )
    }

    const query = supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('remote_jid', remoteJid)
      .order('timestamp', { ascending: false })
      .limit(Number.isFinite(limit) ? limit : 100)

    if (beforeParam) {
      // Paginação: buscar mensagens mais antigas que este timestamp
      query.lt('timestamp', beforeParam)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const ordered = (data || []).slice().reverse()

    return NextResponse.json({ success: true, messages: ordered })
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
