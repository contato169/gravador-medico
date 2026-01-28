import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLastPayment() {
  console.log('\n🔍 Verificando última tentativa de pagamento...\n')

  // Buscar últimas transações
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (ordersError) {
    console.error('❌ Erro ao buscar pedidos:', ordersError)
    return
  }

  console.log('📦 Últimos 5 pedidos:')
  console.log('=' .repeat(80))
  
  for (const order of orders || []) {
    console.log(`\nID: ${order.id}`)
    console.log(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`)
    console.log(`Email: ${order.customer_email}`)
    console.log(`Status: ${order.order_status}`)
    console.log(`Gateway: ${order.payment_gateway}`)
    console.log(`Valor: R$ ${(order.amount / 100).toFixed(2)}`)
    console.log(`External ID: ${order.external_id || 'N/A'}`)
    console.log(`MP Payment ID: ${order.mercadopago_payment_id || 'N/A'}`)
    console.log('-'.repeat(80))
  }

  // Buscar logs de webhook do Mercado Pago
  const { data: webhookLogs, error: webhookError } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('provider', 'mercadopago')
    .order('created_at', { ascending: false })
    .limit(10)

  if (webhookError) {
    console.error('\n❌ Erro ao buscar logs de webhook:', webhookError)
  } else {
    console.log('\n\n📨 Últimos 10 webhooks do Mercado Pago:')
    console.log('=' .repeat(80))
    
    for (const log of webhookLogs || []) {
      console.log(`\nData: ${new Date(log.created_at).toLocaleString('pt-BR')}`)
      console.log(`Event: ${log.event_type}`)
      console.log(`Status: ${log.status}`)
      console.log(`Payment ID: ${log.payment_id || 'N/A'}`)
      if (log.error) {
        console.log(`Erro: ${log.error}`)
      }
      console.log('-'.repeat(80))
    }
  }

  // Verificar se há algum pagamento pendente processamento
  const { data: pendingOrders, error: pendingError } = await supabase
    .from('orders')
    .select('*')
    .in('order_status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (!pendingError && pendingOrders && pendingOrders.length > 0) {
    console.log('\n\n⏳ Pedidos pendentes/processando:')
    console.log('=' .repeat(80))
    
    for (const order of pendingOrders) {
      console.log(`\nID: ${order.id}`)
      console.log(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`)
      console.log(`Email: ${order.customer_email}`)
      console.log(`Status: ${order.order_status}`)
      console.log(`Gateway: ${order.payment_gateway}`)
      console.log(`MP Payment ID: ${order.mercadopago_payment_id || 'N/A'}`)
      
      // Se tiver MP Payment ID, verificar status na API do MP
      if (order.mercadopago_payment_id) {
        const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
        if (mpToken) {
          try {
            const response = await fetch(
              `https://api.mercadopago.com/v1/payments/${order.mercadopago_payment_id}`,
              {
                headers: {
                  'Authorization': `Bearer ${mpToken}`,
                },
              }
            )
            
            if (response.ok) {
              const mpData = await response.json()
              console.log(`   ↳ Status no MP: ${mpData.status}`)
              console.log(`   ↳ Status Detail: ${mpData.status_detail}`)
            } else {
              console.log(`   ↳ Erro ao consultar MP: ${response.status}`)
            }
          } catch (error) {
            console.log(`   ↳ Erro ao consultar MP: ${error}`)
          }
        }
      }
      console.log('-'.repeat(80))
    }
  }

  console.log('\n✅ Verificação concluída!\n')
}

checkLastPayment().catch(console.error)
