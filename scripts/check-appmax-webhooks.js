const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function check() {
  const { data: logs } = await supabase
    .from('webhooks_logs')
    .select('payload')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('📊 Análise dos webhooks AppMax:\n');
  
  logs.forEach((log, i) => {
    const event = log.payload?.event || 'N/A';
    const customer = log.payload?.data?.customer?.fullname || 'N/A';
    const status = log.payload?.data?.status || 'N/A';
    const amount = log.payload?.data?.total || 0;
    const paymentType = log.payload?.data?.payment_type || 'N/A';
    
    console.log(`#${i+1} ${event}`);
    console.log(`   Cliente: ${customer}`);
    console.log(`   Valor: R$ ${amount}`);
    console.log(`   Status: ${status}`);
    console.log(`   Pagamento: ${paymentType}`);
    console.log('');
  });
}

check();
