#!/usr/bin/env node
// ================================================================
// Diagnóstico de mensagens WhatsApp
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function diagnose() {
  console.log('=== DIAGNÓSTICO WHATSAPP MESSAGES ===\n');
  
  // 1. Verificar total de mensagens e distribuição de from_me
  const { data: stats } = await supabase
    .from('whatsapp_messages')
    .select('from_me');
  
  const total = stats ? stats.length : 0;
  const fromMeTrue = stats ? stats.filter(m => m.from_me === true).length : 0;
  const fromMeFalse = stats ? stats.filter(m => m.from_me === false).length : 0;
  const fromMeNull = stats ? stats.filter(m => m.from_me === null).length : 0;
  
  console.log('📊 ESTATÍSTICAS GERAIS:');
  console.log('  - Total mensagens:', total);
  console.log('  - from_me=true (suas):', fromMeTrue);
  console.log('  - from_me=false (cliente):', fromMeFalse);
  console.log('  - from_me=null:', fromMeNull);
  
  // 2. Ver últimos contatos
  const { data: contacts } = await supabase
    .from('whatsapp_contacts')
    .select('remote_jid, name, push_name')
    .order('last_message_timestamp', { ascending: false })
    .limit(5);
  
  console.log('\n📱 ÚLTIMOS CONTATOS:');
  if (contacts) {
    contacts.forEach(c => {
      console.log('  -', c.name || c.push_name || 'Sem nome', '|', c.remote_jid);
    });
  }
  
  // 3. Ver mensagens do primeiro contato
  if (contacts && contacts.length > 0) {
    const jid = contacts[0].remote_jid;
    console.log('\n📝 ÚLTIMAS 20 MENSAGENS DE:', jid);
    
    const { data: msgs } = await supabase
      .from('whatsapp_messages')
      .select('content, from_me, timestamp, message_type, raw_payload')
      .eq('remote_jid', jid)
      .order('timestamp', { ascending: false })
      .limit(20);
    
    if (msgs) {
      msgs.forEach((m, i) => {
        const sender = m.from_me ? '🟢 VOCÊ' : '👤 CLIENTE';
        const content = (m.content || '[sem conteudo]').substring(0, 40);
        const ts = new Date(m.timestamp).toLocaleString('pt-BR');
        console.log(`  ${i+1}. [${sender}] ${content} | ${ts}`);
      });
      
      // Contar por contato
      const fromMe = msgs.filter(m => m.from_me).length;
      const fromClient = msgs.filter(m => !m.from_me).length;
      console.log(`\n  RESUMO: ${fromMe} suas, ${fromClient} do cliente`);
    }
  }
  
  // 4. Verificar raw_payload e comparar com from_me
  const { data: withPayload } = await supabase
    .from('whatsapp_messages')
    .select('id, from_me, raw_payload')
    .not('raw_payload', 'is', null)
    .limit(10);
  
  console.log('\n📦 COMPARANDO from_me COM raw_payload:');
  let inconsistentes = 0;
  if (withPayload) {
    withPayload.forEach((m, i) => {
      const payloadFromMe = m.raw_payload && m.raw_payload.key ? m.raw_payload.key.fromMe : undefined;
      const match = m.from_me === payloadFromMe ? '✅' : '❌';
      if (m.from_me !== payloadFromMe) inconsistentes++;
      console.log(`  ${i+1}. Coluna: ${m.from_me} | Payload: ${payloadFromMe} ${match}`);
    });
  }
  
  // 5. Contar mensagens com raw_payload que têm from_me diferente
  const { data: allWithPayload } = await supabase
    .from('whatsapp_messages')
    .select('from_me, raw_payload')
    .not('raw_payload', 'is', null);
  
  if (allWithPayload) {
    let mismatchCount = 0;
    let payloadTrue = 0;
    let payloadFalse = 0;
    
    allWithPayload.forEach(m => {
      const payloadFromMe = m.raw_payload && m.raw_payload.key ? m.raw_payload.key.fromMe : null;
      if (payloadFromMe === true) payloadTrue++;
      if (payloadFromMe === false) payloadFalse++;
      if (payloadFromMe !== null && payloadFromMe !== undefined && m.from_me !== payloadFromMe) {
        mismatchCount++;
      }
    });
    
    console.log('\n📊 ANÁLISE DO raw_payload (todas mensagens):');
    console.log('  - Total com payload:', allWithPayload.length);
    console.log('  - Payload fromMe=true:', payloadTrue);
    console.log('  - Payload fromMe=false:', payloadFalse);
    console.log('  - Inconsistências:', mismatchCount);
  }
}

diagnose().then(() => {
  console.log('\n✅ Diagnóstico concluído');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
