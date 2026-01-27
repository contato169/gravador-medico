import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-server'

/**
 * API de Sincronização Manual com Mercado Pago
 * Busca pagamentos históricos do MP e importa para o banco
 * 
 * Uso:
 * POST /api/admin/sync-mercadopago
 * Body: { days?: number }
 */

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ''

// Mapeamento de status do MP para nosso sistema
const STATUS_MAP: Record<string, string> = {
  'approved': 'paid',
  'authorized': 'approved',
  'pending': 'pending',
  'in_process': 'pending',
  'in_mediation': 'pending',
  'rejected': 'refused',
  'cancelled': 'cancelled',
  'refunded': 'refunded',
  'charged_back': 'chargeback'
}

function normalizeStatus(status?: string): string {
  if (!status) return 'pending'
  return STATUS_MAP[status.toLowerCase()] || status.toLowerCase()
}

function normalizePaymentMethod(method?: string): string {
  if (!method) return 'unknown'
  const normalized = method.toLowerCase()
  if (normalized.includes('pix')) return 'pix'
  if (normalized.includes('credit') || normalized.includes('debit')) return 'credit_card'
  if (normalized.includes('boleto') || normalized.includes('ticket')) return 'boleto'
  return normalized
}

interface MPPayment {
  id: number
  status: string
  status_detail: string
  transaction_amount: number
  currency_id: string
  date_created: string
  date_approved?: string
  payment_method_id: string
  payment_type_id: string
  external_reference?: string
  payer?: {
    email?: string
    first_name?: string
    last_name?: string
    phone?: {
      number?: string
    }
    identification?: {
      type?: string
      number?: string
    }
  }
}

async function fetchMercadoPagoPayments(days: number = 30): Promise<MPPayment[]> {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const url = new URL('https://api.mercadopago.com/v1/payments/search')
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'desc')
  url.searchParams.set('range', 'date_created')
  url.searchParams.set('begin_date', startDate.toISOString().split('T')[0] + 'T00:00:00.000-00:00')
  url.searchParams.set('end_date', new Date().toISOString().split('T')[0] + 'T23:59:59.999-00:00')
  url.searchParams.set('limit', '100')

  console.log(`📡 [MP] URL: ${url.toString()}`)
  console.log(`📡 [MP] Token: ${MP_ACCESS_TOKEN ? 'Configurado' : 'NÃO CONFIGURADO'}`)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })

  console.log(`📡 [MP] Response status: ${response.status} ${response.statusText}`)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [MP] Erro da API:', errorText)
    throw new Error(`Mercado Pago API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`✅ [MP] Total de pagamentos: ${data.results?.length || 0}`)
  
  return data.results || []
}

async function syncPayment(payment: MPPayment): Promise<{
  success: boolean
  error?: string
  paymentId: string
  action: 'created' | 'updated' | 'skipped'
}> {
  try {
    const paymentId = payment.id.toString()
    
    // Verificar se já existe
    const { data: existingSale } = await supabaseAdmin
      .from('sales')
      .select('id, order_status')
      .eq('mercadopago_payment_id', paymentId)
      .maybeSingle()

    // Se já existe e está pago, pular
    if (existingSale && ['paid', 'approved'].includes(existingSale.order_status)) {
      return { success: true, paymentId, action: 'skipped' }
    }

    // Extrair dados do pagamento
    const customerEmail = payment.payer?.email
    const customerName = payment.payer?.first_name 
      ? `${payment.payer.first_name} ${payment.payer.last_name || ''}`
      : customerEmail?.split('@')[0] || 'Cliente MP'
    const customerPhone = payment.payer?.phone?.number
    const customerCpf = payment.payer?.identification?.number

    if (!customerEmail) {
      return { success: false, error: 'Email não encontrado', paymentId, action: 'skipped' }
    }

    // Criar/atualizar customer
    let customerId: string | null = null
    try {
      const { data: customerRow } = await supabaseAdmin
        .from('customers')
        .upsert({
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          cpf: customerCpf
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select('id')
        .single()

      customerId = customerRow?.id || null
    } catch (error) {
      console.warn('⚠️ Erro ao upsert customer:', error)
    }

    // Preparar payload da venda
    const status = normalizeStatus(payment.status)
    const totalAmount = Number(payment.transaction_amount || 0)
    const paymentMethod = normalizePaymentMethod(payment.payment_method_id || payment.payment_type_id)
    const now = new Date().toISOString()

    const salePayload: Record<string, any> = {
      mercadopago_payment_id: paymentId,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      total_amount: totalAmount,
      subtotal: totalAmount,
      order_status: status,
      status: status,
      payment_method: paymentMethod,
      payment_gateway: 'mercadopago',
      external_reference: payment.external_reference || null,
      updated_at: now
    }

    if (existingSale) {
      // Atualizar
      await supabaseAdmin
        .from('sales')
        .update(salePayload)
        .eq('id', existingSale.id)

      console.log(`🔄 [MP] Venda atualizada: ${paymentId} (${status})`)
      return { success: true, paymentId, action: 'updated' }
    } else {
      // Criar nova
      salePayload.created_at = payment.date_created || now
      
      const { error: insertError } = await supabaseAdmin
        .from('sales')
        .insert(salePayload)

      if (insertError) {
        console.error(`❌ [MP] Erro ao inserir venda ${paymentId}:`, insertError)
        return { success: false, error: insertError.message, paymentId, action: 'skipped' }
      }

      console.log(`✅ [MP] Nova venda criada: ${paymentId} (${status})`)
      return { success: true, paymentId, action: 'created' }
    }
  } catch (error: any) {
    console.error(`❌ [MP] Erro ao sincronizar ${payment.id}:`, error)
    return { success: false, error: error.message, paymentId: payment.id.toString(), action: 'skipped' }
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const days = Number(body.days) || 30

    console.log(`🔄 [MP SYNC] Iniciando sincronização dos últimos ${days} dias...`)

    const payments = await fetchMercadoPagoPayments(days)
    
    const results = {
      total: payments.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as string[]
    }

    for (const payment of payments) {
      const result = await syncPayment(payment)
      
      if (result.success) {
        if (result.action === 'created') results.created++
        else if (result.action === 'updated') results.updated++
        else results.skipped++
      } else {
        results.errors++
        results.errorDetails.push(`${result.paymentId}: ${result.error}`)
      }
    }

    console.log(`✅ [MP SYNC] Concluído:`, results)

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída`,
      results
    })
  } catch (error: any) {
    console.error('❌ [MP SYNC] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/admin/sync-mercadopago',
    usage: 'POST { days?: number }',
    description: 'Sincroniza pagamentos do Mercado Pago com a tabela sales'
  })
}
