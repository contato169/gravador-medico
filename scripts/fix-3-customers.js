#!/usr/bin/env node
// =====================================================
// 🔧 SCRIPT: Corrigir credenciais de 3 clientes
// - Thaynara Oliveira
// - Júlio Cezar dos Santos  
// - Flávio Augusto
// =====================================================

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Valores corretos da Edge Function do Lovable
const LOVABLE_URL = 'https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager';
const API_SECRET = '26+Sucesso+GH';

// Clientes a processar
const CUSTOMERS = [
  { name: 'Thaynara Oliveira', email: 'thaynara.kellen@gmail.com' },
  { name: 'Júlio Cezar dos Santos', email: 'drjuliocezar@mac.com' },
  { name: 'Flávio Augusto', email: 'flavio.augusto20@unifesp.br' }
];

// Cores do Design System
const colors = {
  primary: '#16A085',
  accent: '#2EAE9A',
  background: '#F7F9FA',
  card: '#FFFFFF',
  textPrimary: '#1A2E38',
  textSecondary: '#5C7080',
};

// Gerar senha segura
function generateSecurePassword(length = 12) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%';
  const all = upper + lower + numbers + special;
  
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Buscar usuário existente no Lovable
async function findUser(email) {
  const response = await fetch(LOVABLE_URL, {
    method: 'GET',
    headers: {
      'x-api-secret': API_SECRET,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return data.users?.find(u => u.email === email);
}

// Criar usuário no Lovable
async function createUser(email, password, fullName) {
  const response = await fetch(LOVABLE_URL, {
    method: 'POST',
    headers: {
      'x-api-secret': API_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  
  return response.json();
}

// Resetar senha no Lovable
async function resetPassword(userId, newPassword) {
  const response = await fetch(LOVABLE_URL, {
    method: 'PUT',
    headers: {
      'x-api-secret': API_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, newPassword }),
  });
  
  return response.json();
}

// Enviar email de boas-vindas
async function sendWelcomeEmail(customer, password) {
  const loginUrl = 'https://gravadormedico.com/';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${colors.background};">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.card}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%); padding: 40px 40px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                    🎉 Bem-vindo ao Gravador Médico!
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                    Suas credenciais de acesso estão prontas
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: ${colors.textPrimary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Olá <strong>${customer.name}</strong>,
                  </p>
                  
                  <p style="color: ${colors.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Sua conta no <strong>Gravador Médico</strong> está pronta! Use as credenciais abaixo para acessar a plataforma:
                  </p>
                  
                  <!-- Credenciais Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0FDF9; border: 2px solid ${colors.primary}; border-radius: 12px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 25px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom: 15px;">
                              <span style="color: ${colors.textSecondary}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Email</span><br>
                              <span style="color: ${colors.textPrimary}; font-size: 18px; font-weight: 600;">${customer.email}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="border-top: 1px solid ${colors.primary}30; padding-top: 15px;">
                              <span style="color: ${colors.textSecondary}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Senha</span><br>
                              <span style="color: ${colors.primary}; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">${password}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          🚀 Acessar Plataforma
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: ${colors.textSecondary}; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                    💡 <strong>Dica:</strong> Salve este email ou anote sua senha em local seguro.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: ${colors.background}; padding: 25px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                  <p style="color: ${colors.textSecondary}; font-size: 13px; margin: 0;">
                    © 2026 Gravador Médico - Todos os direitos reservados
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const result = await resend.emails.send({
    from: 'Gravador Médico <noreply@gravadormedico.com.br>',
    to: customer.email,
    subject: '🎉 Suas credenciais do Gravador Médico',
    html: html,
  });

  return result;
}

// Processar um cliente
async function processCustomer(customer) {
  console.log(`\n📌 Processando: ${customer.name} <${customer.email}>`);
  
  const password = generateSecurePassword();
  console.log(`   🔑 Nova senha: ${password}`);
  
  // 1. Verificar se usuário existe
  const existingUser = await findUser(customer.email);
  
  if (existingUser) {
    console.log(`   ✅ Usuário encontrado: ${existingUser.id}`);
    
    // 2. Resetar senha
    const resetResult = await resetPassword(existingUser.id, password);
    if (resetResult.success) {
      console.log(`   ✅ Senha resetada com sucesso`);
    } else {
      console.log(`   ❌ Erro ao resetar: ${resetResult.message || resetResult.error}`);
      return { success: false, error: 'Erro ao resetar senha' };
    }
  } else {
    console.log(`   ℹ️ Usuário não existe, criando...`);
    
    // 2. Criar usuário
    const createResult = await createUser(customer.email, password, customer.name);
    if (createResult.success || createResult.user) {
      console.log(`   ✅ Usuário criado: ${createResult.user?.id}`);
    } else {
      console.log(`   ❌ Erro ao criar: ${createResult.message || createResult.error}`);
      return { success: false, error: 'Erro ao criar usuário' };
    }
  }
  
  // 3. Enviar email
  console.log(`   📧 Enviando email...`);
  const emailResult = await sendWelcomeEmail(customer, password);
  
  if (emailResult.data?.id) {
    console.log(`   ✅ Email enviado! ID: ${emailResult.data.id}`);
    return { success: true, password, emailId: emailResult.data.id };
  } else {
    console.log(`   ❌ Erro ao enviar email:`, emailResult.error);
    return { success: false, error: 'Erro ao enviar email', password };
  }
}

// Main
async function main() {
  console.log('=====================================================');
  console.log('🔧 CORRIGINDO CREDENCIAIS DE 3 CLIENTES');
  console.log('=====================================================');
  console.log('URL Lovable:', LOVABLE_URL);
  
  const results = [];
  
  for (const customer of CUSTOMERS) {
    const result = await processCustomer(customer);
    results.push({ ...customer, ...result });
  }
  
  // Resumo
  console.log('\n=====================================================');
  console.log('📊 RESUMO');
  console.log('=====================================================');
  
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.name} <${r.email}>`);
    if (r.success) {
      console.log(`   Senha: ${r.password}`);
    } else {
      console.log(`   Erro: ${r.error}`);
    }
  });
  
  console.log('\n✨ Processo finalizado!');
}

main().catch(console.error);
