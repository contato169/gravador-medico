#!/usr/bin/env node

/**
 * Script para migrar telefones e CPFs do checkout_attempts para sales
 * Executa diretamente no banco via Supabase Admin
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migratePhonesAndCPF() {
  console.log('🔄 Iniciando migração de telefones e CPFs...\n')

  try {
    // 1. Buscar vendas sem telefone
    console.log('📊 Buscando vendas sem telefone...')
    const { data: salesWithoutPhone, error: salesError } = await supabase
      .from('sales')
      .select('id, customer_email, appmax_order_id, customer_phone, customer_cpf')
      .or('customer_phone.is.null,customer_phone.eq.')
      .in('status', ['paid', 'provisioning', 'active'])

    if (salesError) {
      throw new Error(`Erro ao buscar vendas: ${salesError.message}`)
    }

    console.log(`   Encontradas ${salesWithoutPhone?.length || 0} vendas sem telefone\n`)

    if (!salesWithoutPhone || salesWithoutPhone.length === 0) {
      console.log('✅ Nenhuma venda precisa de atualização!')
      return
    }

    // 2. Buscar dados em checkout_attempts
    console.log('📞 Buscando dados em checkout_attempts...')
    const emails = salesWithoutPhone.map(s => s.customer_email)
    const { data: checkoutData, error: checkoutError } = await supabase
      .from('checkout_attempts')
      .select('customer_email, customer_phone, customer_cpf, appmax_order_id')
      .in('customer_email', emails)
      .not('customer_phone', 'is', null)

    if (checkoutError) {
      throw new Error(`Erro ao buscar checkout: ${checkoutError.message}`)
    }

    console.log(`   Encontrados ${checkoutData?.length || 0} registros com telefone\n`)

    // 3. Criar mapa de dados
    const dataMap = new Map()
    checkoutData?.forEach(checkout => {
      const key = checkout.customer_email
      if (!dataMap.has(key) && checkout.customer_phone) {
        dataMap.set(key, {
          phone: checkout.customer_phone,
          cpf: checkout.customer_cpf
        })
      }
    })

    // 4. Atualizar vendas
    console.log('🔄 Atualizando vendas...\n')
    let updated = 0
    const updates = []

    for (const sale of salesWithoutPhone) {
      const data = dataMap.get(sale.customer_email)
      if (data?.phone) {
        updates.push({
          id: sale.id,
          email: sale.customer_email,
          phone: data.phone,
          cpf: data.cpf || sale.customer_cpf
        })
      }
    }

    console.log(`📋 ${updates.length} vendas serão atualizadas:\n`)
    
    for (const update of updates) {
      console.log(`   ➜ ${update.email} → ${update.phone}`)
      
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          customer_phone: update.phone,
          customer_cpf: update.cpf,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)

      if (!updateError) {
        updated++
      } else {
        console.error(`     ❌ Erro: ${updateError.message}`)
      }
    }

    console.log(`\n✅ Migração concluída!`)
    console.log(`   Total sem telefone: ${salesWithoutPhone.length}`)
    console.log(`   Dados encontrados: ${updates.length}`)
    console.log(`   Atualizados: ${updated}`)

  } catch (error) {
    console.error('\n❌ Erro durante migração:', error.message)
    process.exit(1)
  }
}

// Executar
migratePhonesAndCPF()
  .then(() => {
    console.log('\n✨ Concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Falha:', error)
    process.exit(1)
  })
