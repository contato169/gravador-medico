/**
 * Integração com Mercado Pago - API de Pagamentos
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing
 */

// 🔒 Função helper para obter URL da app sem quebras de linha ou espaços
function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://www.gravadormedico.com.br'
  // Remove quebras de linha, espaços e barra final
  return url.replace(/[\n\r\s]/g, '').replace(/\/$/, '')
}

export interface MercadoPagoPaymentData {
  customer: {
    name: string
    email: string
    phone: string
    cpf: string
  }
  amount: number
  payment_method: 'pix' | 'credit_card'
  ip_address?: string
  card_data?: {
    number: string
    holder_name: string
    exp_month: string
    exp_year: string
    cvv: string
    installments?: number
  }
}

export interface MercadoPagoPaymentResult {
  success: boolean
  payment_id: string
  status: 'approved' | 'pending' | 'rejected' | 'in_process'
  status_detail?: string
  qr_code?: string
  qr_code_base64?: string
  error?: string
}

export async function processPayment(
  data: MercadoPagoPaymentData
): Promise<MercadoPagoPaymentResult> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      error: 'MERCADOPAGO_ACCESS_TOKEN não configurado'
    }
  }

  console.log(`💳 Mercado Pago: Processando ${data.payment_method}...`)

  try {
    if (data.payment_method === 'pix') {
      return await processPixPayment(data, accessToken)
    } else {
      return await processCreditCardPayment(data, accessToken)
    }
  } catch (error: any) {
    console.error('❌ Erro Mercado Pago:', error.message)
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      error: error.message
    }
  }
}

async function processPixPayment(
  data: MercadoPagoPaymentData,
  accessToken: string
): Promise<MercadoPagoPaymentResult> {
  console.log('🔵 Gerando PIX no Mercado Pago...')

  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Idempotency-Key': `pix-${data.customer.email}-${Date.now()}`
    },
    body: JSON.stringify({
      transaction_amount: data.amount,
      description: 'Gravador Médico - Acesso Vitalício',
      payment_method_id: 'pix',
      payer: {
        email: data.customer.email,
        first_name: data.customer.name.split(' ')[0],
        last_name: data.customer.name.split(' ').slice(1).join(' ') || data.customer.name.split(' ')[0],
        identification: {
          type: 'CPF',
          number: data.customer.cpf.replace(/\D/g, '')
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
            unit_price: Number(data.amount)
          }
        ],
        ip_address: data.ip_address || '127.0.0.1'
      },
      notification_url: `${getAppUrl()}/api/webhooks/mercadopago`,
      statement_descriptor: 'GRAVADOR MEDICO',
      external_reference: `MP-${Date.now()}`
    })
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Erro API Mercado Pago:', error)
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      error: error.message || 'Erro ao gerar PIX'
    }
  }

  const payment = await response.json()
  
  console.log('✅ PIX gerado:', payment.id)

  return {
    success: true,
    payment_id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail,
    qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
    qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64
  }
}

async function processCreditCardPayment(
  data: MercadoPagoPaymentData,
  accessToken: string
): Promise<MercadoPagoPaymentResult> {
  console.log('💳 Processando cartão no Mercado Pago...')

  if (!data.card_data) {
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      error: 'Dados do cartão não fornecidos'
    }
  }
  
  const cardToken = await createCardToken(data.card_data, accessToken)

  if (!cardToken) {
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      error: 'Falha ao tokenizar cartão'
    }
  }

  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Idempotency-Key': `card-${data.customer.email}-${Date.now()}`
    },
    body: JSON.stringify({
      transaction_amount: data.amount,
      token: cardToken,
      description: 'Gravador Médico - Acesso Vitalício',
      installments: data.card_data.installments || 1,
      payment_method_id: 'visa',
      payer: {
        email: data.customer.email,
        identification: {
          type: 'CPF',
          number: data.customer.cpf.replace(/\D/g, '')
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
            unit_price: Number(data.amount)
          }
        ],
        ip_address: data.ip_address || '127.0.0.1'
      },
      notification_url: `${getAppUrl()}/api/webhooks/mercadopago`,
      statement_descriptor: 'GRAVADOR MEDICO',
      external_reference: `MP-${Date.now()}`
    })
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Erro API Mercado Pago:', error)
    return {
      success: false,
      payment_id: '',
      status: 'rejected',
      error: error.message || error.cause?.[0]?.description || 'Pagamento recusado'
    }
  }

  const payment = await response.json()
  
  console.log(`${payment.status === 'approved' ? '✅' : '⚠️'} Cartão processado:`, payment.status)

  return {
    success: payment.status === 'approved',
    payment_id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail
  }
}

async function createCardToken(
  cardData: NonNullable<MercadoPagoPaymentData['card_data']>,
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.mercadopago.com/v1/card_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        card_number: cardData.number.replace(/\s/g, ''),
        cardholder: {
          name: cardData.holder_name
        },
        security_code: cardData.cvv,
        expiration_month: parseInt(cardData.exp_month),
        expiration_year: parseInt(cardData.exp_year)
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Erro ao tokenizar cartão:', error)
      return null
    }

    const token = await response.json()
    return token.id
  } catch (error) {
    console.error('❌ Erro na tokenização:', error)
    return null
  }
}

export async function getPaymentStatus(paymentId: string): Promise<any> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Erro ao consultar pagamento')
  }

  return response.json()
}

export async function refundPayment(paymentId: string): Promise<any> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao estornar pagamento')
  }

  return response.json()
}
