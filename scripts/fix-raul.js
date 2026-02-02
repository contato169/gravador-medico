#!/usr/bin/env node
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const LOVABLE_URL = 'https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager';
const API_SECRET = '26+Sucesso+GH';

// Supabase local (gravador-medico)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const customer = {
  name: 'Dr. Raul Uhmann Hilbig',
  email: 'rauluhmannh@gmail.com',
  saleId: '94af0ae4-f00b-411c-8293-151463d364c3'
};

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd + '!';
}

async function main() {
  console.log('===========================================');
  console.log('  Processando: Dr. Raul Uhmann Hilbig');
  console.log('===========================================\n');
  
  const password = generatePassword();
  console.log('✅ Senha gerada:', password);
  
  // 1. Verificar se usuário já existe e resetar senha
  console.log('\n📋 Resetando senha no Lovable...');
  
  // Primeiro vamos tentar resetar a senha (o usuário já foi criado)
  const resetRes = await fetch(LOVABLE_URL, {
    method: 'PATCH',
    headers: { 'x-api-secret': API_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: customer.email, 
      newPassword: password 
    })
  });
  const resetData = await resetRes.json();
  console.log('Resposta Lovable (reset):', JSON.stringify(resetData, null, 2));
  
  // Se não conseguiu resetar, tenta criar
  if (!resetData.success) {
    console.log('\n👤 Tentando criar usuário...');
    const createRes = await fetch(LOVABLE_URL, {
      method: 'POST',
      headers: { 'x-api-secret': API_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: customer.email, 
        password: password, 
        full_name: customer.name 
      })
    });
    const createData = await createRes.json();
    console.log('Resposta Lovable (create):', JSON.stringify(createData, null, 2));
  }
  
  // 2. Enviar email com credenciais
  console.log('\n📧 Enviando email de credenciais...');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F7F9FA; margin: 0; padding: 0;">
  <table width="100%" cellPadding="0" cellSpacing="0" style="background-color: #F7F9FA; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellPadding="0" cellSpacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16A085 0%, #2EAE9A 100%); padding: 50px 40px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <span style="font-size: 64px; display: inline-block;">🎉</span>
              </div>
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
                Bem-vindo ao Gravador Médico!
              </h1>
              <p style="color: rgba(255,255,255,0.95); font-size: 16px; margin: 12px 0 0 0;">
                Sua conta está pronta para uso
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1A2E38; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá, <strong>${customer.name}</strong>! 👋
              </p>
              
              <p style="color: #5C7080; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">
                Sua conta no <strong style="color: #16A085;">Gravador Médico</strong> foi criada com sucesso! 
                Use as credenciais abaixo para acessar a plataforma.
              </p>
              
              <!-- Credenciais -->
              <div style="background: linear-gradient(135deg, #F0FDF9 0%, #E8F8F5 100%); border: 2px solid #16A085; border-radius: 12px; padding: 28px; margin-bottom: 32px;">
                <h3 style="color: #16A085; font-size: 15px; font-weight: 600; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  🔐 Suas Credenciais de Acesso
                </h3>
                
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid rgba(22, 160, 133, 0.2);">
                      <span style="color: #5C7080; font-size: 14px;">Email:</span>
                    </td>
                    <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid rgba(22, 160, 133, 0.2);">
                      <strong style="color: #1A2E38; font-size: 14px;">${customer.email}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <span style="color: #5C7080; font-size: 14px;">Senha:</span>
                    </td>
                    <td style="padding: 12px 0; text-align: right;">
                      <code style="background-color: #16A085; color: white; padding: 8px 16px; border-radius: 6px; font-size: 16px; font-weight: 700; letter-spacing: 1px;">${password}</code>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://gravadormedico.com/" style="background: linear-gradient(135deg, #16A085 0%, #2EAE9A 100%); color: white; padding: 18px 48px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);">
                  🚀 Acessar o Portal
                </a>
              </div>
              
              <!-- Dica -->
              <div style="background-color: #FEF3C7; border-radius: 12px; padding: 20px; border: 1px solid #FCD34D;">
                <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>💡 Dica:</strong> Recomendamos que você altere sua senha após o primeiro acesso para maior segurança.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F7F9FA; padding: 30px 40px; text-align: center; border-top: 1px solid #D8DEE4;">
              <p style="color: #5C7080; font-size: 14px; margin: 0 0 8px 0;">
                Dúvidas? Entre em contato:
              </p>
              <a href="mailto:suporte@gravadormedico.com.br" style="color: #16A085; font-size: 14px; text-decoration: none; font-weight: 600;">
                suporte@gravadormedico.com.br
              </a>
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #D8DEE4;">
                <p style="color: #5C7080; font-size: 12px; margin: 0;">
                  © 2026 Gravador Médico. Todos os direitos reservados.
                </p>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  
  const emailRes = await resend.emails.send({
    from: 'Gravador Médico <noreply@gravadormedico.com.br>',
    to: customer.email,
    subject: '🎉 Suas credenciais do Gravador Médico - Acesso Liberado!',
    html: html
  });
  
  if (emailRes.error) {
    console.error('❌ Erro ao enviar email:', emailRes.error);
    return;
  }
  
  console.log('✅ Email enviado! ID:', emailRes.data?.id);
  
  // 3. Registrar no banco de dados
  console.log('\n💾 Registrando no banco de dados...');
  
  // Atualizar status da venda
  const { error: saleError } = await supabase
    .from('sales')
    .update({ 
      order_status: 'delivered',
      updated_at: new Date().toISOString()
    })
    .eq('id', customer.saleId);
  
  if (saleError) {
    console.warn('⚠️ Erro ao atualizar status da venda:', saleError.message);
  } else {
    console.log('✅ Status da venda atualizado para: delivered');
  }
  
  // Registrar log de email
  const { error: logError } = await supabase
    .from('email_logs')
    .insert({
      recipient_email: customer.email,
      recipient_name: customer.name,
      subject: '🎉 Suas credenciais do Gravador Médico - Acesso Liberado!',
      email_type: 'welcome',
      from_email: 'noreply@gravadormedico.com.br',
      from_name: 'Gravador Médico',
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: {
        source: 'manual_script',
        user_email: customer.email,
        note: 'Email enviado via script fix-raul.js'
      }
    });
  
  if (logError) {
    console.warn('⚠️ Erro ao registrar log de email:', logError.message);
  } else {
    console.log('✅ Log de email registrado');
  }
  
  // Atualizar fila de provisionamento
  const { error: queueError } = await supabase
    .from('provisioning_queue')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('sale_id', customer.saleId);
  
  if (queueError) {
    console.warn('⚠️ Erro ao atualizar fila:', queueError.message);
  } else {
    console.log('✅ Fila de provisionamento atualizada');
  }
  
  console.log('\n===========================================');
  console.log('  ✅ PROCESSO CONCLUÍDO COM SUCESSO!');
  console.log('===========================================');
  console.log('\n📋 Resumo:');
  console.log(`  Nome: ${customer.name}`);
  console.log(`  Email: ${customer.email}`);
  console.log(`  Senha: ${password}`);
  console.log('===========================================\n');
}

main().catch(console.error);
