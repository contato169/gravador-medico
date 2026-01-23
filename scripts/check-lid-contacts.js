#!/usr/bin/env node
// ================================================================
// Verificar mensagens de contatos @lid
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function checkLidContacts() {
  console.log('=== VERIFICANDO CONTATOS @lid ===\n');
  
  // Buscar contatos @lid
  const { data: lidContacts } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .like('remote_jid', '%@lid');
  
  console.log('Contatos @lid encontrados:', lidContacts ? lidContacts.length : 0);
  
  for (const c of lidContacts || []) {
    console.log('\n--- Contato:', c.remote_jid, '---');
    console.log('Nome:', c.name || c.push_name || 'Sem nome');
    console.log('Última msg:', c.last_message_content);
    console.log('Timestamp:', c.last_message_timestamp);
    
    // Verificar mensagens
    const { data: msgs, count } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .eq('remote_jid', c.remote_jid)
      .order('timestamp', { ascending: false })
      .limit(5);
    
    console.log('Mensagens encontradas:', count || 0);
    if (msgs && msgs.length > 0) {
      msgs.forEach((m, i) => {
        const sender = m.from_me ? '🟢' : '👤';
        console.log(`  ${i+1}. [${sender}] ${(m.content || '').substring(0, 50)}`);
      });
    }
  }
  
  // Verificar se há mensagens com JID similar mas diferente
  console.log('\n\n=== VERIFICANDO TODOS OS JIDs ÚNICOS ===');
  const { data: allJids } = await supabase
    .from('whatsapp_messages')
    .select('remote_jid');
  
  const uniqueJids = [...new Set(allJids?.map(m => m.remote_jid) || [])];
  console.log('JIDs únicos em mensagens:', uniqueJids.length);
  uniqueJids.forEach(jid => console.log('  -', jid));
}

checkLidContacts().catch(console.error);
