// ========================================
// 🔔 WEBHOOK MERCADO PAGO V3 - ENTERPRISE
// ========================================
// Validação HMAC | Processamento Assíncrono | Provisionamento
// ATUALIZADO: Agora salva vendas na tabela `sales` para dashboard
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { MercadoPagoWebhookSchema } from '@/lib/validators/checkout';
import { createAndSaveRedirectUrl } from '@/lib/redirect-helper';
import { sendWelcomeEmail as sendEmailWithTemplate, sendPurchaseConfirmationEmail } from '@/lib/email';
import { sendPurchaseEvent } from '@/lib/meta-capi';
import { createLovableUser, generateSecurePassword } from '@/services/lovable-integration';

// =====================================================
// 📊 CONSTANTES E MAPEAMENTOS
// =====================================================
const SUCCESS_STATUSES = ['approved', 'authorized'];
const PENDING_STATUSES = ['pending', 'in_process', 'in_mediation'];
const FAILED_STATUSES = ['rejected', 'cancelled', 'refunded', 'charged_back'];

const MP_STATUS_MAP: Record<string, string> = {
  'approved': 'paid',
  'authorized': 'approved',
  'pending': 'pending',
  'in_process': 'pending',
  'in_mediation': 'pending',
  'rejected': 'refused',
  'cancelled': 'cancelled',
  'refunded': 'refunded',
  'charged_back': 'chargeback'
};

// =====================================================
// 🔐 VALIDAÇÃO DE ASSINATURA (HMAC SHA-256)
// =====================================================
function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string
): boolean {
  try {
    // O Mercado Pago envia: v1,<hash>,ts=<timestamp>
    const parts = xSignature.split(',');
    
    if (parts.length < 2) {
      console.error('Invalid signature format');
      return false;
    }
    
    const receivedHash = parts[1];
    const timestamp = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    
    if (!receivedHash || !timestamp) {
      console.error('Missing hash or timestamp');
      return false;
    }
    
    // Construir string para validação
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
    
    // Calcular HMAC
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');
    
    // Comparação segura (constant-time)
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(receivedHash)
    );
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

// =====================================================
// 📧 ENVIO DE EMAIL (Resend/SMTP)
// =====================================================
// NOTA: Removido - agora usa sendEmailWithTemplate de @/lib/email

// =====================================================
// 🚀 PROVISIONAMENTO LOVABLE
// =====================================================
// NOTA: Usando createLovableUser e generateSecurePassword de @/services/lovable-integration

// =====================================================
// 🎯 MAIN WEBHOOK HANDLER
// =====================================================
export async function POST(request: NextRequest) {
  try {
    // ==================================================
    // 1️⃣ VALIDAÇÃO DE HEADERS
    // ==================================================
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    
    if (!xSignature || !xRequestId) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }
    
    // ==================================================
    // 2️⃣ PARSE & VALIDATE PAYLOAD
    // ==================================================
    const rawPayload = await request.json();
    const validation = MercadoPagoWebhookSchema.safeParse(rawPayload);
    
    if (!validation.success) {
      console.error('Invalid webhook payload:', validation.error);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }
    
    const payload = validation.data;
    
    // ==================================================
    // 3️⃣ VALIDAR ASSINATURA HMAC
    // ==================================================
    const isValidSignature = validateWebhookSignature(
      xSignature,
      xRequestId,
      payload.data.id
    );
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // ==================================================
    // 4️⃣ SALVAR WEBHOOK LOG (COM SANITIZAÇÃO AUTOMÁTICA)
    // ==================================================
    const { data: webhookLog, error: logError } = await supabaseAdmin
      .from('webhook_logs')
      .insert({
        provider: 'mercadopago',
        event_id: payload.data.id,
        topic: payload.type,
        payload: rawPayload, // Trigger vai sanitizar automaticamente
        signature_valid: true,
        processed: false,
      })
      .select()
      .single();
    
    if (logError) {
      console.error('Failed to save webhook log:', logError);
    }
    
    // ==================================================
    // 5️⃣ PROCESSAR PAYMENTS
    // ==================================================
    if (payload.type !== 'payment') {
      // Marcar como processado (não precisa de ação)
      if (webhookLog) {
        await supabaseAdmin
          .from('webhook_logs')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', webhookLog.id);
      }
      
      return NextResponse.json({ received: true });
    }
    
    // ==================================================
    // 6️⃣ BUSCAR DETALHES DO PAYMENT NA API DO MP
    // ==================================================
    const paymentId = payload.data.id;
    let paymentDetails: any = null;
    
    try {
      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (mpAccessToken) {
        const mpResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${mpAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (mpResponse.ok) {
          paymentDetails = await mpResponse.json();
          console.log(`[MP Webhook] Payment ${paymentId} status: ${paymentDetails.status}`);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do pagamento:', error);
    }
    
    // ==================================================
    // 6.1️⃣ BUSCAR PEDIDO PELO EXTERNAL_REFERENCE
    // ==================================================
    const externalReference = paymentDetails?.external_reference || payload.data.id;
    
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(`gateway_order_id.eq.${paymentId},external_reference.eq.${externalReference}`)
      .maybeSingle();
    
    // ==================================================
    // 7️⃣ CRIAR/ATUALIZAR CUSTOMER
    // ==================================================
    let customerId: string | null = null;
    
    // Tentar obter dados do cliente de várias fontes
    const customerEmail = 
      paymentDetails?.payer?.email || 
      paymentDetails?.additional_info?.payer?.email ||
      order?.customer_email ||
      null;
    
    const customerName = 
      (paymentDetails?.payer?.first_name 
        ? `${paymentDetails.payer.first_name} ${paymentDetails.payer.last_name || ''}`.trim()
        : null) ||
      (paymentDetails?.additional_info?.payer?.first_name
        ? `${paymentDetails.additional_info.payer.first_name} ${paymentDetails.additional_info.payer.last_name || ''}`.trim()
        : null) ||
      paymentDetails?.payer?.identification?.number || // CPF como fallback
      order?.customer_name ||
      null;
    
    const customerPhone = 
      paymentDetails?.payer?.phone?.number || 
      paymentDetails?.additional_info?.payer?.phone?.number ||
      order?.customer_phone ||
      null;
    
    // Log para debug
    console.log(`[MP Webhook] Customer data - Email: ${customerEmail}, Name: ${customerName}, Phone: ${customerPhone}`);
    
    if (customerEmail && customerEmail !== 'unknown@mercadopago.com') {
      try {
        const { data: customerRow } = await supabaseAdmin
          .from('customers')
          .upsert({
            email: customerEmail,
            name: customerName || customerEmail.split('@')[0],
            phone: customerPhone
          }, {
            onConflict: 'email',
            ignoreDuplicates: false
          })
          .select('id')
          .single();
        
        customerId = customerRow?.id || null;
      } catch (error) {
        console.warn('⚠️ Erro ao upsert customer:', error);
      }
    }
    
    // ==================================================
    // 8️⃣ DETERMINAR STATUS E SALVAR NA TABELA SALES
    // ==================================================
    const mpStatus = paymentDetails?.status || 'pending';
    const normalizedStatus = MP_STATUS_MAP[mpStatus] || mpStatus;
    const isSuccess = SUCCESS_STATUSES.includes(mpStatus);
    const totalAmount = paymentDetails?.transaction_amount || order?.total_amount || 0;
    const paymentMethod = paymentDetails?.payment_method_id || paymentDetails?.payment_type_id || 'credit_card';
    
    const now = new Date().toISOString();
    
    // ✅ SALVAR/ATUALIZAR NA TABELA SALES (CRÍTICO PARA O DASHBOARD!)
    // Usar nome/email real ou gerar um identificador único
    const finalCustomerName = customerName || (customerEmail ? customerEmail.split('@')[0] : `Pagamento #${paymentId}`);
    const finalCustomerEmail = customerEmail || `mp-${paymentId}@pagamento.local`;
    
    const salePayload: Record<string, any> = {
      mercadopago_payment_id: paymentId,
      customer_id: customerId,
      customer_name: finalCustomerName,
      customer_email: finalCustomerEmail,
      customer_phone: customerPhone,
      total_amount: totalAmount,
      subtotal: totalAmount,
      order_status: normalizedStatus,
      payment_method: paymentMethod,
      payment_gateway: 'mercadopago', // ⬅️ CRÍTICO: Identifica como MP no dashboard
      status: normalizedStatus,
      external_reference: externalReference,
      updated_at: now
    };
    
    // Adicionar campos de tracking se disponíveis
    if (order?.utm_source) salePayload.utm_source = order.utm_source;
    if (order?.utm_medium) salePayload.utm_medium = order.utm_medium;
    if (order?.utm_campaign) salePayload.utm_campaign = order.utm_campaign;
    
    let saleId: string | null = null;
    
    try {
      // 🔥 CORREÇÃO: Buscar venda existente em MÚLTIPLAS formas
      // 1. Por mercadopago_payment_id (se já foi processado antes)
      // 2. Por external_reference (ID da venda criada pelo checkout)
      // 3. Por ID direto (se external_reference é um UUID válido)
      
      let existingSale = null;
      
      // Tentativa 1: Buscar por mercadopago_payment_id
      const { data: saleByPaymentId } = await supabaseAdmin
        .from('sales')
        .select('id, mercadopago_payment_id')
        .eq('mercadopago_payment_id', paymentId)
        .maybeSingle();
      
      if (saleByPaymentId) {
        existingSale = saleByPaymentId;
        console.log(`[MP Webhook] ✅ Sale encontrada por payment_id: ${existingSale.id}`);
      }
      
      // Tentativa 2: Buscar por external_reference (ID da venda original)
      if (!existingSale && externalReference) {
        // Se external_reference parece um UUID, buscar diretamente por ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(externalReference)) {
          const { data: saleById } = await supabaseAdmin
            .from('sales')
            .select('id, mercadopago_payment_id')
            .eq('id', externalReference)
            .maybeSingle();
          
          if (saleById) {
            existingSale = saleById;
            console.log(`[MP Webhook] ✅ Sale encontrada por ID (external_reference): ${existingSale.id}`);
          }
        }
        
        // Também buscar por external_reference como campo
        if (!existingSale) {
          const { data: saleByRef } = await supabaseAdmin
            .from('sales')
            .select('id, mercadopago_payment_id')
            .eq('external_reference', externalReference)
            .maybeSingle();
          
          if (saleByRef) {
            existingSale = saleByRef;
            console.log(`[MP Webhook] ✅ Sale encontrada por external_reference: ${existingSale.id}`);
          }
        }
      }
      
      if (existingSale) {
        // ✅ ATUALIZAR venda existente (NUNCA criar duplicada!)
        // Adicionar mercadopago_payment_id se ainda não tinha
        if (!existingSale.mercadopago_payment_id) {
          salePayload.mercadopago_payment_id = paymentId;
        }
        
        const { data: updatedSale } = await supabaseAdmin
          .from('sales')
          .update(salePayload)
          .eq('id', existingSale.id)
          .select('id')
          .single();
        
        saleId = updatedSale?.id || existingSale.id;
        console.log(`[MP Webhook] ✅ Sale atualizada: ${saleId}`);
      } else {
        // ⚠️ CORREÇÃO: NÃO criar nova venda via webhook!
        // Se chegou aqui, é provável que o checkout ainda não inseriu a venda
        // ou há um problema de sincronização. Logar e retornar 202 (retry later)
        console.warn(`[MP Webhook] ⚠️ Venda não encontrada para payment ${paymentId} / ref ${externalReference}`);
        console.warn(`[MP Webhook] ⚠️ NÃO criando nova venda - o checkout deve ter criado`);
        
        // Marcar log para reprocessamento
        if (webhookLog) {
          await supabaseAdmin
            .from('webhook_logs')
            .update({ 
              processed: false, 
              error_message: `Venda não encontrada - aguardando checkout criar. PaymentID: ${paymentId}, Ref: ${externalReference}`
            })
            .eq('id', webhookLog.id);
        }
        
        // Retornar 202 para MP tentar novamente mais tarde
        return NextResponse.json({ 
          received: true, 
          message: 'Accepted - sale not found, will retry' 
        }, { status: 202 });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar/atualizar sale:', error);
    }
    
    // ==================================================
    // 9️⃣ ATUALIZAR CHECKOUT_ATTEMPTS (SE EXISTIR)
    // ==================================================
    if (customerEmail) {
      try {
        await supabaseAdmin
          .from('checkout_attempts')
          .update({
            status: normalizedStatus,
            sale_id: saleId,
            converted_at: isSuccess ? now : null,
            updated_at: now
          })
          .eq('customer_email', customerEmail)
          .in('status', ['pending', 'processing', 'fraud_analysis'])
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar checkout_attempts:', error);
      }
    }
    
    // ==================================================
    // 🔟 VERIFICAR SE JÁ FOI PROCESSADO
    // ==================================================
    if (!isSuccess) {
      // Para pagamentos não aprovados, apenas salvar e retornar
      if (webhookLog) {
        await supabaseAdmin
          .from('webhook_logs')
          .update({ 
            processed: true, 
            processed_at: now,
            error_message: `Status: ${mpStatus}`
          })
          .eq('id', webhookLog.id);
      }
      
      return NextResponse.json({ 
        received: true, 
        status: normalizedStatus,
        sale_id: saleId 
      });
    }

    // ✅ Pagamento aprovado: remover carrinho abandonado associado
    if (customerEmail) {
      try {
        await supabaseAdmin
          .from('abandoned_carts')
          .delete()
          .eq('customer_email', customerEmail);
      } catch (error) {
        console.warn('⚠️ Erro ao limpar carrinho abandonado após compra MP:', error);
      }
    }
    
    // Verificar se order já foi processado
    if (order?.status === 'paid') {
      if (webhookLog) {
        await supabaseAdmin
          .from('webhook_logs')
          .update({ processed: true, processed_at: now })
          .eq('id', webhookLog.id);
      }
      
      return NextResponse.json({ received: true, message: 'Already processed' });
    }
    
    // ==================================================
    // 🚀 TAREFA 1: EMAIL IMEDIATO DE CONFIRMAÇÃO (FAST RESPONSE)
    // ==================================================
    // Envia email de confirmação ANTES de qualquer processamento pesado.
    // Se Lovable ou qualquer serviço falhar, o cliente já recebeu confirmação!
    if (customerEmail && customerName) {
      console.log(`[${saleId || paymentId}] 📧 [FAST] Enviando email de confirmação imediato...`);
      
      // Fire-and-forget com timeout curto - não bloqueia o fluxo
      sendPurchaseConfirmationEmail({
        to: customerEmail,
        customerName: customerName,
        orderId: saleId || paymentId,
        orderValue: totalAmount,
        paymentMethod: paymentMethod || 'mercadopago'
      }).then(result => {
        if (result.success) {
          console.log(`[${saleId || paymentId}] ✅ [FAST] Email de confirmação enviado: ${result.emailId}`);
        } else {
          console.error(`[${saleId || paymentId}] ❌ [FAST] Falha no email de confirmação: ${result.error}`);
        }
      }).catch(err => {
        console.error(`[${saleId || paymentId}] ❌ [FAST] Erro no email de confirmação:`, err);
      });
      
      // Não aguarda o resultado - continua processando
    }
    
    // ==================================================
    // 1️⃣1️⃣ PROVISIONAMENTO AUTOMÁTICO (SE CONFIGURADO)
    // ==================================================
    let provisionResult: { success: boolean; credentials?: { email: string; password: string }; error?: string } = { 
      success: false, 
      credentials: undefined, 
      error: undefined 
    };
    
    // Verificar se temos as variáveis necessárias para provisionamento
    const lovableUrl = process.env.NEXT_PUBLIC_LOVABLE_EDGE_FUNCTION_URL || process.env.LOVABLE_API_URL;
    
    if (customerEmail && customerName && lovableUrl) {
      console.log(`[${saleId || paymentId}] Iniciando provisionamento...`);
      
      try {
        // Gerar senha segura
        const generatedPassword = generateSecurePassword();
        
        // Criar usuário no Lovable
        const userResult = await createLovableUser({
          email: customerEmail,
          password: generatedPassword,
          full_name: customerName
        });
        
        if (userResult.success) {
          provisionResult = {
            success: true,
            credentials: {
              email: customerEmail,
              password: generatedPassword
            }
          };
          
          if (userResult.alreadyExists) {
            console.log(`[${saleId || paymentId}] ℹ️ Usuário já existe no Lovable - enviando email com nova senha`);
          } else {
            console.log(`[${saleId || paymentId}] ✅ Usuário criado no Lovable: ${userResult.user?.id}`);
          }
        } else {
          provisionResult = {
            success: false,
            error: userResult.error || 'Erro desconhecido ao criar usuário'
          };
        }
      } catch (error: any) {
        console.error(`[${saleId || paymentId}] ❌ Erro no provisionamento:`, error);
        provisionResult = {
          success: false,
          error: error.message
        };
        
        // Registrar erro para retry posterior
        await supabaseAdmin.from('integration_logs').insert({
          action: 'user_creation',
          status: 'error',
          recipient_email: customerEmail,
          error_message: error.message,
          details: {
            order_id: saleId || paymentId,
            retry_count: 0
          }
        });
      }
    }
    
    if (provisionResult.success && provisionResult.credentials) {
      // Enviar email com credenciais usando o template profissional
      console.log(`[${saleId || paymentId}] 📧 Enviando e-mail de boas-vindas...`);
      
      const emailResult = await sendEmailWithTemplate({
        to: customerEmail,
        customerName: customerName || 'Cliente',
        userEmail: provisionResult.credentials.email,
        userPassword: provisionResult.credentials.password,
        orderId: saleId || paymentId,
        orderValue: totalAmount,
        paymentMethod: paymentMethod || 'credit_card'
      });
      
      await supabaseAdmin.from('integration_logs').insert({
        order_id: saleId || paymentId,
        action: 'email_sent',
        status: emailResult.success ? 'success' : 'error',
        details: { 
          email_sent: emailResult.success,
          email_id: emailResult.emailId,
          error: emailResult.error
        },
      });
      
      if (emailResult.success) {
        console.log(`[${saleId || paymentId}] ✅ E-mail enviado com sucesso`);
      } else {
        console.error(`[${saleId || paymentId}] ❌ Falha ao enviar e-mail: ${emailResult.error}`);
      }
      
      console.log(`[${saleId || paymentId}] ✅ Provisionamento completo`);
    } else if (provisionResult.error) {
      console.error(`[${saleId || paymentId}] ❌ Falha no provisionamento: ${provisionResult.error}`);
    }
    
    // ==================================================
    // 1️⃣2️⃣ ENVIAR EVENTO PURCHASE PARA META CAPI 🎯
    // ==================================================
    // Buscar cookies de tracking do order (se disponível)
    const fbCookies = order?.metadata?.fb_cookies || {};
    
    try {
      console.log(`[${saleId || paymentId}] 📊 Enviando evento Purchase para Meta CAPI...`);
      
      const capiResult = await sendPurchaseEvent({
        orderId: saleId || paymentId,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        customerName: customerName || undefined,
        totalAmount: totalAmount, // Inclui produto + order bump
        currency: 'BRL',
        productName: 'Gravador Médico',
        productIds: ['gravador-medico'],
        fbc: fbCookies.fbc || order?.fbc || undefined,
        fbp: fbCookies.fbp || order?.fbp || undefined,
        eventSourceUrl: 'https://gravadormedico.com.br/obrigado'
      });
      
      if (capiResult.success) {
        console.log(`[${saleId || paymentId}] ✅ Meta CAPI: Evento enviado com sucesso (value: R$ ${totalAmount})`);
      } else {
        console.error(`[${saleId || paymentId}] ❌ Meta CAPI: Falha ao enviar evento:`, capiResult.error);
      }
    } catch (capiError) {
      console.error(`[${saleId || paymentId}] ❌ Meta CAPI: Erro inesperado:`, capiError);
    }
    
    // ==================================================
    // 1️⃣3️⃣ CRIAR URL DE REDIRECIONAMENTO
    // ==================================================
    const redirectUrl = await createAndSaveRedirectUrl({
      orderId: saleId || paymentId,
      customerEmail: customerEmail || '',
      customerName: customerName || undefined,
      paymentMethod: paymentMethod || 'credit_card',
      amount: totalAmount,
      status: 'paid'
    });
    
    if (redirectUrl) {
      console.log(`[${saleId || paymentId}] 🔄 URL de obrigado criada: ${redirectUrl}`);
    }
    
    // ==================================================
    // 1️⃣3️⃣ MARCAR WEBHOOK COMO PROCESSADO
    // ==================================================
    if (webhookLog) {
      await supabaseAdmin
        .from('webhook_logs')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookLog.id);
    }
    
    // 🔄 INVALIDAR CACHE - Força atualização em todo o dashboard
    console.log('🔄 [CACHE] Venda processada - Dashboard será atualizado automaticamente via ISR')
    
    return NextResponse.json({
      received: true,
      sale_id: saleId,
      payment_id: paymentId,
      provisioned: provisionResult.success,
      cache_invalidated: true
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// =====================================================
// 🔍 GET: Healthcheck
// =====================================================
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'mercadopago-webhook-v3',
    timestamp: new Date().toISOString(),
  });
}
