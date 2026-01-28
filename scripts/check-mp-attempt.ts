import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkMPAttempt() {
  console.log('\n🔍 Verificando tentativas do Mercado Pago...\n')

  // 1. Buscar vendas com tentativas de pagamento
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (salesError) {
    console.error('❌ Erro ao buscar vendas:', salesError)
  } else {
    console.log('📦 Últimas 10 vendas (incluindo falhas):')
    console.log('=' .repeat(100))
    
    for (const sale of sales || []) {
      console.log(`\nID: ${sale.id}`)
      console.log(`Data: ${new Date(sale.created_at).toLocaleString('pt-BR')}`)
      console.log(`Email: ${sale.customer_email}`)
      console.log(`Status: ${sale.order_status}`)
      console.log(`Gateway: ${sale.payment_gateway}`)
      console.log(`Fallback usado: ${sale.fallback_used ? 'SIM' : 'NÃO'}`)
      console.log(`MP Payment ID: ${sale.mercadopago_payment_id || 'N/A'}`)
      console.log(`AppMax Order ID: ${sale.appmax_order_id || 'N/A'}`)
      
      // Mostrar tentativas de pagamento se houver
      if (sale.payment_attempts && Array.isArray(sale.payment_attempts)) {
        console.log(`\n   📊 Tentativas de pagamento (${sale.payment_attempts.length}):`)
        sale.payment_attempts.forEach((attempt: any, idx: number) => {
          console.log(`   ${idx + 1}. Gateway: ${attempt.gateway}`)
          console.log(`      Status: ${attempt.status}`)
          console.log(`      Timestamp: ${new Date(attempt.timestamp).toLocaleString('pt-BR')}`)
          if (attempt.error) {
            console.log(`      Erro: ${attempt.error}`)
          }
          if (attempt.payment_id) {
            console.log(`      Payment ID: ${attempt.payment_id}`)
          }
        })
      }
      
      console.log('-'.repeat(100))
    }
  }

  // 2. Buscar especificamente pelo email de teste
  console.log('\n\n🔎 Buscando vendas do teste específico (teste@cartao.com)...\n')
  
  const { data: testSales, error: testError } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_email', 'teste@cartao.com')
    .order('created_at', { ascending: false })

  if (!testError && testSales && testSales.length > 0) {
    console.log(`✅ Encontradas ${testSales.length} venda(s) de teste:\n`)
    
    for (const sale of testSales) {
      console.log('=' .repeat(100))
      console.log(`ID: ${sale.id}`)
      console.log(`Data: ${new Date(sale.created_at).toLocaleString('pt-BR')}`)
      console.log(`Status: ${sale.order_status}`)
      console.log(`Gateway Final: ${sale.payment_gateway}`)
      console.log(`Fallback usado: ${sale.fallback_used ? 'SIM ✅' : 'NÃO'}`)
      console.log(`Valor: R$ ${(sale.amount / 100).toFixed(2)}`)
      console.log(`MP Payment ID: ${sale.mercadopago_payment_id || 'N/A'}`)
      console.log(`AppMax Order ID: ${sale.appmax_order_id || 'N/A'}`)
      
      if (sale.payment_attempts && Array.isArray(sale.payment_attempts)) {
        console.log(`\n📊 HISTÓRICO DE TENTATIVAS (${sale.payment_attempts.length}):\n`)
        sale.payment_attempts.forEach((attempt: any, idx: number) => {
          console.log(`${idx + 1}. ${attempt.gateway.toUpperCase()}`)
          console.log(`   ⏱️  ${new Date(attempt.timestamp).toLocaleString('pt-BR')}`)
          console.log(`   📍 Status: ${attempt.status}`)
          console.log(`   🔑 Payment ID: ${attempt.payment_id || 'N/A'}`)
          if (attempt.error) {
            console.log(`   ❌ Erro: ${attempt.error}`)
          }
          if (attempt.response_time) {
            console.log(`   ⚡ Tempo de resposta: ${attempt.response_time}ms`)
          }
          console.log('')
        })
      }
      
      // Se tiver MP Payment ID, verificar status na API do MP
      if (sale.mercadopago_payment_id && mpToken) {
        console.log('\n🔍 Consultando status no Mercado Pago...\n')
        
        try {
          const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${sale.mercadopago_payment_id}`,
            {
              headers: {
                'Authorization': `Bearer ${mpToken}`,
              },
            }
          )
          
          if (response.ok) {
            const mpData = await response.json()
            console.log('✅ Resposta do Mercado Pago:')
            console.log(`   Status: ${mpData.status}`)
            console.log(`   Status Detail: ${mpData.status_detail}`)
            console.log(`   Valor: ${mpData.transaction_amount}`)
            console.log(`   Data: ${new Date(mpData.date_created).toLocaleString('pt-BR')}`)
            console.log(`   Método: ${mpData.payment_method_id}`)
            if (mpData.status === 'rejected') {
              console.log(`   ❌ Motivo da recusa: ${mpData.status_detail}`)
            }
          } else {
            console.log(`   ⚠️ Status ${response.status}: Pagamento não encontrado ou erro`)
          }
        } catch (error) {
          console.error('   ❌ Erro ao consultar MP:', error)
        }
      }
      
      console.log('=' .repeat(100))
    }
  } else if (!testError) {
    console.log('⚠️ Nenhuma venda encontrada com o email teste@cartao.com')
  }

  console.log('\n✅ Verificação concluída!\n')
}

checkMPAttempt().catch(console.error)
