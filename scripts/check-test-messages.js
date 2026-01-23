#!/usr/bin/env node
// ================================================================
// Verificar mensagens de teste SOU CLIENTE / SOU O WHATSAPP
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function checkTestMessages() {
  console.log('=== VERIFICANDO MENSAGENS DE TESTE ===\n');
  
  // Buscar últimas 50 mensagens do Helcio
  const { data: msgs } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('remote_jid', '5521988960217@s.whatsapp.net')
    .order('timestamp', { ascending: false })
    .limit(50);
  
  console.log('Total de mensagens encontradas:', msgs?.length || 0);
  
  // Filtrar as de teste
  const testMsgs = msgs?.filter(m => 
    m.content?.includes('SOU CLIENTE') || 
    m.content?.includes('SOU O WHATSAPP') ||
    m.content?.includes('Olá novamente') ||
    m.content?.includes('Método Gravador Médico') ||
    m.content?.includes('checkout')
  ) || [];
  
  console.log('\n=== MENSAGENS DE TESTE ENCONTRADAS ===');
  console.log('Total:', testMsgs.length);
  
  testMsgs.forEach((m, i) => {
    const sender = m.from_me ? '🟢 from_me=TRUE' : '👤 from_me=FALSE';
    console.log(`\n${i+1}. [${sender}]`);
    console.log(`   Conteúdo: ${m.content?.substring(0, 60)}...`);
    console.log(`   Timestamp: ${new Date(m.timestamp).toLocaleString('pt-BR')}`);
    console.log(`   message_id: ${m.message_id}`);
    
    // Verificar raw_payload
    if (m.raw_payload) {
      const payloadFromMe = m.raw_payload?.key?.fromMe;
      console.log(`   raw_payload.key.fromMe: ${payloadFromMe}`);
    } else {
      console.log(`   raw_payload: NULL`);
    }
  });
  
  // Mostrar últimas 30 mensagens para contexto
  console.log('\n\n=== ÚLTIMAS 30 MENSAGENS (TODAS) ===');
  msgs?.slice(0, 30).forEach((m, i) => {
    const sender = m.from_me ? '🟢 VOCÊ' : '👤 CLIENTE';
    const content = (m.content || '[sem conteudo]').substring(0, 50);
    const ts = new Date(m.timestamp).toLocaleString('pt-BR');
    console.log(`${i+1}. [${sender}] ${content} | ${ts}`);
  });
  
  // Estatísticas
  const fromMeTrue = msgs?.filter(m => m.from_me === true).length || 0;
  const fromMeFalse = msgs?.filter(m => m.from_me === false).length || 0;
  console.log(`\nRESUMO: ${fromMeTrue} from_me=true, ${fromMeFalse} from_me=false`);
}

checkTestMessages().catch(console.error);
