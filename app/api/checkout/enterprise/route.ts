import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAppmaxOrder } from '@/lib/appmax'
import { processProvisioningQueue } from '@/lib/provisioning-worker'
import { nowBrazil } from '@/lib/timezone'
import { processCardPaymentSDK, isRetryableError, isUserError, getErrorMessage } from '@/lib/mercadopago-sdk'

// 🔒 Função helper para obter URL da app sem quebras de linha ou espaços
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://www.gravadormedico.com.br'
  // Remove quebras de linha, espaços e barra final
  return url.replace(/[\n\r\s]/g, '').replace(/\/$/, '')
}

/**
 * 🏢 CHECKOUT ENTERPRISE LEVEL
 * 
 * Features:
 * - ✅ Idempotência (proteção contra clique duplo)
 * - ✅ Máquina de Estados (draft → processing → paid → provisioning → active)
 * - ✅ Payment Attempts tipados (histórico granular)
 * - ✅ Cascata inteligente MP → AppMax
 * - ✅ PCI Compliant (tokens, não dados brutos)
 * - ✅ Logging detalhado para debug (checkout_logs)
 * - ✅ Provisioning imediato (email + criação de usuário)
 */

// =====================================================
// FUNÇÃO DE LOGGING PARA DEBUG
// =====================================================

async function logCheckoutAttempt({
  session_id,
  order_id,
  gateway,
  status,
  payload_sent,
  response_data = null,
  error_response = null,
  error_message = null,
  error_cause = null,
  http_status = null
}: {
  session_id?: string
  order_id?: string
  gateway: string
  status: 'SUCCESS' | 'ERROR' | 'FALLBACK'
  payload_sent: any
  response_data?: any
  error_response?: any
  error_message?: string | null
  error_cause?: string | null
  http_status?: number | null
}) {
  try {
    await supabaseAdmin.from('checkout_logs').insert({
      session_id,
      order_id,
      gateway,
      status,
      payload_sent,
      response_data,
      error_response,
      error_message,
      error_cause,
      http_status
    })
    console.log(`📝 Log registrado: ${gateway} - ${status}`)
  } catch (logError) {
    // Não deixar o log quebrar o fluxo
    console.error('⚠️ Erro ao gravar log (não crítico):', logError)
  }
}

// =====================================================
// CONFIGURAÇÃO DE ERRO
// =====================================================

const MP_ERRORS_SHOULD_RETRY = [
  'cc_rejected_high_risk',
  'cc_rejected_blacklist',
  'cc_rejected_other_reason',
  'cc_rejected_call_for_authorize',
  'cc_rejected_duplicated_payment',
  'cc_rejected_max_attempts'
]

const MP_ERRORS_DONT_RETRY = [
  'cc_rejected_bad_filled_card_number',
  'cc_rejected_bad_filled_security_code',
  'cc_rejected_bad_filled_date',
  'cc_rejected_bad_filled_other',
  'cc_rejected_invalid_installments',
  'cc_rejected_insufficient_amount' // Sem saldo - não adianta tentar AppMax
]

// =====================================================
// MAIN HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    console.log('🏢 [ENTERPRISE] Iniciando checkout...')
    
    // =====================================================
    // 1️⃣ VALIDAÇÃO DE DADOS OBRIGATÓRIOS
    // =====================================================
    
    if (!body.customer || !body.amount || !body.idempotencyKey) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios faltando (customer, amount, idempotencyKey)'
      }, { status: 400 })
    }

    const { customer, amount, payment_method, mpToken, appmax_data, idempotencyKey, coupon_code, discount, device_id, force_gateway, payment_method_id, issuer_id, installments } = body

    // 🔥 VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS DO CLIENTE
    if (!customer.name || !customer.email || !customer.phone || !customer.cpf) {
      console.error('❌ Campos obrigatórios faltando:', {
        has_name: !!customer.name,
        has_email: !!customer.email,
        has_phone: !!customer.phone,
        has_cpf: !!customer.cpf
      })
      return NextResponse.json({
        success: false,
        error: 'Dados do cliente incompletos (nome, email, telefone e CPF são obrigatórios)'
      }, { status: 400 })
    }

    // 🔥 LOG DOS DADOS RECEBIDOS (INCLUINDO TELEFONE E DEVICE ID)
    console.log('📦 Dados recebidos no checkout:', JSON.stringify({
      amount,
      payment_method,
      has_mpToken: !!mpToken,
      has_appmax_data: !!appmax_data,
      force_gateway: force_gateway || 'none',
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_cpf: customer.cpf,
      customer_name: customer.name,
      idempotencyKey
    }, null, 2))

    // =====================================================
    // 2️⃣ CHECK DE IDEMPOTÊNCIA
    // =====================================================
    
    console.log(`🔍 Verificando idempotência: ${idempotencyKey}`)
    
    const { data: existingOrder, error: idempotencyError } = await supabaseAdmin
      .from('sales')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existingOrder) {
      console.log('⚠️ Pedido já existe (idempotência), retornando existente')
      
      return NextResponse.json({
        success: existingOrder.order_status !== 'failed',
        idempotent: true,
        order_id: existingOrder.id,
        status: existingOrder.order_status,
        payment_id: existingOrder.mercadopago_payment_id || existingOrder.appmax_order_id,
        gateway_used: existingOrder.payment_gateway,
        fallback_used: existingOrder.fallback_used,
        message: 'Pedido já processado anteriormente (idempotência)'
      })
    }

    // =====================================================
    // 3️⃣ CRIAR PEDIDO (Status: draft → processing)
    // =====================================================
    
    console.log('📝 Criando pedido...')
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('sales')
      .insert({
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_cpf: customer.cpf,
        document_type: customer.documentType || 'CPF', // CPF ou CNPJ
        company_name: customer.companyName || null, // Razão Social (quando CNPJ)
        total_amount: amount, // ✅ CORRIGIDO: usar total_amount em vez de amount
        amount: amount,        // Manter ambos para compatibilidade
        idempotency_key: idempotencyKey,
        order_status: 'processing',
        status: 'pending', // Status legado (manter compatibilidade)
        payment_method: payment_method, // ✅ NOVO: salvar método de pagamento
        payment_gateway: 'pending', // 🔥 CORREÇÃO: Definir gateway como pending até saber qual processou
        coupon_code: coupon_code || null, // ✅ NOVO: salvar código do cupom
        coupon_discount: discount || 0,   // ✅ NOVO: salvar valor do desconto
        discount: discount || 0,          // ✅ NOVO: compatibilidade
        created_at: nowBrazil() // ✅ Horário de São Paulo
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('❌ Erro ao criar pedido:', orderError)
      throw new Error('Falha ao criar pedido no banco de dados')
    }

    console.log(`✅ Pedido criado: ${order.id}`)

    // =====================================================
    // 4️⃣ TENTATIVA 1: MERCADO PAGO (ou pular se force_gateway === 'appmax')
    // =====================================================

    // 🔥 FLAG: Só tenta AppMax se MP falhar de forma elegível
    let shouldTryAppmax = false
    let mpTriedAndFailed = false

    // 🔄 FALLBACK DIRETO: Se force_gateway === 'appmax', pula MP
    if (force_gateway === 'appmax') {
      console.log('� [FALLBACK] force_gateway=appmax - Pulando Mercado Pago, indo direto para AppMax')
      shouldTryAppmax = true
      mpTriedAndFailed = true
    }

    console.log('�🔍 Verificando condições para Mercado Pago...')
    console.log(`   payment_method: ${payment_method}`)
    console.log(`   mpToken exists: ${!!mpToken}`)
    console.log(`   mpToken value: ${mpToken ? mpToken.substring(0, 20) + '...' : 'NULL'}`)
    console.log(`   payment_method_id: ${payment_method_id || 'N/A'}`)
    console.log(`   issuer_id: ${issuer_id || 'N/A'}`)
    console.log(`   force_gateway: ${force_gateway || 'none'}`)

    if (payment_method === 'credit_card' && mpToken && force_gateway !== 'appmax') {
      const mpStartTime = Date.now()
      
      try {
        console.log('💳 [1/2] Tentando Mercado Pago (SDK v2)...')
        console.log('🔐 Token MP recebido:', mpToken?.substring(0, 20) + '...')

        // 🔥 USAR SDK OFICIAL DO MERCADO PAGO
        const sdkResult = await processCardPaymentSDK({
          token: mpToken,
          transaction_amount: amount,
          installments: installments || 1,
          payment_method_id: payment_method_id || 'credit_card',
          issuer_id: issuer_id || undefined,
          payer: {
            email: customer.email,
            first_name: customer.name?.split(' ')[0] || '',
            last_name: customer.name?.split(' ').slice(1).join(' ') || '',
            identification: {
              type: (customer.documentType || 'CPF') as 'CPF' | 'CNPJ',
              number: customer.cpf.replace(/\D/g, '')
            },
            phone: {
              area_code: customer.phone?.replace(/\D/g, '').substring(0, 2) || '',
              number: customer.phone?.replace(/\D/g, '').substring(2) || ''
            }
          },
          external_reference: order.id,
          description: 'Método Gravador Médico - Acesso Vitalício',
          device_id: device_id,
          ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1'
        }, idempotencyKey)
        
        const mpResponseTime = Date.now() - mpStartTime

        // 🔥 LOG DETALHADO DA RESPOSTA
        console.log(`📊 RESPOSTA DO MERCADO PAGO SDK (${mpResponseTime}ms):`, JSON.stringify({
          success: sdkResult.success,
          status: sdkResult.status,
          status_detail: sdkResult.status_detail,
          payment_id: sdkResult.payment_id
        }, null, 2))

        // 📝 Registrar tentativa no log
        await logCheckoutAttempt({
          order_id: order.id,
          gateway: 'mercadopago',
          status: sdkResult.success ? 'SUCCESS' : 'ERROR',
          payload_sent: {
            token: mpToken ? `${mpToken.substring(0, 10)}...` : null,
            transaction_amount: amount,
            payment_method_id,
            payer_email: customer.email,
            external_reference: order.id
          },
          response_data: {
            payment_id: sdkResult.payment_id,
            status: sdkResult.status,
            status_detail: sdkResult.status_detail
          },
          error_message: sdkResult.error || null,
          error_cause: sdkResult.error_code || null
        })

        // Registrar tentativa em payment_attempts
        await supabaseAdmin.from('payment_attempts').insert({
          sale_id: order.id,
          provider: 'mercadopago',
          gateway_transaction_id: sdkResult.payment_id?.toString(),
          status: sdkResult.success ? 'success' : 'rejected',
          rejection_code: sdkResult.status_detail,
          error_message: !sdkResult.success ? sdkResult.status_detail : null,
          raw_response: sdkResult.raw_response,
          response_time_ms: mpResponseTime
        })

        // ✅ MERCADO PAGO APROVOU
        if (sdkResult.success && sdkResult.status === 'approved') {
          console.log('✅ [SUCCESS] Mercado Pago aprovou via SDK!')

          // Atualizar pedido: processing → paid
          await supabaseAdmin
            .from('sales')
            .update({
              order_status: 'paid',
              status: 'paid',
              payment_gateway: 'mercadopago',
              mercadopago_payment_id: sdkResult.payment_id?.toString(),
              current_gateway: 'mercadopago',
              fallback_used: false,
              payment_details: sdkResult.raw_response
            })
            .eq('id', order.id)

          // Adicionar à fila de provisionamento
          {
            const { error: provisioningError } = await supabaseAdmin
              .from('provisioning_queue')
              .insert({
                sale_id: order.id,
                status: 'pending'
              })

            if (provisioningError) {
              console.error('⚠️ Falha ao enfileirar provisionamento (MP):', provisioningError)
            } else {
              console.log(`📬 Adicionado na fila de provisionamento (sale_id: ${order.id})`)
              
              // 🚀 Processar fila imediatamente (fire-and-forget, não bloqueia a resposta)
              processProvisioningQueue()
                .then(result => console.log(`📧 Provisioning processado:`, result))
                .catch(err => console.error(`⚠️ Erro no provisioning:`, err))
            }
          }

          const totalTime = Date.now() - startTime
          console.log(`✅ Checkout completo em ${totalTime}ms`)

          return NextResponse.json({
            success: true,
            order_id: order.id,
            payment_id: sdkResult.payment_id,
            gateway_used: 'mercadopago',
            fallback_used: false,
            status: 'paid'
          })
        }

        // ⚠️ MERCADO PAGO RECUSOU
        const statusDetail = sdkResult.status_detail || ''
        console.log(`⚠️ MP recusou: ${statusDetail}`)

        // Erro de dados inválidos - NÃO tenta AppMax
        if (isUserError(statusDetail)) {
          console.log('❌ Erro de validação, não tentará AppMax')
          
          await supabaseAdmin
            .from('sales')
            .update({
              order_status: 'failed',
              status: 'refused'
            })
            .eq('id', order.id)

          return NextResponse.json({
            success: false,
            error: getErrorMessage(statusDetail),
            error_code: statusDetail,
            gateway_used: 'mercadopago',
            fallback_used: false
          }, { status: 400 })
        }

        // Erro elegível para retry AppMax
        if (isRetryableError(statusDetail)) {
          console.log('🔄 Erro elegível para fallback, marcando para tentar AppMax...')
        } else {
          console.log('🔄 Erro genérico, marcando para tentar AppMax...')
        }
        
        shouldTryAppmax = true
        mpTriedAndFailed = true

      } catch (mpError: any) {
        // 🔥 LOG DETALHADO DO ERRO GERAL
        console.error('❌ ERRO CRÍTICO NO MERCADO PAGO SDK:')
        console.error('Tipo:', mpError.constructor.name)
        console.error('Mensagem:', mpError.message)
        console.error('Stack completa:', mpError.stack)
        
        // 📝 Registrar erro crítico no banco
        await logCheckoutAttempt({
          order_id: order.id,
          gateway: 'mercadopago',
          status: 'ERROR',
          payload_sent: {
            token: mpToken ? `${mpToken.substring(0, 10)}...` : null,
            transaction_amount: amount
          },
          error_response: {
            error_type: mpError.constructor.name,
            error_message: mpError.message
          },
          error_message: mpError.message,
          error_cause: mpError.constructor.name
        })
        
        // Registrar erro
        await supabaseAdmin.from('payment_attempts').insert({
          sale_id: order.id,
          provider: 'mercadopago',
          status: 'failed',
          error_message: mpError.message,
          raw_response: { error: mpError.message },
          response_time_ms: Date.now() - mpStartTime
        })
        
        // 🔥 Marcar para tentar AppMax após erro crítico do MP
        shouldTryAppmax = true
        mpTriedAndFailed = true
      }
    }

    // 📱 PIX MERCADO PAGO
    if (payment_method === 'pix') {
      try {
        console.log('📱 Gerando PIX Mercado Pago...')
        
        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            'X-Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify({
            transaction_amount: amount,
            description: 'Gravador Médico - Acesso Vitalício',
            payment_method_id: 'pix',
            external_reference: order.id, // ✅ Referência para cruzar dados
            statement_descriptor: 'GRAVADOR MEDICO',
            // 🔒 Device ID para análise antifraude
            ...(device_id && { metadata: { device_id } }),
            payer: {
              email: customer.email,
              first_name: customer.name.split(' ')[0],
              last_name: customer.name.split(' ').slice(1).join(' ') || customer.name.split(' ')[0],
              identification: {
                type: customer.documentType || 'CPF', // CPF ou CNPJ
                number: customer.cpf.replace(/\D/g, '')
              }
            },
            additional_info: {
              items: [
                {
                  id: 'metodo-gravador-medico-v1',
                  title: 'Método Gravador Médico',
                  description: 'Acesso ao método de transcrição de consultas com IA',
                  picture_url: 'https://gravadormedico.com.br/logo.png',
                  category_id: 'learnings',
                  quantity: 1,
                  unit_price: Number(amount)
                }
              ],
              ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1',
              payer: {
                first_name: customer.name?.split(' ')[0] || '',
                last_name: customer.name?.split(' ').slice(1).join(' ') || '',
                phone: {
                  area_code: customer.phone?.replace(/\D/g, '').substring(0, 2) || '',
                  number: customer.phone?.replace(/\D/g, '').substring(2) || ''
                }
              }
            },
            notification_url: `${getAppUrl()}/api/webhooks/mercadopago-enterprise`
          })
        })

        const mpResult = await mpResponse.json()

        if (mpResult.status === 'pending' && mpResult.point_of_interaction?.transaction_data) {
          console.log('✅ PIX gerado com sucesso!')

          // Atualizar pedido
          await supabaseAdmin
            .from('sales')
            .update({
              order_status: 'pending_payment',
              status: 'pending',
              payment_gateway: 'mercadopago',
              mercadopago_payment_id: mpResult.id,
              fallback_used: false
            })
            .eq('id', order.id)

          // Registrar tentativa
          await supabaseAdmin.from('payment_attempts').insert({
            sale_id: order.id,
            gateway: 'mercadopago',
            status: 'pending',
            error_code: null,
            error_message: null
          })

          return NextResponse.json({
            success: true,
            order_id: order.id,
            payment_id: mpResult.id,
            gateway_used: 'mercadopago',
            pix_qr_code: mpResult.point_of_interaction.transaction_data.qr_code_base64,
            pix_emv: mpResult.point_of_interaction.transaction_data.qr_code,
            status: 'pending_payment'
          })
        }

        throw new Error('Falha ao gerar PIX no Mercado Pago')

      } catch (pixError: any) {
        console.error('❌ Erro ao gerar PIX:', pixError)
        
        await supabaseAdmin
          .from('sales')
          .update({ order_status: 'failed', status: 'failed' })
          .eq('id', order.id)

        return NextResponse.json({
          success: false,
          error: 'Falha ao gerar PIX',
          details: pixError.message
        }, { status: 500 })
      }
    }

    // =====================================================
    // 5️⃣ TENTATIVA 2: APPMAX (FALLBACK)
    // =====================================================
    // ⚠️ IMPORTANTE: Só tenta AppMax se:
    //    1. MP foi tentado E falhou (shouldTryAppmax = true)
    //    2. OU se não tinha token MP mas tem dados AppMax
    // =====================================================

    console.log('🔍 Verificando condições para AppMax...')
    console.log(`   appmax_data exists: ${!!appmax_data}`)
    console.log(`   shouldTryAppmax: ${shouldTryAppmax}`)
    console.log(`   mpTriedAndFailed: ${mpTriedAndFailed}`)
    console.log(`   payment_method: ${payment_method}`)

    // 🔥 CORREÇÃO: AppMax é APENAS para cartão de crédito como fallback
    // PIX é exclusivamente Mercado Pago - AppMax não deve processar PIX
    const shouldUseAppmax = appmax_data && 
                            payment_method === 'credit_card' && 
                            (shouldTryAppmax || !mpToken)

    if (shouldUseAppmax) {
      console.log('💳 [2/2] Tentando AppMax (fallback para cartão)...')
      const appmaxStartTime = Date.now()
      
      // Preparar payload para log
      // AppMax é APENAS para cartão de crédito, nunca PIX
      const appmaxPayload = {
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          cpf: customer.cpf,
        },
        product_id: process.env.APPMAX_PRODUCT_ID || '32991339',
        quantity: 1,
        payment_method: 'credit_card', // AppMax só processa cartão como fallback
        card_data: appmax_data.card_data ? {
          ...appmax_data.card_data,
          number: appmax_data.card_data.number ? `****${appmax_data.card_data.number.slice(-4)}` : null,
          cvv: '***' // Ocultar CVV no log
        } : null,
        order_bumps: appmax_data.order_bumps || [],
        discount: body.discount || 0,
      }
      
      try {
        console.log(' FALLBACK ACIONADO - Mercado Pago falhou ou recusou')
        console.log('📦 Dados AppMax recebidos:', {
          has_card_data: !!appmax_data.card_data,
          payment_method: 'credit_card', // Sempre cartão (fallback)
          order_bumps_count: appmax_data.order_bumps?.length || 0
        })

        // Usar a função correta do lib/appmax.ts
        // AppMax é APENAS fallback para cartão de crédito - PIX é exclusivo MP
        const appmaxResult = await createAppmaxOrder({
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            cpf: customer.cpf,
          },
          product_id: process.env.APPMAX_PRODUCT_ID || '32991339',
          quantity: 1,
          payment_method: 'credit_card', // Sempre cartão - AppMax não processa PIX
          card_data: appmax_data.card_data,
          order_bumps: appmax_data.order_bumps || [],
          discount: body.discount || 0,
        })

        const appmaxResponseTime = Date.now() - appmaxStartTime

        console.log(`📊 AppMax response: success=${appmaxResult.success} (${appmaxResponseTime}ms)`)
        console.log('📊 AppMax result:', JSON.stringify(appmaxResult, null, 2))

        // 📝 Registrar no checkout_logs
        await logCheckoutAttempt({
          order_id: order.id,
          gateway: 'appmax',
          status: appmaxResult.success ? 'SUCCESS' : 'ERROR',
          payload_sent: appmaxPayload,
          response_data: appmaxResult.success ? appmaxResult : null,
          error_response: !appmaxResult.success ? appmaxResult : null,
          error_message: !appmaxResult.success ? appmaxResult.message : null
        })

        // Registrar tentativa
        await supabaseAdmin.from('payment_attempts').insert({
          sale_id: order.id,
          provider: 'appmax',
          gateway_transaction_id: appmaxResult.order_id,
          status: appmaxResult.success ? 'success' : 'rejected',
          error_message: appmaxResult.message,
          raw_response: appmaxResult,
          response_time_ms: appmaxResponseTime
        })

        // ✅ APPMAX APROVOU (VENDA RESGATADA!)
        if (appmaxResult.success) {
          console.log('✅ [RESCUED] AppMax aprovou (venda resgatada)!')

          // Atualizar pedido: processing → paid
          await supabaseAdmin
            .from('sales')
            .update({
              order_status: 'paid',
              status: appmaxResult.status === 'approved' ? 'paid' : 'pending',
              payment_gateway: 'appmax',
              appmax_order_id: appmaxResult.order_id,
              current_gateway: 'appmax',
              fallback_used: true, // ✅ MARCA COMO RESGATADO
              payment_details: appmaxResult
            })
            .eq('id', order.id)

          // Adicionar à fila de provisionamento
          {
            const { error: provisioningError } = await supabaseAdmin
              .from('provisioning_queue')
              .insert({
                sale_id: order.id,
                status: 'pending'
              })

            if (provisioningError) {
              console.error('⚠️ Falha ao enfileirar provisionamento (AppMax):', provisioningError)
            } else {
              console.log(`📬 Adicionado na fila de provisionamento (sale_id: ${order.id})`)
              
              // 🚀 Processar fila imediatamente (fire-and-forget, não bloqueia a resposta)
              processProvisioningQueue()
                .then(result => console.log(`📧 Provisioning processado:`, result))
                .catch(err => console.error(`⚠️ Erro no provisioning:`, err))
            }
          }

          const totalTime = Date.now() - startTime
          console.log(`✅ Checkout completo em ${totalTime}ms (resgatado)`)

          return NextResponse.json({
            success: true,
            order_id: order.id,
            payment_id: appmaxResult.order_id,
            gateway_used: 'appmax',
            fallback_used: true,
            status: appmaxResult.status,
            pix_qr_code: appmaxResult.pix_qr_code,
            pix_emv: appmaxResult.pix_emv,
            redirect_url: appmaxResult.redirect_url
          })
        }

        console.log('❌ AppMax também recusou:', appmaxResult.message)

      } catch (appmaxError: any) {
        console.error('❌ Erro crítico no AppMax:', appmaxError.message)
        
        // 📝 Registrar erro do AppMax
        await logCheckoutAttempt({
          order_id: order.id,
          gateway: 'appmax',
          status: 'ERROR',
          payload_sent: appmaxPayload,
          error_response: {
            error_type: appmaxError.constructor.name,
            error_message: appmaxError.message,
            error_stack: appmaxError.stack
          },
          error_message: appmaxError.message,
          error_cause: appmaxError.constructor.name
        })
        
        await supabaseAdmin.from('payment_attempts').insert({
          sale_id: order.id,
          provider: 'appmax',
          status: 'failed',
          error_message: appmaxError.message,
          raw_response: { error: appmaxError.message },
          response_time_ms: Date.now() - startTime
        })
      }
    }

    // =====================================================
    // ❌ AMBOS RECUSARAM (OU NENHUM FOI TENTADO)
    // =====================================================

    console.log('❌ [FAILED] Nenhum gateway processou o pagamento')
    console.log('🔍 Resumo das tentativas:')
    console.log(`   MP foi tentado? ${payment_method === 'credit_card' && !!mpToken ? 'SIM' : 'NÃO'}`)
    console.log(`   AppMax foi tentado? ${!!appmax_data ? 'SIM' : 'NÃO'}`)

    // Atualizar pedido: processing → failed
    await supabaseAdmin
      .from('sales')
      .update({
        order_status: 'failed',
        status: 'refused'
      })
      .eq('id', order.id)

    return NextResponse.json({
      success: false,
      error: 'Pagamento recusado por todos os gateways. Tente outro cartão ou entre em contato com seu banco.',
      order_id: order.id,
      debug: {
        mp_attempted: payment_method === 'credit_card' && !!mpToken,
        appmax_attempted: !!appmax_data,
        payment_method,
        has_mpToken: !!mpToken,
        has_appmax_data: !!appmax_data
      }
    }, { status: 402 })

  } catch (error: any) {
    console.error('❌ [CRITICAL] Erro inesperado:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro inesperado ao processar pagamento',
      details: error.message
    }, { status: 500 })
  }
}

// =====================================================
// HEALTH CHECK
// =====================================================

export async function GET() {
  const checks: Record<string, boolean> = {
    mp_token_configured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    appmax_token_configured: !!process.env.APPMAX_TOKEN,
    supabase_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    app_url_configured: !!process.env.NEXT_PUBLIC_APP_URL
  }

  // Verificar conexão com Supabase
  try {
    const { error } = await supabaseAdmin.from('sales').select('id').limit(1)
    checks.supabase_connection = !error
  } catch (e) {
    checks.supabase_connection = false
  }

  const allConfigured = Object.values(checks).every(v => v)

  return NextResponse.json({
    status: allConfigured ? 'ok' : 'misconfigured',
    timestamp: new Date().toISOString(),
    checks,
    message: allConfigured 
      ? '✅ Sistema enterprise operacional'
      : '⚠️ Algumas variáveis de ambiente estão faltando'
  }, { status: allConfigured ? 200 : 503 })
}
