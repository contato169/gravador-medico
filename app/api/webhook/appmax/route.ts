import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const payload = await request.json()
    console.log('🔔 Appmax webhook:', JSON.stringify(payload, null, 2))
    
    // Log webhook
    await supabase.from('webhooks_logs').upsert({
      endpoint: '/api/webhook/appmax',
      payload,
      response_status: 200,
      processing_time_ms: Date.now() - startTime,
    })
    
    const orderId = payload.appmax_order_id || payload.order_id
    const status = payload.status || 'pending'
    const customerEmail = payload.customer?.email || payload.email
    const customerName = payload.customer?.name || payload.name || 'Cliente Appmax'
    const totalAmount = Number(payload.total_amount || payload.amount || 0)
    const paymentMethod = payload.payment_method
    
    if (!orderId || !customerEmail) {
      console.log('❌ Dados insuficientes:', { orderId, customerEmail })
      return NextResponse.json({ received: true }, { status: 200 })
    }
    
    // UPSERT cliente
    const { data: customer } = await supabase
      .from('customers')
      .upsert({ 
        email: customerEmail,
        name: customerName,
      }, { 
        onConflict: 'email',
        ignoreDuplicates: true 
      })
      .select('id')
      .single()
    
    // UPSERT venda
    await supabase.from('sales').upsert({
      appmax_order_id: orderId,
      customer_id: customer?.id,
      customer_email: customerEmail,
      customer_name: customerName,
      total_amount: totalAmount,
      status: status,
      payment_method: paymentMethod,
    }, { 
      onConflict: 'appmax_order_id',
      ignoreDuplicates: false 
    })
    
    console.log('✅ Venda processada:', orderId, status, totalAmount)
    return NextResponse.json({ 
      success: true, 
      order_id: orderId, 
      status 
    })
    
  } catch (error) {
    console.error('❌ Webhook erro:', error)
    
    // Log erro
    await supabase.from('webhooks_logs').upsert({
      endpoint: '/api/webhook/appmax',
      response_status: 500,
      error: error instanceof Error ? error.message : String(error),
      processing_time_ms: Date.now() - startTime,
    })
    
    // Appmax precisa de 200 sempre
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
