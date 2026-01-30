#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const LOVABLE_URL = process.env.NEXT_PUBLIC_LOVABLE_EDGE_FUNCTION_URL;
const API_SECRET = '26+Sucesso+GH';

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

async function main() {
  const email = 'drglp@outlook.com';
  const name = 'Gabriel Ricardo Landivar polo';
  const orderId = '442ccf7d-415d-4033-9ede-8bc973e7c00e';
  const orderValue = 36;
  
  console.log('=====================================================');
  console.log('🎉 CRIANDO LOGIN PARA GABRIEL LANDIVAR');
  console.log('=====================================================\n');
  
  // 1. Verificar se usuário já existe no Lovable
  console.log('1️⃣ Verificando usuário no Lovable...');
  
  const listResponse = await fetch(LOVABLE_URL, {
    method: 'GET',
    headers: {
      'x-api-secret': API_SECRET,
      'Content-Type': 'application/json',
    },
  });
  
  const listData = await listResponse.json();
  let user = listData.users?.find(u => u.email === email);
  let password = generatePassword();
  
  if (user) {
    console.log('   ✅ Usuário já existe:', user.id);
    
    // Resetar senha
    console.log('\n2️⃣ Resetando senha...');
    const resetResponse = await fetch(LOVABLE_URL, {
      method: 'PUT',
      headers: {
        'x-api-secret': API_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        newPassword: password,
      }),
    });
    
    if (resetResponse.ok) {
      console.log('   ✅ Senha resetada!');
    } else {
      console.log('   ❌ Erro ao resetar senha');
    }
  } else {
    // Criar usuário
    console.log('\n2️⃣ Criando usuário no Lovable...');
    
    const createResponse = await fetch(LOVABLE_URL, {
      method: 'POST',
      headers: {
        'x-api-secret': API_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        full_name: name,
      }),
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok && createData.user) {
      console.log('   ✅ Usuário criado:', createData.user.id);
      user = createData.user;
    } else {
      console.log('   ❌ Erro:', createData);
    }
  }
  
  // 3. Enviar email
  console.log('\n3️⃣ Enviando email de boas-vindas...');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #F7F9FA; margin: 0; padding: 40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #16A085 0%, #2EAE9A 100%); padding: 50px 40px; text-align: center;">
                  <span style="font-size: 48px;">🎙️</span>
                  <h1 style="color: #FFFFFF; font-size: 28px; margin: 20px 0 0 0;">Bem-vindo ao Gravador Médico!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 12px 0 0 0;">Seu acesso está pronto para uso</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #1A2E38; font-size: 18px; margin: 0 0 24px 0;">Olá, <strong>${name}</strong>! 👋</p>
                  <p style="color: #5C7080; font-size: 16px; margin: 0 0 32px 0;">Sua compra foi confirmada com sucesso! Abaixo estão suas credenciais de acesso.</p>
                  
                  <div style="background-color: #E8F8F5; border-radius: 12px; padding: 28px; margin-bottom: 32px;">
                    <h2 style="color: #16A085; font-size: 16px; margin: 0 0 20px 0;">🔐 SUAS CREDENCIAIS DE ACESSO</h2>
                    <div style="margin-bottom: 16px;">
                      <div style="color: #5C7080; font-size: 13px; margin-bottom: 4px;">E-mail</div>
                      <div style="background-color: #FFFFFF; padding: 14px 16px; border-radius: 8px; font-family: monospace; font-size: 15px; color: #1A2E38; border: 1px solid #D8DEE4;">
                        ${email}
                      </div>
                    </div>
                    <div>
                      <div style="color: #5C7080; font-size: 13px; margin-bottom: 4px;">Senha</div>
                      <div style="background-color: #FFFFFF; padding: 14px 16px; border-radius: 8px; font-family: monospace; font-size: 15px; color: #1A2E38; border: 1px solid #D8DEE4;">
                        ${password}
                      </div>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 32px;">
                    <a href="https://app.gravadormedico.com.br" style="display: inline-block; background-color: #16A085; color: #FFFFFF; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Acessar Plataforma →
                    </a>
                  </div>
                  
                  <div style="background-color: #F7F9FA; border-radius: 12px; padding: 24px;">
                    <h3 style="color: #1A2E38; font-size: 14px; margin: 0 0 16px 0;">📋 DETALHES DO PEDIDO</h3>
                    <table width="100%">
                      <tr>
                        <td style="color: #5C7080; font-size: 14px; padding: 8px 0;">Pedido</td>
                        <td style="color: #1A2E38; font-size: 14px; font-weight: 600; padding: 8px 0; text-align: right;">#${orderId.split('-')[0].toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="color: #5C7080; font-size: 14px; padding: 8px 0; border-top: 1px solid #D8DEE4;">Valor</td>
                        <td style="color: #16A34A; font-size: 14px; font-weight: 600; padding: 8px 0; text-align: right; border-top: 1px solid #D8DEE4;">R$ ${orderValue.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="color: #5C7080; font-size: 14px; padding: 8px 0; border-top: 1px solid #D8DEE4;">Pagamento</td>
                        <td style="color: #1A2E38; font-size: 14px; font-weight: 600; padding: 8px 0; text-align: right; border-top: 1px solid #D8DEE4;">PIX</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #F7F9FA; padding: 30px 40px; text-align: center; border-top: 1px solid #D8DEE4;">
                  <p style="color: #5C7080; font-size: 14px; margin: 0 0 8px 0;">Precisa de ajuda?</p>
                  <a href="mailto:suporte@gravadormedico.com.br" style="color: #16A085; font-size: 14px; text-decoration: none;">suporte@gravadormedico.com.br</a>
                  <p style="color: #5C7080; font-size: 12px; margin: 24px 0 0 0;">© 2026 Gravador Médico. Todos os direitos reservados.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  const { data: emailData, error: emailError } = await resend.emails.send({
    from: 'Gravador Médico <suporte@gravadormedico.com.br>',
    to: email,
    subject: 'Bem-vindo ao Gravador Médico - Seus Dados de Acesso',
    html: htmlContent,
  });
  
  if (emailError) {
    console.log('   ❌ Erro ao enviar email:', emailError);
  } else {
    console.log('   ✅ Email enviado! ID:', emailData.id);
    
    // Salvar no banco
    await supabase.from('email_logs').insert({
      email_id: emailData.id,
      recipient_email: email,
      recipient_name: name,
      subject: 'Bem-vindo ao Gravador Médico - Seus Dados de Acesso',
      html_content: htmlContent,
      email_type: 'welcome',
      from_email: 'suporte@gravadormedico.com.br',
      from_name: 'Gravador Médico',
      order_id: orderId,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        user_email: email,
        order_value: orderValue,
        payment_method: 'pix',
      },
    });
    console.log('   ✅ Log salvo no banco (com HTML para preview)');
  }
  
  console.log('\n=====================================================');
  console.log('✅ CONCLUÍDO!');
  console.log('=====================================================');
  console.log('\n📧 Email:', email);
  console.log('🔑 Senha:', password);
  console.log('\n⚠️  Credenciais sincronizadas com o Lovable!');
  console.log('=====================================================');
}

main().catch(console.error);
