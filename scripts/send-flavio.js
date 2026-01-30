#!/usr/bin/env node
// Reenviar email para Flávio

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  console.log('Enviando email para Flávio...');
  
  const html = `
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #F7F9FA; padding: 40px;">
      <table width="600" style="margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
        <tr><td style="background: linear-gradient(135deg, #16A085, #2EAE9A); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔗 Link Correto de Acesso</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Gravador Médico</p>
        </td></tr>
        <tr><td style="padding: 40px;">
          <p>Olá <strong>Flávio Augusto</strong>,</p>
          <p>Estamos enviando este email com o <strong>link correto</strong> para acessar o portal do Gravador Médico.</p>
          
          <div style="background: #F0FDF9; border: 2px solid #16A085; border-radius: 12px; padding: 25px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><small style="color: #666;">EMAIL</small><br>
            <strong style="font-size: 18px;">flavio.augusto20@unifesp.br</strong></p>
            <hr style="border: none; border-top: 1px solid #16A08530; margin: 15px 0;">
            <p style="margin: 0;"><small style="color: #666;">SENHA</small><br>
            <strong style="font-size: 20px; color: #16A085; font-family: monospace;">$GxuPFsEgU5J</strong></p>
          </div>
          
          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <p style="color: #92400E; margin: 0;">⚠️ <strong>Link correto do portal:</strong><br>
            <a href="https://gravadormedico.com/" style="color: #16A085;">https://gravadormedico.com/</a></p>
          </div>
          
          <p style="text-align: center;">
            <a href="https://gravadormedico.com/" style="display: inline-block; background: linear-gradient(135deg, #16A085, #2EAE9A); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">🚀 Acessar Portal</a>
          </p>
        </td></tr>
        <tr><td style="background: #F7F9FA; padding: 25px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #666; margin: 0; font-size: 13px;">© 2026 Gravador Médico</p>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const result = await resend.emails.send({
    from: 'Gravador Médico <noreply@gravadormedico.com.br>',
    to: 'flavio.augusto20@unifesp.br',
    subject: '🔗 Link Correto de Acesso ao Portal - Gravador Médico',
    html: html,
  });

  if (result.data?.id) {
    console.log('✅ Email enviado! ID:', result.data.id);
  } else {
    console.log('❌ Erro:', result.error);
  }
}

main();
