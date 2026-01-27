import { NextRequest, NextResponse } from 'next/server'
import { handleMercadoPagoWebhookEnterprise } from '@/lib/mercadopago-webhook-enterprise'

/**
 * 🧪 WEBHOOK ROUTE - MERCADO PAGO TEST MODE
 * 
 * Endpoint para receber notificações de TESTE do Mercado Pago
 * URL de configuração no MP: https://seu-dominio.com/api/webhooks/mercadopago-test
 */

export async function POST(request: NextRequest) {
  console.log('🧪 [WEBHOOK TEST] Recebendo notificação de TESTE do Mercado Pago')

  try {
    const body = await request.json()
    
    console.log('🧪 [WEBHOOK TEST] Payload recebido:', JSON.stringify(body, null, 2))

    // Processar webhook usando o mesmo handler enterprise
    const result = await handleMercadoPagoWebhookEnterprise(body)

    if (result.status === 200) {
      console.log('✅ [WEBHOOK TEST] Processado com sucesso:', result.message)
      return NextResponse.json({ 
        received: true, 
        mode: 'test',
        ...result 
      })
    } else {
      console.error('❌ [WEBHOOK TEST] Erro ao processar:', result.error || result.message)
      return NextResponse.json({ 
        received: true, 
        mode: 'test',
        message: result.message,
        error: result.error 
      }, { status: result.status })
    }

  } catch (error: any) {
    console.error('❌ [WEBHOOK TEST] Erro crítico:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      mode: 'test',
      details: error.message 
    }, { status: 500 })
  }
}

// GET para testar se o endpoint está respondendo
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    mode: 'test',
    endpoint: 'mercadopago-test',
    message: '🧪 Webhook de TESTE pronto para receber notificações'
  })
}
