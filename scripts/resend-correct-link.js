#!/usr/bin/env node
// =====================================================
// 🔧 SCRIPT: Reenviar emails com link correto
// Apenas reenvia - NÃO altera senhas
// =====================================================

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

// Clientes com senhas já definidas (não alterar!)
const CUSTOMERS = [
  { name: 'Thaynara Oliveira', email: 'thaynara.kellen@gmail.com', password: '184@EjnKKKTw' },
  { name: 'Júlio Cezar dos Santos', email: 'drjuliocezar@mac.com', password: 'XlpHw34%j7l5' },
  { name: 'Flávio Augusto', email: 'flavio.augusto20@unifesp.br', password: '$GxuPFsEgU5J' }
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

// Enviar email com link CORRETO
async function sendCorrectionEmail(customer) {
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
                  <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 600;">
                    🔗 Link Correto de Acesso
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 15px;">
                    Gravador Médico
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: ${colors.textPrimary}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Olá <strong>${customer.name}</strong>,
                  </p>
                  
                  <p style="color: ${colors.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
                    Estamos enviando este email com o <strong>link correto</strong> para acessar o portal do Gravador Médico.
                  </p>
                  
                  <p style="color: ${colors.textSecondary}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Use as credenciais abaixo para fazer login:
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
                              <span style="color: ${colors.primary}; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">${customer.password}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Link correto destacado -->
                  <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <p style="color: #92400E; font-size: 14px; margin: 0;">
                      ⚠️ <strong>Link correto do portal:</strong><br>
                      <a href="${loginUrl}" style="color: ${colors.primary}; font-weight: 600;">${loginUrl}</a>
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          🚀 Acessar Portal
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: ${colors.textSecondary}; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                    💡 <strong>Dica:</strong> Salve este email ou adicione o link aos favoritos.
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
    subject: '🔗 Link Correto de Acesso ao Portal - Gravador Médico',
    html: html,
  });

  return result;
}

// Main
async function main() {
  console.log('=====================================================');
  console.log('📧 REENVIANDO EMAILS COM LINK CORRETO');
  console.log('=====================================================');
  console.log('Link do portal: https://gravadormedico.com/');
  console.log('⚠️  Senhas NÃO serão alteradas!\n');
  
  for (const customer of CUSTOMERS) {
    console.log(`📌 Enviando para: ${customer.name} <${customer.email}>`);
    console.log(`   Senha (mantida): ${customer.password}`);
    
    const result = await sendCorrectionEmail(customer);
    
    if (result.data?.id) {
      console.log(`   ✅ Email enviado! ID: ${result.data.id}\n`);
    } else {
      console.log(`   ❌ Erro:`, result.error, '\n');
    }
  }
  
  console.log('=====================================================');
  console.log('✨ Processo finalizado!');
  console.log('=====================================================');
}

main().catch(console.error);
