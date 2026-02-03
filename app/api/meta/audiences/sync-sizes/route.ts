// =====================================================
// API: SINCRONIZAR PÚBLICOS DA META
// =====================================================
// 1. Importa públicos que existem na Meta mas não no banco
// 2. Atualiza tamanhos dos públicos existentes
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Buscar configurações do banco
async function getMetaConfig() {
  const { data: settings } = await supabaseAdmin
    .from('integration_settings')
    .select('meta_ad_account_id')
    .eq('is_default', true)
    .eq('setting_key', 'meta_default')
    .limit(1)
    .single();

  const adAccountId = settings?.meta_ad_account_id || process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;

  return { adAccountId, accessToken };
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 [Sync Audiences] Iniciando sincronização completa...');

    const { adAccountId, accessToken } = await getMetaConfig();
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Credenciais Meta não configuradas'
      }, { status: 400 });
    }

    // 1. Buscar TODOS os públicos da Meta API
    console.log('🔍 Buscando públicos da Meta API...');
    const metaResponse = await fetch(
      `${BASE_URL}/act_${adAccountId}/customaudiences?fields=id,name,approximate_count_lower_bound,delivery_status,subtype,description&limit=500&access_token=${accessToken}`
    );
    
    const metaData = await metaResponse.json();
    
    if (metaData.error) {
      console.error('❌ Erro ao buscar públicos da Meta:', metaData.error);
      return NextResponse.json({
        error: metaData.error.message
      }, { status: 500 });
    }

    const metaAudiences = metaData.data || [];
    console.log(`📊 ${metaAudiences.length} públicos encontrados na Meta`);

    // 2. Buscar públicos já no banco
    const { data: dbAudiences } = await supabaseAdmin
      .from('ads_audiences')
      .select('meta_audience_id, name');

    const existingIds = new Set(dbAudiences?.map(a => a.meta_audience_id) || []);
    console.log(`💾 ${existingIds.size} públicos já no banco`);

    const results = {
      imported: [] as any[],
      updated: [] as any[],
      errors: [] as any[]
    };

    // 3. Processar cada público da Meta
    for (const audience of metaAudiences) {
      const size = audience.approximate_count_lower_bound || 0;
      const status = audience.delivery_status?.code === 200 ? 'READY' : 'POPULATING';
      const isLookalike = audience.subtype === 'LOOKALIKE';

      // Determinar tipo e funnel_stage
      let audienceType = 'CUSTOM';
      let sourceType = 'UNKNOWN';
      let funnelStage = 'MEDIO';

      if (isLookalike) {
        audienceType = 'LOOKALIKE';
        funnelStage = 'TOPO';
      } else if (audience.name?.includes('ENG') || audience.name?.includes('Engajamento')) {
        sourceType = 'ENGAGEMENT';
        funnelStage = 'MEDIO';
      } else if (audience.name?.includes('WEB') || audience.name?.includes('Visitante')) {
        sourceType = 'WEBSITE';
        funnelStage = audience.name?.includes('7d') || audience.name?.includes('30d') ? 'FUNDO' : 'MEDIO';
      }

      if (existingIds.has(audience.id)) {
        // Atualizar público existente
        const { error } = await supabaseAdmin
          .from('ads_audiences')
          .update({
            approximate_size: size,
            delivery_status: status,
            last_synced_at: new Date().toISOString()
          })
          .eq('meta_audience_id', audience.id);

        if (error) {
          results.errors.push({ name: audience.name, error: error.message });
        } else {
          results.updated.push({
            name: audience.name,
            size,
            status
          });
        }
      } else {
        // Importar novo público
        const { error } = await supabaseAdmin
          .from('ads_audiences')
          .insert({
            meta_audience_id: audience.id,
            name: audience.name,
            audience_type: audienceType,
            source_type: sourceType,
            funnel_stage: funnelStage,
            approximate_size: size,
            delivery_status: status,
            is_active: true,
            is_essential: audience.name?.includes('[GDM]') || false,
            last_synced_at: new Date().toISOString()
          });

        if (error) {
          results.errors.push({ name: audience.name, error: error.message });
        } else {
          results.imported.push({
            name: audience.name,
            size,
            status,
            type: audienceType
          });
          console.log(`✅ Importado: ${audience.name} (${size} pessoas)`);
        }
      }
    }

    console.log('✅ [Sync Audiences] Concluído!');
    console.log(`   - Importados: ${results.imported.length}`);
    console.log(`   - Atualizados: ${results.updated.length}`);
    console.log(`   - Erros: ${results.errors.length}`);

    return NextResponse.json({
      success: true,
      summary: {
        total_in_meta: metaAudiences.length,
        imported: results.imported.length,
        updated: results.updated.length,
        errors: results.errors.length
      },
      details: results
    });

  } catch (error: any) {
    console.error('❌ [Sync Audiences] Erro fatal:', error);
    return NextResponse.json({
      error: 'Erro ao sincronizar públicos',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: audiences, error } = await supabaseAdmin
      .from('ads_audiences')
      .select('name, approximate_size, delivery_status, funnel_stage, audience_type, last_synced_at')
      .order('approximate_size', { ascending: false });

    if (error) throw error;

    const stats = {
      total: audiences?.length || 0,
      ready: audiences?.filter(a => a.delivery_status === 'READY').length || 0,
      populating: audiences?.filter(a => a.delivery_status === 'POPULATING').length || 0,
      custom: audiences?.filter(a => a.audience_type === 'CUSTOM').length || 0,
      lookalikes: audiences?.filter(a => a.audience_type === 'LOOKALIKE').length || 0,
      total_reach: audiences?.reduce((acc, a) => acc + (a.approximate_size || 0), 0) || 0
    };

    return NextResponse.json({
      success: true,
      stats,
      audiences: audiences || []
    });

  } catch (error: any) {
    console.error('[Sync GET] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
