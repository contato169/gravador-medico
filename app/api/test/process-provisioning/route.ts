import { NextRequest, NextResponse } from 'next/server'
import { processProvisioningQueue } from '@/lib/provisioning-worker'

/**
 * 🧪 ENDPOINT DE TESTE - Processar fila de provisionamento
 * 
 * ⚠️ ATENÇÃO: Este endpoint é PÚBLICO e deve ser removido após testes!
 * 
 * Uso:
 * GET /api/test/process-provisioning
 */

export async function GET(request: NextRequest) {
  console.log('🧪 [TEST] Iniciando processamento manual da fila...')
  
  try {
    const result = await processProvisioningQueue()
    
    console.log('✅ [TEST] Resultado:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Fila processada',
      result
    })
    
  } catch (error: any) {
    console.error('❌ [TEST] Erro:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
