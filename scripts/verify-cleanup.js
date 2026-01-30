/**
 * Script para verificar se ainda existem dados de teste no banco
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lista de emails para verificar
const emailsToCheck = [
  'gravadormedico@gmail.com',
  'teste-edge-1769477885@example.com',
  'helcinteste@gmail.com',
  'contato@helciomattos.com.br',
  'gabriel_acardoso@hotmail.com',
  'gabriel_acardoso@me.com',
  'arcfysaude@gmail.com',
  'helciomtt@gmail.com',
  'helciomattos.consultor@gmail.com',
  'unknown@mercadopago.com',
  'teste-verificacao@teste.com',
  'lifsplan@gmail.com',
  'helciodmtt@gmail.com',
  'gacardosorj@gmail.com'
];

async function verifyCleanup() {
  console.log('🔍 Verificando se os dados foram removidos corretamente...\n');

  // Tabelas para verificar
  const tablesToCheck = [
    { name: 'sales', column: 'customer_email' },
    { name: 'users', column: 'email' },
    { name: 'checkout_attempts', column: 'customer_email' },
    { name: 'payment_attempts', column: 'customer_email' },
  ];

  let allClean = true;

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table.name)
      .select('*')
      .in(table.column, emailsToCheck);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`ℹ️  Tabela ${table.name} não existe`);
      } else {
        console.error(`❌ Erro ao verificar ${table.name}:`, error.message);
      }
    } else if (data && data.length > 0) {
      console.log(`⚠️  Encontrados ${data.length} registros em ${table.name}`);
      data.forEach(d => console.log(`   - ${d[table.column]}`));
      allClean = false;
    } else {
      console.log(`✅ Tabela ${table.name}: limpa`);
    }
  }

  // Verificar contagem total de vendas restantes
  const { count: salesCount } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total de vendas restantes no banco: ${salesCount || 0}`);

  // Verificar contagem total de usuários restantes
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total de usuários restantes no banco: ${usersCount || 0}`);

  if (allClean) {
    console.log('\n✅ TODOS OS DADOS DE TESTE FORAM REMOVIDOS COM SUCESSO!');
  } else {
    console.log('\n⚠️  Alguns dados ainda precisam ser removidos manualmente');
  }
}

verifyCleanup().catch(console.error);
