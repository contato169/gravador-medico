import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// =====================================================
// API: Resincronizar Venda (Botão de Pânico)
// =====================================================
// Força a reinserção de uma venda na fila de provisionamento
// Usado quando um cliente não recebeu acesso
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { customerEmail, saleId } = await request.json()

    if (!customerEmail && !saleId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'É necessário informar o email do cliente ou ID da venda' 
        },
        { status: 400 }
      )
    }

    console.log('🔄 [RESYNC SALE] Iniciando resincronização...')
    console.log('📧 Email:', customerEmail)
    console.log('🆔 Sale ID:', saleId)

    // 1️⃣ BUSCAR VENDA NO BANCO
    let query = supabaseAdmin
      .from('sales')
      .select('id, customer_email, customer_name, order_status, total_amount')
      .eq('order_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)

    if (saleId) {
      query = query.eq('id', saleId)
    } else if (customerEmail) {
      query = query.eq('customer_email', customerEmail)
    }

    const { data: sales, error: saleError } = await query

    if (saleError) {
      console.error('❌ Erro ao buscar venda:', saleError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar venda no banco' },
        { status: 500 }
      )
    }

    if (!sales || sales.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nenhuma venda paga encontrada para este cliente' 
        },
        { status: 404 }
      )
    }

    const sale = sales[0]

    console.log('✅ Venda encontrada:', {
      id: sale.id,
      email: sale.customer_email,
      status: sale.order_status,
      amount: sale.total_amount
    })

    // 2️⃣ VERIFICAR SE JÁ EXISTE NA FILA (PENDENTE)
    const { data: existingQueue } = await supabaseAdmin
      .from('provisioning_queue')
      .select('id, status, retry_count')
      .eq('sale_id', sale.id)
      .eq('status', 'pending')
      .single()

    if (existingQueue) {
      console.log('⚠️ Item já está na fila como PENDING')
      return NextResponse.json({
        success: true,
        message: 'Venda já está na fila de processamento',
        queueId: existingQueue.id,
        alreadyQueued: true
      })
    }

    // 3️⃣ VERIFICAR SE JÁ FOI PROCESSADO COM SUCESSO
    const { data: completedQueue } = await supabaseAdmin
      .from('provisioning_queue')
      .select('id, status, completed_at')
      .eq('sale_id', sale.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (completedQueue) {
      console.log('✅ Provisionamento já foi concluído anteriormente')
      console.log('🔄 Forçando nova entrada na fila...')
    }

    // 4️⃣ INSERIR/ATUALIZAR NA FILA DE PROVISIONAMENTO
    const queuePayload = {
      sale_id: sale.id,
      customer_email: sale.customer_email,
      customer_name: sale.customer_name,
      status: 'pending' as const,
      retry_count: 0,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Tentar fazer UPSERT (atualizar se existir, inserir se não existir)
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from('provisioning_queue')
      .upsert(queuePayload, { 
        onConflict: 'sale_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (queueError) {
      console.error('❌ Erro ao inserir na fila:', queueError)
      return NextResponse.json(
        { success: false, error: 'Erro ao adicionar venda na fila de provisionamento' },
        { status: 500 }
      )
    }

    console.log('✅ Venda adicionada à fila de provisionamento')
    console.log('🆔 Queue ID:', queueItem.id)

    // 5️⃣ REGISTRAR LOG DA AÇÃO MANUAL
    await supabaseAdmin
      .from('integration_logs')
      .insert({
        integration_type: 'manual_resync',
        event_type: 'resync_sale',
        status: 'success',
        sale_id: sale.id,
        customer_email: sale.customer_email,
        request_data: { 
          action: 'manual_resync',
          triggered_by: 'admin_panel',
          original_sale_id: sale.id
        },
        response_data: { 
          queue_id: queueItem.id,
          message: 'Venda resincronizada manualmente pelo admin'
        }
      })

    return NextResponse.json({
      success: true,
      message: `Venda de ${sale.customer_email} adicionada na fila de provisionamento`,
      queueId: queueItem.id,
      saleId: sale.id,
      customerEmail: sale.customer_email,
      alreadyQueued: false
    })

  } catch (error) {
    console.error('❌ [RESYNC SALE] Erro interno:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao processar resincronização' 
      },
      { status: 500 }
    )
  }
}

// GET: Verificar status da fila de um cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerEmail = searchParams.get('email')
    const saleId = searchParams.get('saleId')

    if (!customerEmail && !saleId) {
      return NextResponse.json(
        { success: false, error: 'Email ou Sale ID necessário' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('provisioning_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (saleId) {
      query = query.eq('sale_id', saleId)
    } else if (customerEmail) {
      query = query.eq('customer_email', customerEmail)
    }

    const { data: queueItems, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar fila' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      queueItems: queueItems || []
    })

  } catch (error) {
    console.error('❌ [RESYNC SALE GET] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
