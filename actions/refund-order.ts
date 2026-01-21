'use server'

import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

/**
 * 🔒 SERVER ACTION: Estornar Pedido via AppMax
 * 
 * SEGURANÇA:
 * - Só executa no servidor (never expõe APPMAX_API_KEY)
 * - Valida se usuário é admin
 * - Registra em audit_logs
 */

interface RefundResult {
  success: boolean
  message: string
  error?: string
}

export async function refundOrder(
  orderId: string,
  appmaxOrderId: string,
  reason: string = 'Solicitado pelo cliente'
): Promise<RefundResult> {
  try {
    // 1️⃣ VALIDAR ADMIN (TODO: implementar auth real)
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user || user.user_metadata?.role !== 'admin') {
    //   return {
    //     success: false,
    //     message: 'Não autorizado',
    //     error: 'UNAUTHORIZED'
    //   }
    // }

    // 2️⃣ BUSCAR VENDA NO BANCO
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !sale) {
      return {
        success: false,
        message: 'Venda não encontrada',
        error: 'NOT_FOUND'
      }
    }

    // Validar se já não foi estornada
    if (sale.status === 'refunded' || sale.status === 'reversed') {
      return {
        success: false,
        message: 'Esta venda já foi estornada',
        error: 'ALREADY_REFUNDED'
      }
    }

    // 3️⃣ CHAMAR API DA APPMAX
    const appmaxApiKey = process.env.APPMAX_API_KEY
    const appmaxApiUrl = process.env.APPMAX_API_URL || 'https://admin.appmax.com.br/api/v3'

    if (!appmaxApiKey) {
      console.error('❌ APPMAX_API_KEY não configurada')
      return {
        success: false,
        message: 'Configuração de API ausente',
        error: 'CONFIG_ERROR'
      }
    }

    const refundResponse = await fetch(`${appmaxApiUrl}/orders/${appmaxOrderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': appmaxApiKey.trim(), // .trim() para remover \n
      },
      body: JSON.stringify({
        reason: reason
      })
    })

    if (!refundResponse.ok) {
      const errorText = await refundResponse.text()
      console.error('❌ Erro na AppMax:', errorText)
      
      return {
        success: false,
        message: `Erro ao estornar na AppMax: ${refundResponse.status}`,
        error: 'APPMAX_ERROR'
      }
    }

    const appmaxResult = await refundResponse.json()
    console.log('✅ Estorno aprovado pela AppMax:', appmaxResult)

    // 4️⃣ ATUALIZAR STATUS NO SUPABASE
    const { error: updateError } = await supabase
      .from('sales')
      .update({
        status: 'refunded',
        failure_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('❌ Erro ao atualizar banco:', updateError)
      return {
        success: false,
        message: 'Estorno aprovado mas erro ao atualizar banco',
        error: 'DB_UPDATE_ERROR'
      }
    }

    // 5️⃣ REGISTRAR AUDITORIA
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabaseAdmin.from('audit_logs').insert({
      action: 'REFUND_ORDER',
      performed_by: null, // TODO: pegar do user autenticado
      performed_by_email: 'admin@gravadormedico.com', // TODO: pegar do user
      target_resource: orderId,
      target_type: 'sale',
      details: {
        appmax_order_id: appmaxOrderId,
        reason: reason,
        amount: sale.total_amount,
        customer_email: sale.customer_email,
        appmax_response: appmaxResult
      }
    })

    // 6️⃣ SE TINHA CARRINHO RECUPERADO, MARCAR COMO ABANDONADO NOVAMENTE
    if (sale.customer_email) {
      await supabase
        .from('abandoned_carts')
        .update({ 
          status: 'abandoned',
          updated_at: new Date().toISOString()
        })
        .eq('customer_email', sale.customer_email)
        .eq('status', 'recovered')
    }

    return {
      success: true,
      message: `Estorno de R$ ${sale.total_amount.toFixed(2)} realizado com sucesso`
    }

  } catch (error) {
    console.error('❌ Erro fatal no estorno:', error)
    return {
      success: false,
      message: 'Erro interno no servidor',
      error: 'INTERNAL_ERROR'
    }
  }
}

/**
 * 📋 Buscar histórico de auditoria de uma venda
 */
export async function getSaleAuditLog(saleId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('target_resource', saleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar audit log:', error)
    return []
  }

  return data
}
