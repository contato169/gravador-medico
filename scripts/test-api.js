#!/usr/bin/env node
// Teste da API de mensagens

const https = require('http');

const url = 'http://localhost:3000/api/whatsapp/messages?remoteJid=5521988960217%40s.whatsapp.net&limit=500';

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Total de mensagens:', json.messages.length);
      console.log('from_me=true:', json.messages.filter(m => m.from_me).length);
      console.log('from_me=false:', json.messages.filter(m => !m.from_me).length);
      
      console.log('\nÚltimas 10 mensagens:');
      json.messages.slice(-10).forEach((m, i) => {
        const sender = m.from_me ? '🟢 VOCÊ' : '👤 CLIENTE';
        console.log(`${i+1}. [${sender}] ${(m.content || '').substring(0, 40)}`);
      });
    } catch (e) {
      console.error('Erro ao parsear:', e.message);
      console.log('Resposta:', data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('Erro:', e.message);
});
