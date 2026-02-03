// =====================================================
// API: HEALTH CHECK DE PÚBLICOS
// =====================================================
// Verifica tamanho e saúde dos públicos na Meta
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

interface AudienceHealth {
  id: string;
  name: string;
  size: number;
  is_healthy: boolean;
  status: string;
  status_description: string;
  last_checked: string;
}

async function getMetaCredentials() {
  const { data: settings } = await supabaseAdmin
    .from('integration_settings')
    .select('meta_ad_account_id')
    .eq('is_default', true)
    .single();

  const adAccountId = settings?.meta_ad_account_id || process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    throw new Error('Credenciais Meta não configuradas');
  }

  return { adAccountId, accessToken };
}

function getStatusDescription(code: number): string {
  const descriptions: Record<number, string> = {
    100: 'Ativo e funcionando',
    200: 'Aviso - pode haver problemas',
    300: 'Preenchendo - aguarde 24-48h',
    400: 'Expirado - precisa recriar',
    500: 'Erro - verifique configurações',
    600: 'Não disponível'
  };
  const bucket = Math.floor(code / 100) * 100;
  return descriptions[bucket] || 'Status desconhecido';
}

// =====================================================
// POST: Health Check de Públicos Específicos
// =====================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audience_ids } = body;

    if (!audience_ids || !Array.isArray(audience_ids) || audience_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Forneça uma lista de audience_ids'
      }, { status: 400 });
    }

    const { accessToken } = await getMetaCredentials();

    const results: AudienceHealth[] = [];

    for (const audienceId of audience_ids) {
      try {
        const response = await fetch(
          `${BASE_URL}/${audienceId}?fields=id,name,approximate_count_lower_bound,delivery_status,operation_status&access_token=${accessToken}`
        );
        
        const data = await response.json();

        if (data.error) {
          results.push({
            id: audienceId,
            name: 'Desconhecido',
            size: 0,
            is_healthy: false,
            status: 'ERROR',
            status_description: data.error.message,
            last_checked: new Date().toISOString()
          });
          continue;
        }

        const size = data.approximate_count_lower_bound || 0;
        const statusCode = data.delivery_status?.code || data.operation_status?.code || 0;

        results.push({
          id: data.id,
          name: data.name,
          size,
          is_healthy: size >= 1000 && statusCode < 400,
          status: statusCode < 300 ? 'READY' : statusCode < 400 ? 'FILLING' : 'ERROR',
          status_description: getStatusDescription(statusCode),
          last_checked: new Date().toISOString()
        });

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        results.push({
          id: audienceId,
          name: 'Erro',
          size: 0,
          is_healthy: false,
          status: 'ERROR',
          status_description: error.message,
          last_checked: new Date().toISOString()
        });
      }
    }

    // Atualizar banco com os tamanhos
    for (const result of results) {
      await supabaseAdmin
        .from('ads_audiences')
        .update({
          approximate_size: result.size,
          health_status: result.status,
          last_health_check: result.last_checked
        })
        .eq('meta_audience_id', result.id);
    }

    return NextResponse.json({
      success: true,
      health_checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.is_healthy).length,
        unhealthy: results.filter(r => !r.is_healthy).length
      }
    });

  } catch (error: any) {
    console.error('[Health Check] Erro:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// =====================================================
// GET: Health Check de Todos os Públicos do Banco
// =====================================================

export async function GET(req: NextRequest) {
  try {
    const { accessToken } = await getMetaCredentials();

    // Buscar todos os públicos do banco
    const { data: audiences, error } = await supabaseAdmin
      .from('ads_audiences')
      .select('meta_audience_id, name, template_id, audience_type, funnel_stage')
      .eq('is_active', true);

    if (error) throw error;

    if (!audiences || audiences.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum público cadastrado',
        health_checks: [],
        summary: { total: 0, healthy: 0, unhealthy: 0 }
      });
    }

    const results: (AudienceHealth & { 
      template_id?: string;
      audience_type?: string;
      funnel_stage?: string;
    })[] = [];

    console.log(`🔍 [Health Check] Verificando ${audiences.length} públicos...`);

    for (const audience of audiences) {
      try {
        const response = await fetch(
          `${BASE_URL}/${audience.meta_audience_id}?fields=id,name,approximate_count_lower_bound,delivery_status,operation_status&access_token=${accessToken}`
        );
        
        const data = await response.json();

        if (data.error) {
          // Público pode ter sido deletado na Meta
          results.push({
            id: audience.meta_audience_id,
            name: audience.name,
            size: 0,
            is_healthy: false,
            status: 'DELETED',
            status_description: 'Público não encontrado na Meta',
            last_checked: new Date().toISOString(),
            template_id: audience.template_id,
            audience_type: audience.audience_type,
            funnel_stage: audience.funnel_stage
          });
          continue;
        }

        const size = data.approximate_count_lower_bound || 0;
        const statusCode = data.delivery_status?.code || data.operation_status?.code || 0;

        results.push({
          id: data.id,
          name: data.name,
          size,
          is_healthy: size >= 1000 && statusCode < 400,
          status: statusCode < 300 ? 'READY' : statusCode < 400 ? 'FILLING' : 'ERROR',
          status_description: getStatusDescription(statusCode),
          last_checked: new Date().toISOString(),
          template_id: audience.template_id,
          audience_type: audience.audience_type,
          funnel_stage: audience.funnel_stage
        });

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        results.push({
          id: audience.meta_audience_id,
          name: audience.name,
          size: 0,
          is_healthy: false,
          status: 'ERROR',
          status_description: error.message,
          last_checked: new Date().toISOString(),
          template_id: audience.template_id,
          audience_type: audience.audience_type,
          funnel_stage: audience.funnel_stage
        });
      }
    }

    // Atualizar banco em batch
    for (const result of results) {
      await supabaseAdmin
        .from('ads_audiences')
        .update({
          approximate_size: result.size,
          health_status: result.status,
          last_health_check: result.last_checked,
          is_active: result.status !== 'DELETED'
        })
        .eq('meta_audience_id', result.id);
    }

    console.log(`✅ [Health Check] Concluído: ${results.filter(r => r.is_healthy).length}/${results.length} saudáveis`);

    return NextResponse.json({
      success: true,
      health_checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.is_healthy).length,
        unhealthy: results.filter(r => !r.is_healthy).length,
        filling: results.filter(r => r.status === 'FILLING').length,
        deleted: results.filter(r => r.status === 'DELETED').length
      }
    });

  } catch (error: any) {
    console.error('[Health Check] Erro fatal:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
