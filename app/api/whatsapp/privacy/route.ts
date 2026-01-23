// ================================================================
// API: Atualizar privacidade do perfil via Evolution API
// ================================================================

import { NextRequest, NextResponse } from 'next/server'

const allowedPrivacyValues = new Set(['all', 'contacts', 'contact_blacklist', 'none'])

function isValidPrivacy(value: unknown) {
  return typeof value === 'string' && allowedPrivacyValues.has(value)
}

export async function POST(request: NextRequest) {
  try {
    const { last_seen, online, profile_photo, status, readreceipts } = await request.json()

    console.log('🟢 [/api/whatsapp/privacy] Payload:', {
      last_seen,
      online,
      profile_photo,
      status,
      readreceipts
    })

    const payload: Record<string, string> = {}

    if (last_seen !== undefined) {
      if (!isValidPrivacy(last_seen)) {
        return NextResponse.json(
          { success: false, message: 'last_seen inválido' },
          { status: 400 }
        )
      }
      payload.last_seen = last_seen
    }

    if (online !== undefined) {
      if (!isValidPrivacy(online)) {
        return NextResponse.json(
          { success: false, message: 'online inválido' },
          { status: 400 }
        )
      }
      payload.online = online
    }

    if (profile_photo !== undefined) {
      if (!isValidPrivacy(profile_photo)) {
        return NextResponse.json(
          { success: false, message: 'profile_photo inválido' },
          { status: 400 }
        )
      }
      payload.profile_photo = profile_photo
    }

    if (status !== undefined) {
      if (!isValidPrivacy(status)) {
        return NextResponse.json(
          { success: false, message: 'status inválido' },
          { status: 400 }
        )
      }
      payload.status = status
    }

    if (readreceipts !== undefined) {
      if (!isValidPrivacy(readreceipts)) {
        return NextResponse.json(
          { success: false, message: 'readreceipts inválido' },
          { status: 400 }
        )
      }
      payload.readreceipts = readreceipts
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhuma configuração enviada' },
        { status: 400 }
      )
    }

    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      throw new Error('Variáveis de ambiente da Evolution API não configuradas')
    }

    const url = `${EVOLUTION_API_URL}/profile-settings/update-privacy-settings/${EVOLUTION_INSTANCE_NAME}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erro da Evolution API:', error)
      throw new Error(`Erro ao atualizar privacidade: ${response.statusText}`)
    }

  const data = await response.json()
  console.log('✅ [/api/whatsapp/privacy] Resposta Evolution:', data)

    return NextResponse.json({
      success: true,
      message: 'Privacidade atualizada',
      data
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar privacidade:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
