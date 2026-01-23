#!/usr/bin/env node
// ================================================================
// CORRIGIR from_me usando raw_payload.key.fromMe
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function fixFromMe() {
  console.log('=== CORRIGINDO from_me USANDO raw_payload ===\n');
  
  // Buscar todas as mensagens com raw_payload
  const { data: messages, error } = await supabase
    .from('whatsapp_messages')
    .select('id, content, from_me, raw_payload')
    .not('raw_payload', 'is', null);
  
  if (error) {
    console.error('Erro ao buscar:', error);
    return;
  }
  
  console.log('Mensagens com raw_payload:', messages?.length || 0);
  
  let fixed = 0;
  let consistent = 0;
  let noPayloadFromMe = 0;
  
  for (const msg of messages || []) {
    const payloadFromMe = msg.raw_payload?.key?.fromMe;
    
    if (payloadFromMe === undefined || payloadFromMe === null) {
      noPayloadFromMe++;
      continue;
    }
    
    // Normalizar o valor do payload
    const correctFromMe = payloadFromMe === true || payloadFromMe === 'true' || payloadFromMe === 1 || payloadFromMe === '1';
    
    if (msg.from_me !== correctFromMe) {
      // Corrigir!
      const { error: updateError } = await supabase
        .from('whatsapp_messages')
        .update({ from_me: correctFromMe })
        .eq('id', msg.id);
      
      if (updateError) {
        console.error(`Erro ao atualizar ${msg.id}:`, updateError);
      } else {
        fixed++;
        console.log(`✅ Corrigido: "${msg.content?.substring(0, 30)}" | ${msg.from_me} → ${correctFromMe}`);
      }
    } else {
      consistent++;
    }
  }
  
  console.log('\n=== RESULTADO ===');
  console.log('Consistentes:', consistent);
  console.log('Corrigidas:', fixed);
  console.log('Sem payload.key.fromMe:', noPayloadFromMe);
  
  // Verificar resultado final
  console.log('\n=== VERIFICAÇÃO FINAL ===');
  const { data: finalCheck } = await supabase
    .from('whatsapp_messages')
    .select('from_me')
    .eq('remote_jid', '5521988960217@s.whatsapp.net');
  
  const fromMeTrue = finalCheck?.filter(m => m.from_me === true).length || 0;
  const fromMeFalse = finalCheck?.filter(m => m.from_me === false).length || 0;
  console.log(`from_me=true: ${fromMeTrue}`);
  console.log(`from_me=false: ${fromMeFalse}`);
}

fixFromMe().catch(console.error);
