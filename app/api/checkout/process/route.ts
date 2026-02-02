import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 🔒 Função helper para obter URL da app sem quebras de linha ou espaços
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://www.gravadormedico.com.br'
  // Remove quebras de linha, espaços e barra final
  return url.replace(/[\n\r\s]/g, '').replace(/\/$/, '')
}

/**
 * 🛡️ ROTA PCI COMPLIANT - TOKENIZAÇÃO DUPLA
 * 
 * Esta rota implementa cascata inteligente com tokens gerados no frontend.
 * NUNCA recebe dados sensíveis de cartão, apenas tokens já criptografados.
 * 
 * FLUXO:
 * 1. Recebe mpToken e appmaxToken (ou dados para AppMax)
 * 2. Tenta cobrar no Mercado Pago com mpToken
 * 3. Se MP recusar por RISCO (não saldo), tenta AppMax
 * 4. Retorna sucesso com gateway_used e fallback_used
 */

// Códigos de erro do MP que DEVEM tentar AppMax (problema no gateway, não no cartão)
const MP_ERRORS_SHOULD_RETRY = [
  'cc_rejected_high_risk',
  'cc_rejected_blacklist',
  'cc_rejected_other_reason',
  'cc_rejected_call_for_authorize',
  'cc_rejected_duplicated_payment',
  'cc_rejected_max_attempts'
]

// Códigos que NÃO devem tentar (problema nos dados fornecidos pelo cliente)
const MP_ERRORS_DONT_RETRY = [
  'cc_rejected_bad_filled_card_number',
  'cc_rejected_bad_filled_security_code',
  'cc_rejected_bad_filled_date',
  'cc_rejected_bad_filled_other',
  'cc_rejected_invalid_installments'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 [PCI COMPLIANT] Iniciando checkout com cascata segura...')
    console.log('📦 Dados recebidos:', {
      email: body.customer?.email,
      amount: body.amount,
      payment_method: body.payment_method,
      has_mpToken: !!body.mpToken,
      has_appmax_data: !!body.appmax_data
    })

    // Validação obrigatória
    if (!body.customer || !body.amount) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios faltando (customer, amount)'
      }, { status: 400 })
    }

    const { customer, amount, payment_method, mpToken, appmax_data } = body
    const startTime = Date.now()
    const attempts: Array<any> = []

    // =====================================================
    // 1️⃣ TENTATIVA 1: MERCADO PAGO
    // =====================================================
    
    if (payment_method === 'credit_card' && mpToken) {
      try {
        console.log('💳 [1/2] Tentando Mercado Pago...')
        
        const mpStartTime = Date.now()
        
        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            'X-Idempotency-Key': `mp-${customer.email}-${Date.now()}`
          },
          body: JSON.stringify({
            token: mpToken, // ✅ Token gerado no frontend pelo SDK MP
            transaction_amount: amount,
            description: 'Gravador Médico - Acesso Vitalício',
            payment_method_id: 'credit_card',
            installments: 1,
            payer: {
              email: customer.email,
              identification: {
                type: 'CPF',
                number: customer.cpf.replace(/\D/g, '')
              }
            },
            notification_url: `${getAppUrl()}/api/webhooks/mercadopago`,
            statement_descriptor: 'GRAVADOR MEDICO'
          })
        })

        const mpResult = await mpResponse.json()
        const mpResponseTime = Date.now() - mpStartTime

        console.log(`📊 Mercado Pago respondeu em ${mpResponseTime}ms:`, {
          status: mpResult.status,
          status_detail: mpResult.status_detail,
          id: mpResult.id
        })

        attempts.push({
          gateway: 'mercadopago',
          success: mpResult.status === 'approved',
          status: mpResult.status,
          status_detail: mpResult.status_detail,
          response_time_ms: mpResponseTime,
          attempted_at: new Date().toISOString()
        })

        // ✅ MERCADO PAGO APROVOU
        if (mpResult.status === 'approved') {
          console.log('✅ [SUCCESS] Aprovado no Mercado Pago!')

          const { data: sale, error: dbError } = await supabaseAdmin.from('sales').insert({
            customer_email: customer.email,
            customer_name: customer.name,
            customer_phone: customer.phone,
            customer_cpf: customer.cpf,
            amount: amount,
            status: 'paid',
            payment_gateway: 'mercadopago',
            mercadopago_payment_id: mpResult.id,
            fallback_used: false,
            gateway_attempts: attempts,
            payment_details: mpResult,
            created_at: new Date().toISOString()
          }).select().single()

          if (dbError) {
            console.error('❌ Erro ao salvar no banco:', dbError)
            throw new Error('Pagamento aprovado mas erro ao salvar no banco')
          }

          return NextResponse.json({
            success: true,
            sale_id: sale.id,
            payment_id: mpResult.id,
            gateway_used: 'mercadopago',
            fallback_used: false,
            status: 'approved'
          })
        }

        // ⚠️ MERCADO PAGO RECUSOU - VERIFICAR SE DEVE TENTAR APPMAX
        const statusDetail = mpResult.status_detail || ''

        console.log(`⚠️ Mercado Pago recusou: ${statusDetail}`)

        // Erro do cliente (dados inválidos) - NÃO tenta AppMax
        if (MP_ERRORS_DONT_RETRY.includes(statusDetail)) {
          console.log('❌ Erro de validação (não tentará AppMax):', statusDetail)
          
          return NextResponse.json({
            success: false,
            error: 'Verifique os dados do cartão e tente novamente',
            error_code: statusDetail,
            gateway_used: 'mercadopago',
            fallback_used: false,
            attempts
          }, { status: 400 })
        }

        // Erro de risco/recusa - PODE tentar AppMax
        if (MP_ERRORS_SHOULD_RETRY.includes(statusDetail) || statusDetail.includes('rejected')) {
          console.log('🔄 Erro elegível para retry, tentando AppMax...')
        } else {
          console.log('🔄 Erro genérico, tentando AppMax como fallback...')
        }

      } catch (mpError: any) {
        console.error('❌ Erro crítico no Mercado Pago:', mpError.message)
        
        attempts.push({
          gateway: 'mercadopago',
          success: false,
          error: mpError.message,
          response_time_ms: Date.now() - startTime,
          attempted_at: new Date().toISOString()
        })
      }
    } else if (payment_method === 'pix' && mpToken) {
      // PIX do Mercado Pago (sem fallback, PIX é único por gateway)
      console.log('💳 Gerando PIX no Mercado Pago...')
      
      // TODO: Implementar geração de PIX MP
      return NextResponse.json({
        success: false,
        error: 'PIX do Mercado Pago em implementação'
      }, { status: 501 })
    }

    // =====================================================
    // 2️⃣ TENTATIVA 2: APPMAX (FALLBACK)
    // =====================================================

    if (appmax_data) {
      try {
        console.log('💳 [2/2] Tentando AppMax (gateway de backup)...')
        
        const appmaxStartTime = Date.now()

        // AppMax usa dados brutos (não token), mas via SSL seguro
        const appmaxResponse = await fetch('https://admin.appmax.com.br/api/v3/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': process.env.APPMAX_TOKEN!
          },
          body: JSON.stringify({
            customer: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              cpf: customer.cpf
            },
            product_id: process.env.APPMAX_PRODUCT_ID,
            quantity: 1,
            payment_method: appmax_data.payment_method,
            card_data: appmax_data.card_data, // Dados brutos vindos do frontend via SSL
            order_bumps: appmax_data.order_bumps || []
          })
        })

        const appmaxResult = await appmaxResponse.json()
        const appmaxResponseTime = Date.now() - appmaxStartTime

        console.log(`📊 AppMax respondeu em ${appmaxResponseTime}ms:`, {
          success: appmaxResult.success,
          order_id: appmaxResult.order?.id
        })

        attempts.push({
          gateway: 'appmax',
          success: appmaxResult.success,
          error: appmaxResult.error,
          response_time_ms: appmaxResponseTime,
          attempted_at: new Date().toISOString()
        })

        // ✅ APPMAX APROVOU (VENDA RESGATADA!)
        if (appmaxResult.success) {
          console.log('✅ [RESCUED] Aprovado no AppMax (venda resgatada)!')

          const { data: sale, error: dbError } = await supabaseAdmin.from('sales').insert({
            customer_email: customer.email,
            customer_name: customer.name,
            customer_phone: customer.phone,
            customer_cpf: customer.cpf,
            amount: amount,
            status: appmaxResult.payment?.status === 'paid' ? 'paid' : 'pending',
            payment_gateway: 'appmax',
            appmax_order_id: appmaxResult.order?.id,
            fallback_used: true, // ✅ MARCA COMO VENDA RESGATADA
            gateway_attempts: attempts,
            payment_details: appmaxResult,
            created_at: new Date().toISOString()
          }).select().single()

          if (dbError) {
            console.error('❌ Erro ao salvar no banco:', dbError)
            throw new Error('Pagamento aprovado mas erro ao salvar no banco')
          }

          return NextResponse.json({
            success: true,
            sale_id: sale.id,
            payment_id: appmaxResult.order?.id,
            gateway_used: 'appmax',
            fallback_used: true, // ✅ Frontend sabe que foi resgatado
            status: appmaxResult.payment?.status,
            qr_code: appmaxResult.payment?.qr_code,
            qr_code_base64: appmaxResult.payment?.qr_code_base64
          })
        }

        // ❌ APPMAX TAMBÉM RECUSOU
        console.log('❌ AppMax também recusou:', appmaxResult.error)

      } catch (appmaxError: any) {
        console.error('❌ Erro crítico no AppMax:', appmaxError.message)
        
        attempts.push({
          gateway: 'appmax',
          success: false,
          error: appmaxError.message,
          response_time_ms: Date.now() - startTime,
          attempted_at: new Date().toISOString()
        })
      }
    }

    // =====================================================
    // ❌ AMBOS OS GATEWAYS RECUSARAM
    // =====================================================

    console.log('❌ [FAILED] Pagamento recusado por todos os gateways disponíveis')

    // Salvar tentativa falhada para análise
    await supabaseAdmin.from('payment_attempts').insert({
      customer_email: customer.email,
      amount: amount,
      gateway_attempts: attempts,
      final_status: 'rejected',
      error: 'Recusado por todos os gateways',
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: false,
      error: 'Pagamento recusado. Tente outro cartão ou entre em contato com seu banco.',
      attempts,
      total_attempts: attempts.length
    }, { status: 402 }) // 402 Payment Required

  } catch (error: any) {
    console.error('❌ [CRITICAL ERROR] Erro inesperado no checkout:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro inesperado ao processar pagamento. Tente novamente.',
      details: error.message
    }, { status: 500 })
  }
}

// =====================================================
// HEALTH CHECK
// =====================================================

export async function GET() {
  const checks = {
    mp_token_configured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    appmax_token_configured: !!process.env.APPMAX_TOKEN,
    supabase_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    app_url_configured: !!process.env.NEXT_PUBLIC_APP_URL
  }

  const allConfigured = Object.values(checks).every(v => v)

  return NextResponse.json({
    status: allConfigured ? 'ok' : 'misconfigured',
    checks,
    message: allConfigured 
      ? '✅ Todas as variáveis de ambiente configuradas'
      : '⚠️ Algumas variáveis de ambiente estão faltando'
  }, { status: allConfigured ? 200 : 503 })
}
