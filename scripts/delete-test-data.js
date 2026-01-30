/**
 * Script para remover dados de teste do banco de dados
 * Execute: node scripts/delete-test-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lista de emails para remover
const emailsToDelete = [
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

async function deleteData() {
  console.log('🗑️  Iniciando remoção de dados de teste...\n');
  console.log('📧 Emails a serem removidos:');
  emailsToDelete.forEach(email => console.log(`   - ${email}`));
  console.log('\n');

  let totalDeleted = {
    sales: 0,
    sales_items: 0,
    users: 0,
    profiles: 0,
    checkout_attempts: 0,
    payment_attempts: 0,
    webhooks_logs: 0
  };

  // 1. Buscar IDs das vendas para esses emails
  console.log('🔍 Buscando vendas relacionadas...');
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('id, customer_email, customer_name, total_amount')
    .in('customer_email', emailsToDelete);

  if (salesError) {
    console.error('Erro ao buscar vendas:', salesError.message);
  } else if (sales && sales.length > 0) {
    console.log(`📋 Encontradas ${sales.length} vendas para remover:`);
    sales.forEach(s => console.log(`   - ${s.customer_email}: R$ ${s.total_amount} (${s.customer_name})`));
    
    const saleIds = sales.map(s => s.id);
    
    // Deletar itens das vendas primeiro (foreign key)
    const { data: deletedItems, error: itemsError } = await supabase
      .from('sales_items')
      .delete()
      .in('sale_id', saleIds)
      .select();
    
    if (itemsError) {
      console.error('Erro ao deletar sales_items:', itemsError.message);
    } else {
      totalDeleted.sales_items = deletedItems?.length || 0;
      console.log(`✅ Removidos ${totalDeleted.sales_items} itens de vendas`);
    }
    
    // Deletar as vendas
    const { data: deletedSales, error: deleteSalesError } = await supabase
      .from('sales')
      .delete()
      .in('customer_email', emailsToDelete)
      .select();
    
    if (deleteSalesError) {
      console.error('Erro ao deletar vendas:', deleteSalesError.message);
    } else {
      totalDeleted.sales = deletedSales?.length || 0;
      console.log(`✅ Removidas ${totalDeleted.sales} vendas`);
    }
  } else {
    console.log('ℹ️  Nenhuma venda encontrada para esses emails');
  }

  // 2. Deletar checkout_attempts
  console.log('\n🔍 Buscando checkout attempts...');
  const { data: deletedCheckouts, error: checkoutError } = await supabase
    .from('checkout_attempts')
    .delete()
    .in('customer_email', emailsToDelete)
    .select();
  
  if (checkoutError && !checkoutError.message.includes('does not exist')) {
    console.error('Erro ao deletar checkout_attempts:', checkoutError.message);
  } else {
    totalDeleted.checkout_attempts = deletedCheckouts?.length || 0;
    console.log(`✅ Removidos ${totalDeleted.checkout_attempts} checkout attempts`);
  }

  // 3. Deletar payment_attempts
  console.log('\n🔍 Buscando payment attempts...');
  const { data: deletedPayments, error: paymentError } = await supabase
    .from('payment_attempts')
    .delete()
    .in('customer_email', emailsToDelete)
    .select();
  
  if (paymentError && !paymentError.message.includes('does not exist')) {
    console.error('Erro ao deletar payment_attempts:', paymentError.message);
  } else {
    totalDeleted.payment_attempts = deletedPayments?.length || 0;
    console.log(`✅ Removidos ${totalDeleted.payment_attempts} payment attempts`);
  }

  // 4. Deletar da tabela users
  console.log('\n🔍 Buscando usuários...');
  const { data: deletedUsers, error: usersError } = await supabase
    .from('users')
    .delete()
    .in('email', emailsToDelete)
    .select();
  
  if (usersError && !usersError.message.includes('does not exist')) {
    console.error('Erro ao deletar users:', usersError.message);
  } else {
    totalDeleted.users = deletedUsers?.length || 0;
    console.log(`✅ Removidos ${totalDeleted.users} usuários`);
  }

  // 5. Deletar da tabela profiles
  console.log('\n🔍 Buscando perfis...');
  const { data: deletedProfiles, error: profilesError } = await supabase
    .from('profiles')
    .delete()
    .in('email', emailsToDelete)
    .select();
  
  if (profilesError && !profilesError.message.includes('does not exist')) {
    console.error('Erro ao deletar profiles:', profilesError.message);
  } else {
    totalDeleted.profiles = deletedProfiles?.length || 0;
    console.log(`✅ Removidos ${totalDeleted.profiles} perfis`);
  }

  // 6. Deletar logs de webhook que contenham esses emails
  console.log('\n🔍 Buscando logs de webhook...');
  for (const email of emailsToDelete) {
    const { data: deletedLogs, error: logsError } = await supabase
      .from('webhooks_logs')
      .delete()
      .ilike('payload', `%${email}%`)
      .select();
    
    if (!logsError) {
      totalDeleted.webhooks_logs += deletedLogs?.length || 0;
    }
  }
  console.log(`✅ Removidos ${totalDeleted.webhooks_logs} logs de webhook`);

  // Resumo final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DA LIMPEZA:');
  console.log('='.repeat(50));
  console.log(`   Vendas removidas:           ${totalDeleted.sales}`);
  console.log(`   Itens de venda removidos:   ${totalDeleted.sales_items}`);
  console.log(`   Usuários removidos:         ${totalDeleted.users}`);
  console.log(`   Perfis removidos:           ${totalDeleted.profiles}`);
  console.log(`   Checkout attempts:          ${totalDeleted.checkout_attempts}`);
  console.log(`   Payment attempts:           ${totalDeleted.payment_attempts}`);
  console.log(`   Webhook logs:               ${totalDeleted.webhooks_logs}`);
  console.log('='.repeat(50));
  
  const totalRecords = Object.values(totalDeleted).reduce((a, b) => a + b, 0);
  console.log(`\n✅ Total de ${totalRecords} registros removidos com sucesso!`);
}

deleteData().catch(console.error);
