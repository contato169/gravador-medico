#!/usr/bin/env node
// ================================================================
// Verificar view whatsapp_conversations
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function checkView() {
  console.log('=== VERIFICANDO VIEWS ===\n');
  
  // 1. Verificar a view whatsapp_conversations
  console.log('📋 whatsapp_conversations:');
  const { data: convs, error: errConvs } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .order('last_message_timestamp', { ascending: false });
  
  if (errConvs) {
    console.error('  ERRO:', errConvs.message);
  } else {
    console.log('  Total:', convs ? convs.length : 0);
    if (convs) {
      convs.forEach(c => {
        const nome = c.name || c.push_name || 'Sem nome';
        const lastContent = (c.last_message_content || '').substring(0, 30);
        console.log(`  - ${nome}: ${c.total_messages} msgs | Última: "${lastContent}"`);
        console.log(`    JID: ${c.remote_jid}`);
        console.log(`    last_message_from_me: ${c.last_message_from_me}`);
      });
    }
  }
  
  // 2. Verificar contatos
  console.log('\n📱 whatsapp_contacts:');
  const { data: contacts, error: errContacts } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .order('last_message_timestamp', { ascending: false });
  
  if (errContacts) {
    console.error('  ERRO:', errContacts.message);
  } else {
    console.log('  Total:', contacts ? contacts.length : 0);
    if (contacts) {
      contacts.forEach(c => {
        const nome = c.name || c.push_name || 'Sem nome';
        const lastContent = (c.last_message_content || '').substring(0, 30);
        console.log(`  - ${nome}: "${lastContent}"`);
        console.log(`    JID: ${c.remote_jid}`);
        console.log(`    last_message_from_me: ${c.last_message_from_me}`);
        console.log(`    last_message_timestamp: ${c.last_message_timestamp}`);
      });
    }
  }
  
  // 3. Verificar se há mensagens órfãs (sem contato)
  console.log('\n🔍 Verificando mensagens sem contato...');
  const { data: jids } = await supabase
    .from('whatsapp_messages')
    .select('remote_jid')
    .limit(1000);
  
  if (jids && contacts) {
    const contactJids = new Set(contacts.map(c => c.remote_jid));
    const messageJids = [...new Set(jids.map(m => m.remote_jid))];
    const orphans = messageJids.filter(jid => !contactJids.has(jid));
    
    console.log('  JIDs em mensagens:', messageJids.length);
    console.log('  JIDs em contatos:', contactJids.size);
    console.log('  JIDs órfãos:', orphans.length);
    if (orphans.length > 0) {
      console.log('  Órfãos:', orphans);
    }
  }
}

checkView().catch(console.error);
