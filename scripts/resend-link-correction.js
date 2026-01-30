#!/usr/bin/env node
// Script para reenviar email com link correto do portal
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

const CUSTOMERS = [
  { name: 'Thaynara Oliveira', email: 'thaynara.kellen@gmail.com', password: '184@EjnKKKTw' },
  { name: 'Júlio Cezar dos Santos', email: 'drjuliocezar@mac.com', password: 'XlpHw34%j7l5' },
  { name: 'Flávio Augusto', email: 'flavio.augusto20@unifesp.br', password: '$GxuPFsEgU5J' }
];

const colors = { primary: '#16A085', accent: '#2EAE9A', background: '#F7F9FA', card: '#FFFFFF', textPrimary: '#1A2E38', textSecondary: '#5C7080' };

async function sendEmail(customer) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:${colors.background};">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${colors.background};padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:${colors.card};border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,${colors.primary} 0%,${colors.accent} 100%);padding:40px;text-align:center;">
<h1 style="color:white;margin:0;font-size:24px;font-weight:600;">📍 Link Correto de Acesso</h1>
<p style="color:rgba(255,255,255,0.9);margin:10px 0 0 0;font-size:15px;">Gravador Médico</p>
</td></tr>
<tr><td style="padding:40px;">
<p style="color:${colors.textPrimary};font-size:16px;line-height:1.6;margin:0 0 20px 0;">Olá <strong>${customer.name}</strong>,</p>
<p style="color:${colors.textSecondary};font-size:15px;line-height:1.6;margin:0 0 25px 0;">Enviamos este email para informar o <strong>link correto</strong> de acesso ao portal do Gravador Médico.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0FDF9;border:2px solid ${colors.primary};border-radius:12px;margin-bottom:30px;">
<tr><td style="padding:25px;">
<p style="color:${colors.textSecondary};font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 5px 0;">Email</p>
<p style="color:${colors.textPrimary};font-size:18px;font-weight:600;margin:0 0 15px 0;">${customer.email}</p>
<p style="color:${colors.textSecondary};font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 5px 0;border-top:1px solid ${colors.primary}30;padding-top:15px;">Senha</p>
<p style="color:${colors.primary};font-size:20px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:2px;margin:0;">${customer.password}</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://gravadormedico.com/" style="display:inline-block;background:linear-gradient(135deg,${colors.primary} 0%,${colors.accent} 100%);color:white;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:600;font-size:16px;">🚀 Acessar Portal</a>
</td></tr></table>
<p style="color:${colors.textSecondary};font-size:13px;line-height:1.6;margin:30px 0 0 0;text-align:center;">Link correto: <strong>https://gravadormedico.com/</strong></p>
</td></tr>
<tr><td style="background-color:${colors.background};padding:25px 40px;text-align:center;border-top:1px solid #E5E7EB;">
<p style="color:${colors.textSecondary};font-size:13px;margin:0;">© 2026 Gravador Médico</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const result = await resend.emails.send({
    from: 'Gravador Médico <noreply@gravadormedico.com.br>',
    to: customer.email,
    subject: '📍 Link Correto de Acesso - Gravador Médico',
    html: html,
  });
  return result;
}

async function main() {
  console.log('📧 Reenviando emails com link correto...\n');
  
  for (const customer of CUSTOMERS) {
    console.log(`Enviando para ${customer.name}...`);
    try {
      const result = await sendEmail(customer);
      if (result.data?.id) {
        console.log(`  ✅ Enviado! ID: ${result.data.id}`);
      } else {
        console.log(`  ❌ Erro:`, result.error);
      }
    } catch (err) {
      console.log(`  ❌ Erro:`, err.message);
    }
    // Aguardar 2 segundos entre envios (rate limit)
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n✨ Finalizado!');
}

main();
