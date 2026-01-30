#!/usr/bin/env tsx
// =====================================================
// SCRIPT DE TESTE: Conexão com Lovable Edge Function
// =====================================================
// Execute: npx tsx scripts/test-lovable-connection.ts
// =====================================================

const LOVABLE_URL = 'https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager'
const API_SECRET = '26+Sucesso+GH'

async function testConnection() {
  console.log('🔍 Testando conexão com Lovable...\n')
  console.log('URL:', LOVABLE_URL)
  console.log('Secret:', API_SECRET)
  console.log('\n' + '='.repeat(60) + '\n')

  try {
    // =====================================================
    // TESTE 1: Listar usuários (GET)
    // =====================================================
    console.log('📋 TESTE 1: Listando usuários...')
    
    const response = await fetch(LOVABLE_URL, {
      method: 'GET',
      headers: {
        'x-api-secret': API_SECRET,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro na requisição:', response.status)
      console.error('Resposta:', JSON.stringify(data, null, 2))
      return
    }

    console.log('✅ Conexão estabelecida!')
    console.log(`📊 Total de usuários: ${data.total || 0}`)
    
    if (data.users && data.users.length > 0) {
      console.log('\n👥 Primeiros 3 usuários:')
      data.users.slice(0, 3).forEach((user: any, index: number) => {
        console.log(`\n  ${index + 1}. ${user.email}`)
        console.log(`     Nome: ${user.full_name}`)
        console.log(`     ID: ${user.id}`)
        console.log(`     Criado: ${user.created_at}`)
        console.log(`     Email confirmado: ${user.email_confirmed_at ? '✅ Sim' : '❌ Não'}`)
      })
    } else {
      console.log('\n📭 Nenhum usuário encontrado (banco vazio)')
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n💥 ERRO:', error)
    console.error('\n⚠️  Verifique:')
    console.error('   1. A URL da Edge Function está correta?')
    console.error('   2. O API Secret está correto?')
    console.error('   3. A Edge Function está deployada no Lovable?')
    console.error('   4. O CORS está configurado corretamente?')
  }
}

testConnection()
