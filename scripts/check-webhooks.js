const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function check() {
  console.log('=== VERIFICANDO LOGS DE WEBHOOK ===\n');
  
  // Tenta webhooks_logs
  const { data: wl1, error: err1 } = await supabase
    .from('webhooks_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (wl1 && wl1.length > 0) {
    console.log('webhooks_logs encontrados:');
    wl1.forEach(w => console.log('  -', w.source, '|', w.event_type, '|', new Date(w.created_at).toLocaleString()));
  } else if (err1) {
    console.log('webhooks_logs: tabela não existe ou erro:', err1.message);
  }
  
  // Tenta webhook_logs
  const { data: wl2, error: err2 } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (wl2 && wl2.length > 0) {
    console.log('\nwebhook_logs encontrados:');
    wl2.forEach(w => console.log('  -', w.source || w.provider, '|', w.event_type || w.event, '|', new Date(w.created_at).toLocaleString()));
  } else if (err2) {
    console.log('webhook_logs: tabela não existe ou erro:', err2.message);
  }
  
  if ((!wl1 || wl1.length === 0) && (!wl2 || wl2.length === 0)) {
    console.log('\n⚠️  NENHUM LOG DE WEBHOOK ENCONTRADO!');
    console.log('Isso indica que o Mercado Pago não está enviando webhooks.');
    console.log('\nPossíveis causas:');
    console.log('1. URL do webhook não está configurada no Mercado Pago');
    console.log('2. A aplicação estava em localhost quando a venda foi feita');
    console.log('3. O webhook está configurado para uma URL diferente');
  }
  
  // Verificar config do MP
  console.log('\n=== VERIFICANDO CONFIG DO MERCADO PAGO ===\n');
  const { data: config } = await supabase.from('config').select('*').eq('key', 'mercadopago').single();
  if (config) {
    console.log('Config MP encontrada:', config.value ? 'SIM' : 'NÃO');
  }
}

check();
