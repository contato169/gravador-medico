const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function check() {
  // Ver estrutura completa do webhook_log mais recente
  const { data: logs } = await supabase
    .from('webhooks_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log('Estrutura dos webhook logs:');
  logs.forEach((log, i) => {
    console.log(`\n--- Log ${i + 1} ---`);
    console.log(JSON.stringify(log, null, 2));
  });
}

check();
