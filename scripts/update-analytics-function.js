const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://egsmraszqnmosmtjuzhx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para executar SQL raw usando a API do Supabase
async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      return { error: await response.text() };
    }
    
    return { data: await response.json() };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log('🔧 Atualizando função get_analytics_period...\n');
  
  const sql = `
    CREATE OR REPLACE FUNCTION public.get_analytics_period(
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
        end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    RETURNS TABLE (
        unique_visitors BIGINT,
        total_sales BIGINT,
        pending_sales BIGINT,
        paid_sales BIGINT,
        total_revenue NUMERIC,
        conversion_rate NUMERIC,
        average_order_value NUMERIC
    ) 
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        WITH period_visits AS (
            SELECT
                COUNT(DISTINCT session_id) as unique_visitors
            FROM public.analytics_visits
            WHERE created_at BETWEEN start_date AND end_date
        ),
        period_sales AS (
            SELECT
                COUNT(*) as total_sales,
                COUNT(*) FILTER (WHERE order_status IN ('pending', 'pending_payment', 'processing')) as pending_sales,
                COUNT(*) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active', 'approved')) as paid_sales,
                COALESCE(SUM(total_amount) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as paid_revenue,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM public.sales
            WHERE created_at BETWEEN start_date AND end_date
        )
        SELECT
            pv.unique_visitors,
            ps.total_sales,
            ps.pending_sales,
            ps.paid_sales,
            ps.paid_revenue as total_revenue,
            CASE 
                WHEN pv.unique_visitors > 0 
                THEN ROUND((ps.paid_sales::numeric / pv.unique_visitors::numeric) * 100, 2)
                ELSE 0 
            END as conversion_rate,
            CASE 
                WHEN ps.paid_sales > 0 
                THEN ROUND(ps.paid_revenue / ps.paid_sales, 2)
                ELSE 0 
            END as average_order_value
        FROM period_visits pv, period_sales ps;
    END;
    $$;
  `;
  
  const result = await executeSQL(sql);
  
  if (result.error) {
    console.log('⚠️ Não foi possível executar SQL diretamente.');
    console.log('Por favor, execute o script manualmente no Supabase Dashboard.\n');
    console.log('Erro:', result.error);
    
    // Testar a função atual
    console.log('\n📊 Testando função atual...');
    const { data, error } = await supabase.rpc('get_analytics_period', {
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString()
    });
    
    if (error) {
      console.log('❌ Erro:', error.message);
    } else {
      console.log('✅ Resultado atual:');
      console.log(JSON.stringify(data, null, 2));
    }
  } else {
    console.log('✅ Função atualizada com sucesso!');
  }
  
  // Resumo das vendas
  console.log('\n📊 RESUMO DAS VENDAS NO SISTEMA:\n');
  
  const { data: allSales } = await supabase
    .from('sales')
    .select('payment_gateway, order_status, total_amount');
  
  if (allSales) {
    const summary = {
      total: allSales.length,
      byGateway: {},
      byStatus: {},
      totalRevenue: 0,
      paidRevenue: 0
    };
    
    allSales.forEach(s => {
      const gw = s.payment_gateway || 'unknown';
      const st = s.order_status || 'unknown';
      
      if (!summary.byGateway[gw]) summary.byGateway[gw] = 0;
      summary.byGateway[gw]++;
      
      if (!summary.byStatus[st]) summary.byStatus[st] = 0;
      summary.byStatus[st]++;
      
      summary.totalRevenue += Number(s.total_amount || 0);
      if (['paid', 'approved', 'active'].includes(st)) {
        summary.paidRevenue += Number(s.total_amount || 0);
      }
    });
    
    console.log(`Total de vendas: ${summary.total}`);
    console.log(`Receita total: R$ ${summary.totalRevenue.toFixed(2)}`);
    console.log(`Receita paga: R$ ${summary.paidRevenue.toFixed(2)}`);
    console.log('\nPor Gateway:');
    Object.entries(summary.byGateway).forEach(([gw, count]) => {
      console.log(`  ${gw}: ${count}`);
    });
    console.log('\nPor Status:');
    Object.entries(summary.byStatus).forEach(([st, count]) => {
      console.log(`  ${st}: ${count}`);
    });
  }
  
  console.log('\n========================================');
  console.log('📋 INSTRUÇÕES:');
  console.log('========================================');
  console.log('As vendas atuais estão com status "pending_payment"');
  console.log('Isso significa que o pagamento ainda não foi confirmado.');
  console.log('');
  console.log('Para que apareçam no dashboard como vendas pagas:');
  console.log('1. Configure o webhook do Mercado Pago');
  console.log('2. Ou sincronize manualmente via botão "Sync MP"');
  console.log('3. Ou atualize o status manualmente no Supabase');
  console.log('========================================\n');
}

main();
