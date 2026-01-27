/**
 * Script para corrigir status das vendas no Supabase
 * Atualiza vendas pendentes para pagas e corrige valores
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

async function fixSalesStatus() {
  console.log('🔧 Corrigindo status das vendas...\n');
  
  try {
    // 1. Buscar vendas pendentes
    console.log('📋 1. Buscando vendas com status pendente...');
    const { data: pendingSales, error: fetchErr } = await supabase
      .from('sales')
      .select('*')
      .in('order_status', ['pending', 'pending_payment', 'processing']);
    
    if (fetchErr) {
      console.log('❌ Erro ao buscar vendas:', fetchErr.message);
      return;
    }
    
    console.log(`   Encontradas ${pendingSales.length} vendas pendentes\n`);
    
    if (pendingSales.length === 0) {
      console.log('✅ Nenhuma venda pendente para atualizar.');
      return;
    }
    
    // 2. Atualizar cada venda
    console.log('📋 2. Atualizando vendas para status "paid"...');
    
    for (const sale of pendingSales) {
      const updates = {
        order_status: 'paid'
      };
      
      // Corrigir total_amount se for null
      if (!sale.total_amount || sale.total_amount === 0) {
        updates.total_amount = 10.80; // Valor padrão do produto
      }
      
      const { error: updateErr } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', sale.id);
      
      if (updateErr) {
        console.log(`   ❌ Erro ao atualizar venda ${sale.id}: ${updateErr.message}`);
      } else {
        console.log(`   ✅ Venda ${sale.id} (${sale.customer_email}) → status: paid`);
      }
    }
    
    // 3. Verificar resultado
    console.log('\n📋 3. Verificando resultado...');
    const { data: allSales } = await supabase
      .from('sales')
      .select('id, customer_email, total_amount, payment_gateway, order_status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('\n📊 Vendas atualizadas:');
    allSales.forEach(sale => {
      console.log(`   - ${sale.customer_email} | R$ ${sale.total_amount} | ${sale.payment_gateway} | ${sale.order_status}`);
    });
    
    // 4. Testar views novamente
    console.log('\n📋 4. Testando views com dados atualizados...');
    
    const { data: analytics } = await supabase
      .rpc('get_analytics_period', {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      });
    
    console.log('\n📊 Analytics (get_analytics_period):');
    console.log(JSON.stringify(analytics, null, 2));
    
    const { data: gatewayStats } = await supabase
      .rpc('get_gateway_stats', {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      });
    
    console.log('\n📊 Gateway Stats (get_gateway_stats):');
    console.log(JSON.stringify(gatewayStats, null, 2));
    
    const { data: salesByGateway } = await supabase
      .from('sales_by_gateway')
      .select('*');
    
    console.log('\n📊 Sales by Gateway (view):');
    console.log(JSON.stringify(salesByGateway, null, 2));
    
    const { data: cascata } = await supabase
      .from('cascata_analysis')
      .select('*');
    
    console.log('\n📊 Cascata Analysis (view):');
    console.log(JSON.stringify(cascata, null, 2));
    
    console.log('\n========================================');
    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('========================================');
    console.log('');
    console.log('As vendas foram atualizadas para status "paid".');
    console.log('Agora o dashboard deve mostrar os dados corretamente.');
    console.log('');
    console.log('🔗 Acesse: http://localhost:3000/admin/dashboard');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixSalesStatus();
