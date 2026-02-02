/**
 * 🔐 MERCADO PAGO - SDK OFICIAL V2
 * 
 * Implementação usando o SDK oficial do Mercado Pago (Node.js)
 * para processamento de pagamentos com cartão de crédito.
 * 
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/integrate-via-cardform
 */

import { MercadoPagoConfig, Payment } from 'mercadopago'

// 🔒 Função helper para obter URL da app
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://www.gravadormedico.com.br'
  return url.replace(/[\n\r\s]/g, '').replace(/\/$/, '')
}

// =====================================================
// CONFIGURAÇÃO DO CLIENTE
// =====================================================

function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  }
  
  return new MercadoPagoConfig({ 
    accessToken,
    options: {
      timeout: 30000, // 30 segundos
    }
  })
}

// =====================================================
// INTERFACES
// =====================================================

export interface CardPaymentRequest {
  token: string                    // Token gerado pelo Brick no frontend
  transaction_amount: number       // Valor em reais (ex: 36.00)
  installments: number             // Número de parcelas (1-12)
  payment_method_id: string        // Método (visa, master, etc) - vem do Brick
  issuer_id?: string               // ID do emissor - vem do Brick
  payer: {
    email: string
    first_name?: string
    last_name?: string
    identification: {
      type: 'CPF' | 'CNPJ'
      number: string               // Apenas números
    }
    phone?: {
      area_code: string
      number: string
    }
  }
  external_reference?: string      // ID do pedido no nosso sistema
  idempotency_key?: string         // Chave de idempotência
  description?: string             // Descrição na fatura
  device_id?: string               // Device ID para antifraude
  ip_address?: string              // IP do cliente
}

export interface CardPaymentResponse {
  success: boolean
  payment_id?: number
  status?: 'approved' | 'pending' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  status_detail?: string
  error?: string
  error_code?: string
  raw_response?: any
}

// =====================================================
// PROCESSAMENTO DE PAGAMENTO COM CARTÃO (SDK)
// =====================================================

export async function processCardPaymentSDK(
  data: CardPaymentRequest,
  idempotencyKey?: string
): Promise<CardPaymentResponse> {
  
  console.log('💳 [SDK] Processando pagamento com Mercado Pago SDK v2...')
  
  try {
    const client = getClient()
    const payment = new Payment(client)
    
    // Montar body conforme documentação oficial
    const body: any = {
      transaction_amount: Number(data.transaction_amount),
      token: data.token,
      description: data.description || 'Método Gravador Médico - Acesso Vitalício',
      installments: Number(data.installments) || 1,
      payment_method_id: data.payment_method_id,
      ...(data.issuer_id && { issuer_id: Number(data.issuer_id) }),
      payer: {
        email: data.payer.email,
        first_name: data.payer.first_name,
        last_name: data.payer.last_name,
        identification: {
          type: data.payer.identification.type,
          number: data.payer.identification.number.replace(/\D/g, '')
        },
        ...(data.payer.phone && {
          phone: {
            area_code: data.payer.phone.area_code,
            number: data.payer.phone.number
          }
        })
      },
      // ✅ CORREÇÃO SOLICITADA: Nome na fatura do cartão
      statement_descriptor: 'GRAVADOR MEDICO',
      // Referência externa para cruzar dados
      external_reference: data.external_reference,
      // URL de notificação (webhook)
      notification_url: `${getAppUrl()}/api/webhooks/mercadopago-v3`,
      // Informações adicionais para antifraude
      additional_info: {
        items: [
          {
            id: 'metodo-gravador-medico-v1',
            title: 'Método Gravador Médico',
            description: 'Acesso ao método de transcrição de consultas com IA',
            picture_url: 'https://www.gravadormedico.com.br/images/novo-icon-gravadormedico.png',
            category_id: 'learnings',
            quantity: 1,
            unit_price: Number(data.transaction_amount)
          }
        ],
        ...(data.ip_address && { ip_address: data.ip_address }),
        ...(data.payer.first_name && {
          payer: {
            first_name: data.payer.first_name,
            last_name: data.payer.last_name,
            ...(data.payer.phone && {
              phone: {
                area_code: data.payer.phone.area_code,
                number: data.payer.phone.number
              }
            })
          }
        })
      },
      // Metadata para rastreamento
      metadata: {
        ...(data.device_id && { device_id: data.device_id }),
        source: 'checkout_enterprise',
        integration: 'sdk_v2'
      }
    }
    
    console.log('📦 [SDK] Payload montado:', JSON.stringify({
      transaction_amount: body.transaction_amount,
      installments: body.installments,
      payment_method_id: body.payment_method_id,
      payer_email: body.payer.email,
      statement_descriptor: body.statement_descriptor,
      external_reference: body.external_reference,
      has_token: !!body.token
    }, null, 2))
    
    // Chamar SDK com idempotência
    const requestOptions = idempotencyKey ? {
      idempotencyKey
    } : undefined
    
    const response = await payment.create({ body, requestOptions })
    
    console.log(`📊 [SDK] Resposta do Mercado Pago:`, JSON.stringify({
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      payment_method_id: response.payment_method_id,
      statement_descriptor: response.statement_descriptor
    }, null, 2))
    
    // ✅ PAGAMENTO APROVADO
    if (response.status === 'approved') {
      console.log('✅ [SDK] Pagamento APROVADO!')
      return {
        success: true,
        payment_id: response.id,
        status: response.status,
        status_detail: response.status_detail,
        raw_response: response
      }
    }
    
    // ⚠️ PAGAMENTO EM ANÁLISE
    if (response.status === 'in_process' || response.status === 'pending' || response.status === 'authorized') {
      console.log(`⏳ [SDK] Pagamento em processamento: ${response.status}`)
      return {
        success: false, // Não é sucesso imediato, precisa aguardar webhook
        payment_id: response.id,
        status: response.status as CardPaymentResponse['status'],
        status_detail: response.status_detail,
        raw_response: response
      }
    }
    
    // ❌ PAGAMENTO RECUSADO
    console.log(`❌ [SDK] Pagamento recusado: ${response.status_detail}`)
    return {
      success: false,
      payment_id: response.id,
      status: response.status as CardPaymentResponse['status'],
      status_detail: response.status_detail,
      error: response.status_detail || 'Pagamento recusado',
      error_code: response.status_detail,
      raw_response: response
    }
    
  } catch (error: any) {
    console.error('❌ [SDK] Erro ao processar pagamento:', error)
    
    // Extrair detalhes do erro
    const errorMessage = error.message || 'Erro desconhecido'
    const errorCode = error.cause?.[0]?.code || error.status || 'unknown'
    
    return {
      success: false,
      error: errorMessage,
      error_code: errorCode,
      raw_response: error
    }
  }
}

// =====================================================
// BUSCAR PAGAMENTO POR ID
// =====================================================

export async function getPaymentById(paymentId: number | string): Promise<any> {
  try {
    const client = getClient()
    const payment = new Payment(client)
    
    const response = await payment.get({ id: Number(paymentId) })
    
    return {
      success: true,
      payment: response
    }
  } catch (error: any) {
    console.error('❌ [SDK] Erro ao buscar pagamento:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// =====================================================
// HELPERS PARA MAPEAR ERROS
// =====================================================

export function isRetryableError(statusDetail: string): boolean {
  // Erros que DEVEM tentar gateway alternativo (problema no gateway, não no cartão)
  const retryableErrors = [
    'cc_rejected_high_risk',
    'cc_rejected_blacklist',
    'cc_rejected_other_reason',
    'cc_rejected_call_for_authorize',
    'cc_rejected_duplicated_payment',
    'cc_rejected_max_attempts'
  ]
  
  return retryableErrors.includes(statusDetail)
}

export function isUserError(statusDetail: string): boolean {
  // Erros que NÃO devem tentar (problema nos dados fornecidos pelo cliente)
  const userErrors = [
    'cc_rejected_bad_filled_card_number',
    'cc_rejected_bad_filled_security_code',
    'cc_rejected_bad_filled_date',
    'cc_rejected_bad_filled_other',
    'cc_rejected_invalid_installments',
    'cc_rejected_insufficient_amount'
  ]
  
  return userErrors.includes(statusDetail)
}

export function getErrorMessage(statusDetail: string): string {
  const errorMessages: Record<string, string> = {
    'cc_rejected_bad_filled_card_number': 'Verifique o número do cartão',
    'cc_rejected_bad_filled_security_code': 'Verifique o código de segurança',
    'cc_rejected_bad_filled_date': 'Verifique a data de validade',
    'cc_rejected_bad_filled_other': 'Verifique os dados do cartão',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente',
    'cc_rejected_high_risk': 'Pagamento não autorizado',
    'cc_rejected_blacklist': 'Pagamento não autorizado',
    'cc_rejected_call_for_authorize': 'Entre em contato com o banco',
    'cc_rejected_duplicated_payment': 'Pagamento duplicado',
    'cc_rejected_max_attempts': 'Limite de tentativas excedido',
    'cc_rejected_invalid_installments': 'Parcelas inválidas',
    'cc_rejected_other_reason': 'Pagamento não autorizado',
    'pending_contingency': 'Pagamento em processamento',
    'pending_review_manual': 'Pagamento em análise'
  }
  
  return errorMessages[statusDetail] || 'Pagamento recusado. Tente outro cartão.'
}
