import { NextResponse } from "next/server";
import { processProvisioningQueue } from "@/lib/provisioning-worker";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * 🔧 ROTA DE SISTEMA: Executar Worker de Provisionamento
 * 
 * Força a execução do worker de provisionamento para processar
 * vendas pendentes na fila (criar usuário no Lovable + enviar email).
 * 
 * Uso: GET /api/system/run-worker
 * Proteção: Apenas chamadas internas (pode adicionar token se necessário)
 */

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log("🔧 [SYSTEM] Forçando execução do worker via API System...");
    
    // 1️⃣ Buscar itens pendentes para debug
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('provisioning_queue')
      .select(`
        id,
        sale_id,
        status,
        stage,
        retry_count,
        last_error,
        created_at
      `)
      .in('status', ['pending', 'failed', 'processing'])
      .order('created_at', { ascending: true });

    if (pendingError) {
      console.error("❌ Erro ao buscar fila:", pendingError);
    }

    console.log(`📋 Itens na fila para processar: ${pending?.length || 0}`);
    
    // Log detalhado dos itens pendentes
    if (pending && pending.length > 0) {
      pending.forEach((item, index) => {
        console.log(`   ${index + 1}. Sale: ${item.sale_id} | Status: ${item.status} | Retries: ${item.retry_count} | Error: ${item.last_error || 'N/A'}`);
      });
    }

    // 2️⃣ Buscar dados das vendas associadas
    const saleIds = pending?.map(p => p.sale_id) || [];
    let salesInfo: any[] = [];
    
    if (saleIds.length > 0) {
      const { data: sales } = await supabaseAdmin
        .from('sales')
        .select('id, customer_email, customer_name, status, order_status, payment_gateway')
        .in('id', saleIds);
      
      salesInfo = sales || [];
      
      console.log("📦 Vendas associadas:");
      salesInfo.forEach((sale, index) => {
        console.log(`   ${index + 1}. ${sale.customer_email} | Status: ${sale.status}/${sale.order_status} | Gateway: ${sale.payment_gateway}`);
      });
    }

    // 3️⃣ Executar o worker manualmente
    console.log("⚙️ Executando processProvisioningQueue()...");
    const results = await processProvisioningQueue();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Worker concluído em ${duration}ms`);
    console.log("📊 Resultados:", JSON.stringify(results, null, 2));

    // 4️⃣ Verificar estado após processamento
    const { data: afterProcessing } = await supabaseAdmin
      .from('provisioning_queue')
      .select('id, sale_id, status, stage, last_error')
      .in('sale_id', saleIds);

    return NextResponse.json({
      success: true,
      message: "Worker executado com sucesso",
      duration_ms: duration,
      before: {
        items_in_queue: pending?.length || 0,
        items: pending?.map(p => ({
          sale_id: p.sale_id,
          status: p.status,
          stage: p.stage,
          retry_count: p.retry_count,
          last_error: p.last_error
        }))
      },
      sales: salesInfo.map(s => ({
        id: s.id,
        email: s.customer_email,
        name: s.customer_name,
        status: s.status,
        order_status: s.order_status,
        gateway: s.payment_gateway
      })),
      worker_results: results,
      after: {
        items: afterProcessing?.map(p => ({
          sale_id: p.sale_id,
          status: p.status,
          stage: p.stage,
          last_error: p.last_error
        }))
      }
    });

  } catch (error: any) {
    console.error("❌ [SYSTEM] Erro ao executar worker:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST também disponível para compatibilidade
export async function POST(request: Request) {
  return GET(request);
}
