import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Webhook do Resend para rastrear eventos de email
 * 
 * Eventos suportados:
 * - email.sent: Email enviado
 * - email.delivered: Email entregue
 * - email.opened: Email aberto (tracking de abertura)
 * - email.clicked: Link clicado no email
 * - email.bounced: Email retornado (bounce)
 * - email.complained: Email marcado como spam
 */

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    // Para eventos de abertura/clique
    click?: {
      link: string
      timestamp: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: ResendWebhookPayload = await request.json()
    
    console.log('📧 Resend Webhook:', payload.type, payload.data.email_id)

    const emailId = payload.data.email_id
    const eventType = payload.type
    const timestamp = new Date().toISOString()

    // Buscar o email no banco
    const { data: emailLog, error: fetchError } = await supabaseAdmin
      .from('email_logs')
      .select('id, email_id, opened, open_count, first_opened_at, clicked, click_count, first_clicked_at')
      .eq('email_id', emailId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar email:', fetchError)
    }

    // Se não encontrou pelo email_id, tentar pelo to + subject recente
    if (!emailLog) {
      console.log('⚠️ Email não encontrado pelo ID, tentando por email recente')
      
      const { data: recentEmail } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .eq('recipient_email', payload.data.to[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (recentEmail) {
        // Atualizar o email_id
        await supabaseAdmin
          .from('email_logs')
          .update({ email_id: emailId })
          .eq('id', recentEmail.id)
        
        console.log('✅ Email ID atualizado:', recentEmail.id)
      }
    }

    // Processar evento
    switch (eventType) {
      case 'email.delivered':
        await supabaseAdmin
          .from('email_logs')
          .update({
            status: 'delivered',
            delivered_at: timestamp,
          })
          .eq('email_id', emailId)
        console.log('✅ Email marcado como entregue')
        break

      case 'email.opened':
        const currentOpenCount = emailLog?.open_count || 0
        await supabaseAdmin
          .from('email_logs')
          .update({
            opened: true,
            open_count: currentOpenCount + 1,
            first_opened_at: emailLog?.first_opened_at || timestamp,
            last_opened_at: timestamp,
            opened_at: emailLog?.first_opened_at ? undefined : timestamp,
          })
          .eq('email_id', emailId)
        console.log('👁️ Email marcado como aberto')
        break

      case 'email.clicked':
        const currentClickCount = emailLog?.click_count || 0
        await supabaseAdmin
          .from('email_logs')
          .update({
            clicked: true,
            click_count: currentClickCount + 1,
            first_clicked_at: emailLog?.first_clicked_at || timestamp,
            last_clicked_at: timestamp,
          })
          .eq('email_id', emailId)
        console.log('🔗 Clique registrado no email')
        break

      case 'email.bounced':
        await supabaseAdmin
          .from('email_logs')
          .update({
            status: 'bounced',
            bounced_at: timestamp,
          })
          .eq('email_id', emailId)
        console.log('❌ Email bounced')
        break

      case 'email.complained':
        await supabaseAdmin
          .from('email_logs')
          .update({
            status: 'spam',
            complained_at: timestamp,
          })
          .eq('email_id', emailId)
        console.log('🚫 Email marcado como spam')
        break

      default:
        console.log('ℹ️ Evento não tratado:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Erro no webhook Resend:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Responder a HEAD requests (verificação do Resend)
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
