#!/usr/bin/env node
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const LOVABLE_URL = 'https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager';
const API_SECRET = '26+Sucesso+GH';

const customer = {
  name: 'Marcia Giovane Rodrigues da silva',
  email: 'marciagiovane@gmail.com'
};

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd + '!';
}

async function main() {
  console.log('=== Processando Marcia ===');
  
  const password = generatePassword();
  console.log('Senha gerada:', password);
  
  console.log('Criando usuario no Lovable...');
  const createRes = await fetch(LOVABLE_URL, {
    method: 'POST',
    headers: { 'x-api-secret': API_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customer.email, password: password, full_name: customer.name })
  });
  const createData = await createRes.json();
  console.log('Resposta Lovable:', JSON.stringify(createData));
  
  console.log('Enviando email...');
  const html = '<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #16A085, #2EAE9A); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;"><h1 style="color: white; margin: 0;">🎉 Bem-vinda ao Gravador Médico!</h1></div><div style="background: #fff; padding: 30px; border: 1px solid #ddd;"><p>Olá <strong>' + customer.name + '</strong>,</p><p>Sua conta está pronta! Use as credenciais abaixo para acessar:</p><div style="background: #F0FDF9; border: 2px solid #16A085; padding: 20px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0 0 10px 0;"><strong>Email:</strong> ' + customer.email + '</p><p style="margin: 0;"><strong>Senha:</strong> <code style="background: #e8f5e9; padding: 4px 8px; font-size: 16px;">' + password + '</code></p></div><div style="text-align: center; margin: 30px 0;"><a href="https://gravadormedico.com/" style="background: #16A085; color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">🚀 Acessar o Portal</a></div></div><div style="background: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 12px 12px;"><p style="margin: 0; color: #666; font-size: 12px;">© 2026 Gravador Médico</p></div></div>';
  
  const emailRes = await resend.emails.send({
    from: 'Gravador Médico <noreply@gravadormedico.com.br>',
    to: customer.email,
    subject: '🎉 Suas credenciais do Gravador Médico',
    html: html
  });
  
  console.log('Email:', emailRes.data?.id || emailRes.error);
  console.log('=== SENHA FINAL:', password, '===');
}

main().catch(console.error);
