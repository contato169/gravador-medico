#!/usr/bin/env node
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });
const resend = new Resend(process.env.RESEND_API_KEY);

const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px">
<div style="background:linear-gradient(135deg,#16A085,#2EAE9A);padding:30px;text-align:center;border-radius:12px 12px 0 0">
<h1 style="color:white;margin:0">🎉 Bem-vindo ao Gravador Médico!</h1>
</div>
<div style="background:#fff;padding:30px;border:1px solid #ddd">
<p>Olá <strong>Michael Miranda Beitto</strong>,</p>
<p>Sua conta está pronta! Use as credenciais abaixo para acessar:</p>
<div style="background:#F0FDF9;border:2px solid #16A085;padding:20px;border-radius:8px;margin:20px 0">
<p style="margin:0 0 10px 0"><strong>Email:</strong> chbritto32@gmail.com</p>
<p style="margin:0"><strong>Senha:</strong> <code style="background:#16A085;color:white;padding:4px 12px;font-size:16px;border-radius:4px">Acesso2026!</code></p>
</div>
<div style="text-align:center;margin:30px 0">
<a href="https://gravadormedico.com/" style="background:#16A085;color:white;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">🚀 Acessar o Portal</a>
</div>
</div>
<div style="background:#f5f5f5;padding:15px;text-align:center;border-radius:0 0 12px 12px">
<p style="margin:0;color:#666;font-size:12px">© 2026 Gravador Médico</p>
</div>
</div>`;

(async () => {
  console.log('📧 Enviando email para Michael Miranda Beitto...');
  
  const res = await resend.emails.send({
    from: 'Gravador Médico <noreply@gravadormedico.com.br>',
    to: 'chbritto32@gmail.com',
    subject: '🎉 Suas credenciais do Gravador Médico - Acesso Liberado!',
    html
  });
  
  if (res.error) {
    console.log('❌ Erro:', res.error);
  } else {
    console.log('✅ Email enviado com sucesso!');
    console.log('   ID:', res.data?.id);
  }
})();
