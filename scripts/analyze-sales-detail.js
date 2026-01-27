const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://egsmraszqnmosmtjuzhx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('📊 Analisando vendas em detalhes...\n');
  
  // Buscar todas as vendas com detalhes
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }
  
  console.log(`Total de vendas: ${sales.length}\n`);
  
  sales.forEach((sale, i) => {
    console.log(`--- Venda ${i + 1} ---`);
    console.log(`ID: ${sale.id}`);
    console.log(`Email: ${sale.customer_email}`);
    console.log(`Nome: ${sale.customer_name}`);
    console.log(`Valor: R$ ${sale.total_amount}`);
    console.log(`Status: ${sale.status}`);
    console.log(`Order Status: ${sale.order_status}`);
    console.log(`Payment Gateway: ${sale.payment_gateway}`);
    console.log(`MP Payment ID: ${sale.mercadopago_payment_id}`);
    console.log(`AppMax Order ID: ${sale.appmax_order_id}`);
    console.log(`Criado em: ${sale.created_at}`);
    console.log('');
  });
  
  // Verificar checkout_attempts
  console.log('\n📋 Verificando checkout_attempts...');
  const { data: attempts, error: attemptsError } = await supabase
    .from('checkout_attempts')
    .select('id, customer_email, status, total_amount, payment_method, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!attemptsError && attempts) {
    console.log(`Total de checkout attempts recentes: ${attempts.length}`);
    attempts.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.customer_email} | ${a.status} | R$ ${a.total_amount} | ${a.payment_method}`);
    });
  }
  
  // Verificar webhooks logs
  console.log('\n📋 Verificando webhook_logs (Mercado Pago)...');
  const { data: webhooks, error: webhooksError } = await supabase
    .from('webhook_logs')
    .select('id, provider, topic, processed, created_at')
    .eq('provider', 'mercadopago')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!webhooksError && webhooks) {
    console.log(`Webhooks MP recentes: ${webhooks.length}`);
    webhooks.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.topic} | Processado: ${w.processed} | ${w.created_at}`);
    });
  }
  
  // Verificar webhooks_logs (AppMax)
  console.log('\n📋 Verificando webhooks_logs (AppMax)...');
  const { data: appmaxWebhooks, error: appmaxError } = await supabase
    .from('webhooks_logs')
    .select('id, source, event_type, success, created_at')
    .eq('source', 'appmax')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!appmaxError && appmaxWebhooks) {
    console.log(`Webhooks AppMax recentes: ${appmaxWebhooks.length}`);
    appmaxWebhooks.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.event_type} | Sucesso: ${w.success} | ${w.created_at}`);
    });
  }
}

main();
