#!/usr/bin/env node
// ================================================================
// Buscar TODAS as mensagens recentes para ver se automação está lá
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function findAutomationMessages() {
  console.log('=== BUSCANDO MENSAGENS DA AUTOMAÇÃO ===\n');
  
  // Buscar mensagens que contenham texto da automação
  const { data: automationMsgs, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .or('content.ilike.%Olá novamente%,content.ilike.%Método Gravador Médico%,content.ilike.%checkout%,content.ilike.%R$36%')
    .order('timestamp', { ascending: false })
    .limit(30);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  console.log('Mensagens da automação encontradas:', automationMsgs?.length || 0);
  
  automationMsgs?.forEach((m, i) => {
    const sender = m.from_me ? '🟢 from_me=TRUE' : '👤 from_me=FALSE';
    console.log(`\n${i+1}. [${sender}]`);
    console.log(`   JID: ${m.remote_jid}`);
    console.log(`   Conteúdo: ${m.content?.substring(0, 80)}...`);
    console.log(`   Timestamp: ${new Date(m.timestamp).toLocaleString('pt-BR')}`);
  });
  
  // Buscar TODAS as mensagens de hoje para o Helcio
  console.log('\n\n=== TODAS AS MENSAGENS DE HOJE (19:00+) ===');
  const today = new Date();
  today.setHours(19, 0, 0, 0);
  
  const { data: todayMsgs } = await supabase
    .from('whatsapp_messages')
    .select('content, from_me, timestamp, remote_jid, raw_payload')
    .eq('remote_jid', '5521988960217@s.whatsapp.net')
    .gte('timestamp', today.toISOString())
    .order('timestamp', { ascending: true });
  
  console.log('Mensagens após 19:00:', todayMsgs?.length || 0);
  
  todayMsgs?.forEach((m, i) => {
    const payloadFromMe = m.raw_payload?.key?.fromMe;
    const mismatch = m.from_me !== payloadFromMe ? '⚠️ INCONSISTENTE' : '✅';
    console.log(`${i+1}. from_me=${m.from_me} | payload=${payloadFromMe} ${mismatch} | ${m.content?.substring(0, 40)}`);
  });
}

findAutomationMessages().catch(console.error);
