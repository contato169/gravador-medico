const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://egsmraszqnmosmtjuzhx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentData() {
  console.log('📊 Verificando dados atuais no Supabase...\n');
  
  // Contar vendas por gateway
  const { data: sales, error } = await supabase
    .from('sales')
    .select('payment_gateway, order_status, total_amount');
  
  if (error) {
    console.log('❌ Erro ao buscar vendas:', error.message);
    return;
  }
  
  console.log('✅ Total de vendas:', sales.length);
  
  // Agrupar por gateway
  const byGateway = {};
  sales.forEach(s => {
    const gw = s.payment_gateway || 'SEM_GATEWAY';
    if (!byGateway[gw]) byGateway[gw] = { count: 0, revenue: 0 };
    byGateway[gw].count++;
    byGateway[gw].revenue += Number(s.total_amount || 0);
  });
  
  console.log('\n📊 Vendas por Gateway:');
  Object.entries(byGateway).forEach(([gw, data]) => {
    console.log(`  ${gw}: ${data.count} vendas | R$ ${data.revenue.toFixed(2)}`);
  });
  
  // Agrupar por status
  const byStatus = {};
  sales.forEach(s => {
    const st = s.order_status || 'SEM_STATUS';
    if (!byStatus[st]) byStatus[st] = 0;
    byStatus[st]++;
  });
  
  console.log('\n📊 Vendas por Status:');
  Object.entries(byStatus).forEach(([st, count]) => {
    console.log(`  ${st}: ${count}`);
  });
}

async function executeSQLBlocks() {
  console.log('\n🔧 Executando correções SQL...\n');
  
  // 1. Verificar e testar a função get_analytics_period
  console.log('1️⃣ Testando função get_analytics_period...');
  const { data: analytics, error: analyticsError } = await supabase.rpc('get_analytics_period', {
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString()
  });
  
  if (analyticsError) {
    console.log('   ⚠️ Função não existe ou erro:', analyticsError.message);
    console.log('   ℹ️ Execute o script SQL manualmente no Supabase Dashboard');
  } else {
    console.log('   ✅ Função existe! Resultado:');
    console.log('   ', analytics);
  }
  
  // 2. Testar view sales_by_gateway
  console.log('\n2️⃣ Testando view sales_by_gateway...');
  const { data: byGateway, error: gwError } = await supabase
    .from('sales_by_gateway')
    .select('*');
  
  if (gwError) {
    console.log('   ⚠️ View não existe ou erro:', gwError.message);
  } else {
    console.log('   ✅ View existe! Resultado:');
    byGateway.forEach(row => {
      console.log(`   ${row.payment_gateway}: ${row.successful_sales} vendas | R$ ${row.total_revenue}`);
    });
  }
  
  // 3. Testar view cascata_analysis
  console.log('\n3️⃣ Testando view cascata_analysis...');
  const { data: cascata, error: cascataError } = await supabase
    .from('cascata_analysis')
    .select('*')
    .single();
  
  if (cascataError) {
    console.log('   ⚠️ View não existe ou erro:', cascataError.message);
  } else {
    console.log('   ✅ View existe! Resultado:');
    console.log(`   MP: ${cascata.mp_approved}/${cascata.mp_total} (${cascata.mp_approval_rate}%)`);
    console.log(`   AppMax Direto: ${cascata.appmax_direct}`);
    console.log(`   Resgatados: ${cascata.rescued_count}`);
  }
  
  // 4. Testar função get_gateway_stats
  console.log('\n4️⃣ Testando função get_gateway_stats...');
  const { data: gwStats, error: gwStatsError } = await supabase.rpc('get_gateway_stats', {
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString()
  });
  
  if (gwStatsError) {
    console.log('   ⚠️ Função não existe ou erro:', gwStatsError.message);
  } else {
    console.log('   ✅ Função existe! Resultado:');
    gwStats.forEach(row => {
      console.log(`   ${row.gateway}: ${row.successful_sales} vendas | R$ ${row.total_revenue} | ${row.approval_rate}%`);
    });
  }
}

async function main() {
  try {
    await checkCurrentData();
    await executeSQLBlocks();
    
    console.log('\n========================================');
    console.log('📋 RESUMO:');
    console.log('========================================');
    console.log('Se algum teste falhou, execute o script SQL:');
    console.log('database/FIX-DASHBOARD-COMPLETO.sql');
    console.log('no Supabase Dashboard > SQL Editor');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();
