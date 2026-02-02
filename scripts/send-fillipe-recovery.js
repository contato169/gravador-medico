const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendRecoveryEmail() {
  console.log('📧 Enviando email de recuperação para Fillipe...\n');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Olá Fillipe! 👋</h2>
        
        <p style="color: #555; line-height: 1.6;">
          Notamos que você tentou adquirir o <strong>Gravador Médico</strong> no sábado e 
          infelizmente houve uma instabilidade técnica do nosso lado que impediu a conclusão da compra.
        </p>
        
        <p style="color: #555; line-height: 1.6;">
          <strong>Pedimos sinceras desculpas pelo transtorno!</strong> 🙏
        </p>
        
        <p style="color: #555; line-height: 1.6;">
          Para compensar, preparamos algo especial para você:
        </p>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0;">
          <p style="color: white; font-size: 16px; margin: 0;">🎁 Cupom Exclusivo</p>
          <h1 style="color: white; font-size: 42px; margin: 10px 0; letter-spacing: 3px;">FILIPE5</h1>
          <p style="color: white; font-size: 18px; margin: 0;">💰 <strong>5% de desconto</strong> na sua assinatura</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.gravadormedico.com.br/checkout" 
             style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); 
                    color: white; 
                    padding: 18px 50px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-size: 18px; 
                    font-weight: bold;
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);">
            FINALIZAR MINHA COMPRA →
          </a>
        </div>
        
        <p style="text-align: center; color: #ef4444; font-weight: bold; font-size: 15px;">
          ⚠️ Atenção: Esta oferta é válida apenas até <u>amanhã, 3 de fevereiro</u>!
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <h3 style="color: #333;">O que você vai receber:</h3>
        
        <ul style="color: #555; line-height: 2;">
          <li>✅ <strong>Gravador Médico com IA</strong> - Transcrição automática de consultas</li>
          <li>✅ <strong>Prontuários gerados automaticamente</strong></li>
          <li>✅ <strong>Economia de até 2 horas por dia</strong></li>
          <li>✅ <strong>Acesso imediato após a compra</strong></li>
        </ul>
        
        <p style="color: #555; line-height: 1.6;">
          Qualquer dúvida, é só responder este email que estamos à disposição!
        </p>
        
        <p style="color: #555; line-height: 1.6;">
          Abraços,<br>
          <strong>Equipe Gravador Médico</strong>
        </p>
      </div>
      
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
        📱 Este cupom é pessoal e intransferível.
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Gravador Médico <contato@gravadormedico.com.br>',
      to: 'fillipe1555@gmail.com',
      subject: 'Fillipe, seu desconto exclusivo de 5% está esperando 🎁',
      html: htmlContent
    });

    if (error) {
      console.error('❌ Erro ao enviar:', error);
      return;
    }

    console.log('✅ Email enviado com sucesso!');
    console.log('📨 ID:', data.id);
    console.log('\n📋 Detalhes:');
    console.log('   Para: fillipe1555@gmail.com');
    console.log('   Cupom: FILIPE5 (5% desconto)');
    console.log('   Validade: 3 de fevereiro de 2026');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

sendRecoveryEmail();
