#!/usr/bin/env node
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const LOVABLE_URL = 'https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager';
const API_SECRET = '26+Sucesso+GH';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Clientes pendentes (da imagem)
const customers = [
  { name: 'Luiz Antônio Skalecki Gonçalves', email: 'luizskalecki97@gmail.com', saleId: '1e2d6480-43f3-4e95-bdb0-d50b813951a6' },
  { name: 'Michael Miranda Beitto', email: 'chbritto32@gmail.com', saleId: 'a4e080f4-f896-4746-9135-aaade83d6a7d' },
  { name: 'Natasha Valente dos Santos', email: 'natashavalentes@gmail.com', saleId: '4f682755-c9b5-4ccf-85ec-30b13fea4b9b' },
  { name: 'Bianca Lopes Omizzolo', email: 'omizzolobl@gmail.com', saleId: '4180cfd8-b502-4707-8b77-8360b080acb8' },
  { name: 'Gustavo Belam Fioravanti', email: 'gustavofioravanti@icloud.com', saleId: 'c3552ae7-22f5-4ae4-98b9-68ba4e26e90d' },
];

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd + '!';
}

function generateEmailHtml(name, email, password) {
  return `
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
          <tr>
            <td style="padding: 40px;">
              <p style="color: #1A2E38; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá, <strong>${name}</strong>! 👋
              </p>
              <p style="color: #5C7080; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">
                Sua conta no <strong style="color: #16A085;">Gravador Médico</strong> foi criada com sucesso! 
                Use as credenciais abaixo para acessar a plataforma.
              </p>
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
                      <strong style="color: #1A2E38; font-size: 14px;">${email}</strong>
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
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://gravadormedico.com/" style="background: linear-gradient(135deg, #16A085 0%, #2EAE9A 100%); color: white; padding: 18px 48px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(22, 160, 133, 0.3);">
                  🚀 Acessar o Portal
                </a>
              </div>
              <div style="background-color: #FEF3C7; border-radius: 12px; padding: 20px; border: 1px solid #FCD34D;">
                <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>💡 Dica:</strong> Recomendamos que você altere sua senha após o primeiro acesso para maior segurança.
                </p>
              </div>
            </td>
          </tr>
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
</html>`;
}

async function processCustomer(customer) {
  const password = generatePassword();
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📧 Processando: ${customer.name}`);
  console.log(`   Email: ${customer.email}`);
  console.log(`${'='.repeat(50)}`);
  
  try {
    // 1. Criar usuário no Lovable
    console.log('👤 Criando usuário no Lovable...');
    const createRes = await fetch(LOVABLE_URL, {
      method: 'POST',
      headers: { 'x-api-secret': API_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customer.email, password, full_name: customer.name })
    });
    const createData = await createRes.json();
    
    let userId = createData.userId;
    
    if (createData.error && createData.error.includes('já existe')) {
      console.log('   ℹ️  Usuário já existe, buscando ID...');
      
      // Buscar usuário existente
      const listRes = await fetch(LOVABLE_URL, {
        method: 'GET',
        headers: { 'x-api-secret': API_SECRET }
      });
      const listData = await listRes.json();
      const existingUser = listData.users?.find(u => u.email === customer.email);
      
      if (existingUser) {
        userId = existingUser.id;
        console.log(`   🔑 ID encontrado: ${userId}`);
        
        // Resetar senha
        console.log('   🔄 Resetando senha...');
        const resetRes = await fetch(LOVABLE_URL, {
          method: 'PUT',
          headers: { 'x-api-secret': API_SECRET, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, newPassword: password })
        });
        const resetData = await resetRes.json();
        console.log(`   ${resetData.success ? '✅' : '❌'} Reset: ${resetData.message || resetData.error}`);
      }
    } else if (createData.success) {
      console.log(`   ✅ Usuário criado: ${userId}`);
    } else {
      console.log(`   ❌ Erro: ${createData.error}`);
    }
    
    // 2. Enviar email
    console.log('📧 Enviando email de credenciais...');
    const emailRes = await resend.emails.send({
      from: 'Gravador Médico <noreply@gravadormedico.com.br>',
      to: customer.email,
      subject: '🎉 Suas credenciais do Gravador Médico - Acesso Liberado!',
      html: generateEmailHtml(customer.name, customer.email, password)
    });
    
    if (emailRes.error) {
      console.log(`   ❌ Erro no email: ${emailRes.error.message}`);
      return { success: false, customer, error: emailRes.error.message };
    }
    
    console.log(`   ✅ Email enviado: ${emailRes.data?.id}`);
    
    // 3. Atualizar banco de dados
    console.log('💾 Atualizando banco de dados...');
    
    // Atualizar status da venda
    await supabase
      .from('sales')
      .update({ order_status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', customer.saleId);
    
    // Registrar log de email
    await supabase.from('email_logs').insert({
      recipient_email: customer.email,
      recipient_name: customer.name,
      subject: '🎉 Suas credenciais do Gravador Médico - Acesso Liberado!',
      email_type: 'welcome',
      from_email: 'noreply@gravadormedico.com.br',
      from_name: 'Gravador Médico',
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: { source: 'fix-all-pending.js', user_email: customer.email }
    });
    
    // Atualizar fila
    await supabase
      .from('provisioning_queue')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('sale_id', customer.saleId);
    
    console.log(`   ✅ Banco atualizado!`);
    console.log(`\n   📋 CREDENCIAIS:`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Senha: ${password}`);
    
    return { success: true, customer, password };
    
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { success: false, customer, error: error.message };
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🚀 PROCESSANDO TODOS OS CLIENTES PENDENTES');
  console.log('═'.repeat(60));
  console.log(`  Total: ${customers.length} clientes`);
  
  const results = [];
  
  for (const customer of customers) {
    const result = await processCustomer(customer);
    results.push(result);
    
    // Delay para evitar rate limit
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Resumo final
  console.log('\n' + '═'.repeat(60));
  console.log('  📊 RESUMO FINAL');
  console.log('═'.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`  ✅ Sucesso: ${successCount}`);
  console.log(`  ❌ Falhas: ${failCount}`);
  
  console.log('\n  📋 CREDENCIAIS GERADAS:');
  console.log('  ' + '-'.repeat(56));
  
  for (const r of results.filter(r => r.success)) {
    console.log(`  ${r.customer.name}`);
    console.log(`    📧 ${r.customer.email}`);
    console.log(`    🔑 ${r.password}`);
    console.log('  ' + '-'.repeat(56));
  }
  
  if (failCount > 0) {
    console.log('\n  ❌ FALHAS:');
    for (const r of results.filter(r => !r.success)) {
      console.log(`  - ${r.customer.name}: ${r.error}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ PROCESSO CONCLUÍDO!');
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
