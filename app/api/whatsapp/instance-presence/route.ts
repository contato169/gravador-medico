// ================================================================
// API: Definir presença global da instância via Evolution API
// ================================================================

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { presence } = await request.json()

    console.log('🟢 [/api/whatsapp/instance-presence] Payload:', { presence })

    if (!presence || typeof presence !== 'string') {
      return NextResponse.json(
        { success: false, message: 'presence é obrigatório' },
        { status: 400 }
      )
    }

    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      throw new Error('Variáveis de ambiente da Evolution API não configuradas')
    }

    const url = `${EVOLUTION_API_URL}/instance/setPresence/${EVOLUTION_INSTANCE_NAME}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ presence })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erro da Evolution API:', error)
      throw new Error(`Erro ao definir presença da instância: ${response.statusText}`)
    }

  const data = await response.json()
  console.log('✅ [/api/whatsapp/instance-presence] Resposta Evolution:', data)

    return NextResponse.json({
      success: true,
      message: 'Presença da instância atualizada',
      data
    })
  } catch (error) {
    console.error('❌ Erro ao definir presença da instância:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
