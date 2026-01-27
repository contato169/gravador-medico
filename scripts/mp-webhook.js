/**
 * Script para verificar e configurar webhooks do Mercado Pago
 * 
 * IMPORTANTE: Para webhooks funcionarem, você precisa de uma URL pública.
 * Se está em localhost, use ngrok ou deploy em produção.
 */

const ACCESS_TOKEN = 'APP_USR-8963380272153266-012620-b44f7e59d0d47b079c523ee25d19a968-1537908999';

// IMPORTANTE: Substitua pela URL de produção ou ngrok
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://gravadormedico.com.br/api/webhooks/mercadopago-v3';

async function checkCurrentWebhooks() {
  console.log('🔍 Verificando webhooks existentes...\n');
  
  try {
    const response = await fetch('https://api.mercadopago.com/v1/webhooks', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Erro ao buscar webhooks:', response.status, error);
      return [];
    }
    
    const webhooks = await response.json();
    
    if (webhooks.length === 0) {
      console.log('⚠️  Nenhum webhook configurado!\n');
    } else {
      console.log(`✅ ${webhooks.length} webhook(s) encontrado(s):\n`);
      webhooks.forEach((webhook, i) => {
        console.log(`  ${i + 1}. ID: ${webhook.id}`);
        console.log(`     URL: ${webhook.url}`);
        console.log(`     Topics: ${webhook.topics?.join(', ') || 'N/A'}`);
        console.log(`     Status: ${webhook.status}`);
        console.log('');
      });
    }
    
    return webhooks;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return [];
  }
}

async function createWebhook(url) {
  console.log(`\n🔧 Criando webhook para: ${url}\n`);
  
  try {
    const response = await fetch('https://api.mercadopago.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        topics: ['payment', 'merchant_order']
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.log('❌ Erro ao criar webhook:', response.status);
      console.log(JSON.stringify(result, null, 2));
      return null;
    }
    
    console.log('✅ Webhook criado com sucesso!');
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Topics: ${result.topics?.join(', ')}`);
    
    return result;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }
}

async function deleteWebhook(id) {
  console.log(`\n🗑️  Deletando webhook ${id}...\n`);
  
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/webhooks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok || response.status === 204) {
      console.log('✅ Webhook deletado com sucesso!');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Erro ao deletar:', response.status, error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

async function testWebhook(paymentId) {
  console.log(`\n🧪 Testando webhook com payment ${paymentId}...\n`);
  
  try {
    // Busca dados do pagamento
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Erro ao buscar pagamento:', response.status, error);
      return;
    }
    
    const payment = await response.json();
    
    console.log('📦 Dados do Pagamento:');
    console.log(`   ID: ${payment.id}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Status Detail: ${payment.status_detail}`);
    console.log(`   Valor: R$ ${payment.transaction_amount}`);
    console.log(`   Email: ${payment.payer?.email}`);
    console.log(`   Método: ${payment.payment_method_id}`);
    console.log(`   External Ref: ${payment.external_reference}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function listRecentPayments() {
  console.log('\n📋 Listando pagamentos recentes...\n');
  
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10', {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Erro:', response.status, error);
      return;
    }
    
    const data = await response.json();
    
    if (data.results.length === 0) {
      console.log('⚠️  Nenhum pagamento encontrado.');
      return;
    }
    
    console.log(`✅ ${data.results.length} pagamento(s) encontrado(s):\n`);
    data.results.forEach((p, i) => {
      console.log(`  ${i + 1}. ID: ${p.id}`);
      console.log(`     Status: ${p.status}`);
      console.log(`     Valor: R$ ${p.transaction_amount}`);
      console.log(`     Email: ${p.payer?.email || 'N/A'}`);
      console.log(`     Data: ${new Date(p.date_created).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  console.log('========================================');
  console.log('🔧 Mercado Pago Webhook Manager');
  console.log('========================================\n');
  
  console.log(`Access Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
  console.log(`Webhook URL padrão: ${WEBHOOK_URL}\n`);
  
  switch (command) {
    case 'check':
      await checkCurrentWebhooks();
      break;
      
    case 'create':
      const url = args[1] || WEBHOOK_URL;
      await createWebhook(url);
      break;
      
    case 'delete':
      const id = args[1];
      if (!id) {
        console.log('❌ Informe o ID do webhook: node mp-webhook.js delete <ID>');
        return;
      }
      await deleteWebhook(id);
      break;
      
    case 'payments':
      await listRecentPayments();
      break;
      
    case 'test':
      const paymentId = args[1];
      if (!paymentId) {
        console.log('❌ Informe o ID do pagamento: node mp-webhook.js test <PAYMENT_ID>');
        return;
      }
      await testWebhook(paymentId);
      break;
      
    default:
      console.log('Comandos disponíveis:');
      console.log('  node mp-webhook.js check              - Verificar webhooks existentes');
      console.log('  node mp-webhook.js create [URL]       - Criar webhook');
      console.log('  node mp-webhook.js delete <ID>        - Deletar webhook');
      console.log('  node mp-webhook.js payments           - Listar pagamentos recentes');
      console.log('  node mp-webhook.js test <PAYMENT_ID>  - Testar dados de um pagamento');
  }
  
  console.log('\n========================================');
  console.log('⚠️  IMPORTANTE:');
  console.log('========================================');
  console.log('');
  console.log('Para webhooks funcionarem, a URL precisa ser PÚBLICA.');
  console.log('');
  console.log('Opções:');
  console.log('1. Deploy em produção (Vercel, etc)');
  console.log('2. Usar ngrok para expor localhost:');
  console.log('   ngrok http 3000');
  console.log('');
  console.log('Depois configure o webhook com a URL:');
  console.log('   node scripts/mp-webhook.js create https://SUA-URL/api/webhooks/mercadopago-v3');
  console.log('');
}

main();
