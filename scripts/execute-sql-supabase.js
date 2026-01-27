/**
 * Script para executar SQL no Supabase
 * Usa a função RPC para executar comandos SQL
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://egsmraszqnmosmtjuzhx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql() {
  console.log('🚀 Iniciando execução do SQL no Supabase...\n');
  
  try {
    // 1. Verificar colunas existentes na tabela sales
    console.log('📋 1. Verificando estrutura atual da tabela sales...');
    const { data: columns, error: colError } = await supabase
      .from('sales')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.log('⚠️  Erro ao verificar tabela:', colError.message);
    } else {
      console.log('✅ Tabela sales acessível\n');
    }
    
    // 2. Criar/Atualizar a função get_analytics_period via REST API
    console.log('📋 2. Criando função get_analytics_period...');
    
    // Primeiro, vamos testar se a função já existe
    const { data: testFunc, error: testFuncErr } = await supabase
      .rpc('get_analytics_period', {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      });
    
    if (testFuncErr) {
      console.log('⚠️  Função get_analytics_period não existe ou tem erro:', testFuncErr.message);
      console.log('   → A função precisa ser criada manualmente via Supabase SQL Editor\n');
    } else {
      console.log('✅ Função get_analytics_period já existe:', testFunc);
      console.log('\n');
    }
    
    // 3. Testar função get_gateway_stats
    console.log('📋 3. Testando função get_gateway_stats...');
    const { data: gatewayStats, error: gsError } = await supabase
      .rpc('get_gateway_stats', {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      });
    
    if (gsError) {
      console.log('⚠️  Função get_gateway_stats não existe ou tem erro:', gsError.message);
      console.log('   → A função precisa ser criada manualmente via Supabase SQL Editor\n');
    } else {
      console.log('✅ Função get_gateway_stats já existe:', gatewayStats);
      console.log('\n');
    }
    
    // 4. Verificar views
    console.log('📋 4. Verificando views...');
    
    const { data: salesByGateway, error: sbgErr } = await supabase
      .from('sales_by_gateway')
      .select('*');
    
    if (sbgErr) {
      console.log('⚠️  View sales_by_gateway não existe:', sbgErr.message);
    } else {
      console.log('✅ View sales_by_gateway:', salesByGateway);
    }
    
    const { data: cascata, error: cascErr } = await supabase
      .from('cascata_analysis')
      .select('*');
    
    if (cascErr) {
      console.log('⚠️  View cascata_analysis não existe:', cascErr.message);
    } else {
      console.log('✅ View cascata_analysis:', cascata);
    }
    
    const { data: perf, error: perfErr } = await supabase
      .from('payment_gateway_performance')
      .select('*');
    
    if (perfErr) {
      console.log('⚠️  View payment_gateway_performance não existe:', perfErr.message);
    } else {
      console.log('✅ View payment_gateway_performance:', perf);
    }
    
    // 5. Verificar dados atuais
    console.log('\n📋 5. Verificando dados atuais na tabela sales...');
    const { data: allSales, error: salesErr } = await supabase
      .from('sales')
      .select('id, customer_email, total_amount, payment_gateway, order_status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (salesErr) {
      console.log('❌ Erro ao buscar vendas:', salesErr.message);
    } else {
      console.log('✅ Últimas vendas:');
      allSales.forEach(sale => {
        console.log(`   - ${sale.customer_email} | R$ ${sale.total_amount} | ${sale.payment_gateway} | ${sale.order_status}`);
      });
    }
    
    // 6. Contagem por gateway
    console.log('\n📋 6. Contagem por gateway...');
    const { data: mpCount } = await supabase
      .from('sales')
      .select('id', { count: 'exact' })
      .eq('payment_gateway', 'mercadopago');
    
    const { data: appCount } = await supabase
      .from('sales')
      .select('id', { count: 'exact' })
      .eq('payment_gateway', 'appmax');
    
    const { data: nullCount } = await supabase
      .from('sales')
      .select('id', { count: 'exact' })
      .is('payment_gateway', null);
    
    console.log(`   Mercado Pago: ${mpCount?.length || 0} vendas`);
    console.log(`   AppMax: ${appCount?.length || 0} vendas`);
    console.log(`   Sem gateway: ${nullCount?.length || 0} vendas`);
    
    // 7. Atualizar vendas sem gateway para 'mercadopago' se tiverem mercadopago_payment_id
    console.log('\n📋 7. Verificando vendas sem payment_gateway...');
    const { data: salesNoGateway, error: noGwErr } = await supabase
      .from('sales')
      .select('id, mercadopago_payment_id, appmax_order_id')
      .is('payment_gateway', null);
    
    if (salesNoGateway && salesNoGateway.length > 0) {
      console.log(`   Encontradas ${salesNoGateway.length} vendas sem gateway definido.`);
      
      for (const sale of salesNoGateway) {
        let gateway = null;
        if (sale.mercadopago_payment_id) {
          gateway = 'mercadopago';
        } else if (sale.appmax_order_id) {
          gateway = 'appmax';
        }
        
        if (gateway) {
          const { error: updErr } = await supabase
            .from('sales')
            .update({ payment_gateway: gateway })
            .eq('id', sale.id);
          
          if (updErr) {
            console.log(`   ❌ Erro ao atualizar venda ${sale.id}: ${updErr.message}`);
          } else {
            console.log(`   ✅ Venda ${sale.id} atualizada para ${gateway}`);
          }
        }
      }
    } else {
      console.log('   ✅ Todas as vendas já têm payment_gateway definido.');
    }
    
    console.log('\n========================================');
    console.log('✅ DIAGNÓSTICO COMPLETO');
    console.log('========================================');
    console.log('\n⚠️  AÇÃO NECESSÁRIA:');
    console.log('As funções SQL (CREATE OR REPLACE FUNCTION) e views (CREATE VIEW)');
    console.log('precisam ser criadas via Supabase SQL Editor.');
    console.log('');
    console.log('📄 Arquivo para executar: database/FIX-DASHBOARD-COMPLETO.sql');
    console.log('🔗 URL: https://supabase.com/dashboard/project/egsmraszqnmosmtjuzhx/sql/new');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executeSql();
