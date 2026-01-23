#!/usr/bin/env node
// ================================================================
// Diagnóstico detalhado do from_me
// ================================================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://egsmraszqnmosmtjuzhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc21yYXN6cW5tb3NtdGp1emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4NzcxMCwiZXhwIjoyMDg0MDYzNzEwfQ.wuM5GbYqaDTyf4T3fR62U1sWqZ06RJ3nXHk56I2VcAQ'
);

async function diagnose() {
  console.log('=== ANÁLISE DETALHADA DO from_me ===\n');
  
  const jid = '5521988960217@s.whatsapp.net';
  
  // Buscar mensagens com raw_payload
  const { data: msgs } = await supabase
    .from('whatsapp_messages')
    .select('content, from_me, raw_payload, timestamp')
    .eq('remote_jid', jid)
    .order('timestamp', { ascending: false })
    .limit(20);
  
  if (!msgs) return;
  
  console.log('Mensagens com análise do raw_payload:\n');
  
  msgs.forEach((m, i) => {
    const content = (m.content || '[sem conteudo]').substring(0, 35).padEnd(35);
    const dbFromMe = m.from_me;
    
    // Extrair fromMe do raw_payload se existir
    let payloadFromMe = 'N/A';
    if (m.raw_payload) {
      if (m.raw_payload.key && m.raw_payload.key.fromMe !== undefined) {
        payloadFromMe = m.raw_payload.key.fromMe;
      } else if (m.raw_payload.fromMe !== undefined) {
        payloadFromMe = m.raw_payload.fromMe;
      }
    }
    
    const match = payloadFromMe === 'N/A' ? '⚠️' : (dbFromMe === payloadFromMe ? '✅' : '❌');
    
    console.log(`${(i+1).toString().padStart(2)}. "${content}" | DB: ${dbFromMe.toString().padEnd(5)} | Payload: ${String(payloadFromMe).padEnd(5)} ${match}`);
  });
  
  // Analisar padrão
  console.log('\n=== ANÁLISE DO PADRÃO ===\n');
  
  // Mensagens curtas (prováveis do cliente real)
  const shortMsgs = msgs.filter(m => m.content && m.content.length <= 20);
  const shortFromMe = shortMsgs.filter(m => m.from_me).length;
  const shortFromThem = shortMsgs.filter(m => !m.from_me).length;
  console.log(`Mensagens curtas (<=20 chars): ${shortMsgs.length} total | from_me=true: ${shortFromMe} | from_me=false: ${shortFromThem}`);
  
  // Mensagens longas (prováveis automação/sistema)
  const longMsgs = msgs.filter(m => m.content && m.content.length > 50);
  const longFromMe = longMsgs.filter(m => m.from_me).length;
  const longFromThem = longMsgs.filter(m => !m.from_me).length;
  console.log(`Mensagens longas (>50 chars): ${longMsgs.length} total | from_me=true: ${longFromMe} | from_me=false: ${longFromThem}`);
  
  // Mensagens com padrões específicos
  const patterns = {
    'oi/olá': msgs.filter(m => m.content && /^(oi|olá|ola)/i.test(m.content.trim())),
    'saudações formais': msgs.filter(m => m.content && /^(Olá!|Bem-vindo|Sou a)/i.test(m.content)),
    'perguntas': msgs.filter(m => m.content && m.content.includes('?')),
  };
  
  console.log('\nPadrões encontrados:');
  for (const [name, matches] of Object.entries(patterns)) {
    const fMe = matches.filter(m => m.from_me).length;
    const fThem = matches.filter(m => !m.from_me).length;
    console.log(`  ${name}: ${matches.length} total | from_me=true: ${fMe} | from_me=false: ${fThem}`);
  }
}

diagnose().catch(console.error);
