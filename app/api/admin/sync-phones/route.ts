import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * 🔄 API para sincronizar telefones das vendas
 * 
 * Busca telefones salvos no abandoned_carts e atualiza vendas que não têm telefone
 */

export async function POST() {
  try {
    console.log('📱 Iniciando sincronização de telefones...')

    // 1. Buscar vendas sem telefone
    const { data: salesWithoutPhone, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('id, customer_email, customer_phone')
      .is('customer_phone', null)

    if (salesError) {
      console.error('❌ Erro ao buscar vendas:', salesError)
      throw salesError
    }

    console.log(`📊 ${salesWithoutPhone?.length || 0} vendas sem telefone encontradas`)

    if (!salesWithoutPhone || salesWithoutPhone.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todas as vendas já têm telefone',
        updated: 0
      })
    }

    // 2. Buscar telefones do abandoned_carts
    const { data: carts, error: cartsError } = await supabaseAdmin
      .from('abandoned_carts')
      .select('customer_email, customer_phone')
      .not('customer_phone', 'is', null)

    if (cartsError) {
      console.error('❌ Erro ao buscar carrinhos:', cartsError)
      throw cartsError
    }

    // Criar mapa de email -> telefone (pega o mais recente)
    const phoneMap = new Map<string, string>()
    carts?.forEach(cart => {
      if (cart.customer_email && cart.customer_phone) {
        phoneMap.set(cart.customer_email.toLowerCase(), cart.customer_phone)
      }
    })

    console.log(`📞 ${phoneMap.size} telefones encontrados nos carrinhos`)

    // 3. Atualizar vendas
    let updated = 0
    const updates = []

    for (const sale of salesWithoutPhone) {
      const phone = phoneMap.get(sale.customer_email?.toLowerCase() || '')
      if (phone) {
        updates.push({
          id: sale.id,
          email: sale.customer_email,
          phone
        })
      }
    }

    // Executar updates em batch
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('sales')
        .update({ customer_phone: update.phone })
        .eq('id', update.id)

      if (!updateError) {
        updated++
        console.log(`✅ Atualizado: ${update.email} -> ${update.phone}`)
      } else {
        console.error(`❌ Erro ao atualizar ${update.email}:`, updateError)
      }
    }

    console.log(`✅ ${updated} vendas atualizadas com telefone`)

    return NextResponse.json({
      success: true,
      message: `${updated} vendas atualizadas com telefone`,
      updated,
      total_without_phone: salesWithoutPhone.length,
      phones_found: phoneMap.size
    })

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  // Health check
  return NextResponse.json({
    endpoint: '/api/admin/sync-phones',
    method: 'POST',
    description: 'Sincroniza telefones de abandoned_carts para sales'
  })
}
