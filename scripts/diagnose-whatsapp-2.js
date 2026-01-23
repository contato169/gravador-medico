#!/usr/bin/env node
// ================================================================
// Diagnóstico detalhado - Ver mensagens de um contato específico
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function diagnoseContact(jid) {
  console.log('=== MENSAGENS DE:', jid, '===\n');
  
  const { data: msgs, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('remote_jid', jid)
    .order('timestamp', { ascending: false })
    .limit(30);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  console.log('Total encontrado:', msgs ? msgs.length : 0);
  
  if (msgs && msgs.length > 0) {
    msgs.forEach((m, i) => {
      const sender = m.from_me ? '🟢 VOCÊ' : '👤 CLIENTE';
      const content = (m.content || '[sem conteudo]').substring(0, 50);
      const ts = new Date(m.timestamp).toLocaleString('pt-BR');
      console.log(`${i+1}. [${sender}] ${content}`);
      console.log(`   Tipo: ${m.message_type} | ${ts}`);
    });
    
    const fromMe = msgs.filter(m => m.from_me).length;
    const fromClient = msgs.filter(m => !m.from_me).length;
    console.log(`\nRESUMO: ${fromMe} suas, ${fromClient} do cliente`);
  }
}

async function main() {
  // Listar todos contatos com contagem de mensagens
  console.log('=== CONTATOS COM MAIS MENSAGENS ===\n');
  
  // Buscar contagem por remote_jid
  const { data: contacts } = await supabase
    .from('whatsapp_contacts')
    .select('remote_jid, name, push_name, last_message_timestamp')
    .order('last_message_timestamp', { ascending: false });
  
  for (const c of contacts || []) {
    const { count } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('remote_jid', c.remote_jid);
    
    const nome = c.name || c.push_name || 'Sem nome';
    const lastMsg = c.last_message_timestamp ? new Date(c.last_message_timestamp).toLocaleString('pt-BR') : 'nunca';
    console.log(`${nome.padEnd(20)} | ${(count || 0).toString().padStart(4)} msgs | Última: ${lastMsg}`);
    console.log(`  JID: ${c.remote_jid}`);
  }
  
  console.log('\n');
  
  // Ver mensagens do Helcio Mattos (que sabemos ter conversa)
  await diagnoseContact('5521988960217@s.whatsapp.net');
}

main().catch(console.error);
