// =====================================================
// API: SINCRONIZAR TAMANHOS DOS PÚBLICOS
// =====================================================
// Atualiza o tamanho e status dos públicos existentes
// consultando a Meta API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 [Sync Sizes] Iniciando sincronização...');

    // Buscar access token
    const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json({
        error: 'Token de acesso Meta não configurado'
      }, { status: 400 });
    }

    // Buscar públicos salvos no banco
    const { data: audiences, error } = await supabaseAdmin
      .from('ads_audiences')
      .select('meta_audience_id, name, template_id')
      .not('meta_audience_id', 'is', null);

    if (error) throw error;

    if (!audiences || audiences.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum público para sincronizar'
      });
    }

    console.log(`📊 Sincronizando ${audiences.length} públicos...`);

    const updates = [];
    const errors = [];

    for (const audience of audiences) {
      try {
        const response = await fetch(
          `${BASE_URL}/${audience.meta_audience_id}?fields=approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,time_updated&access_token=${accessToken}`
        );

        const data = await response.json();

        if (data.error) {
          console.error(`⚠️ Erro ao buscar ${audience.name}:`, data.error.message);
          errors.push({
            name: audience.name,
            error: data.error.message
          });
          continue;
        }

        const size = data.approximate_count_lower_bound || 0;
        const status = data.delivery_status?.code === 200 ? 'READY' : 'POPULATING';

        // Atualizar no banco
        const { error: updateError } = await supabaseAdmin
          .from('ads_audiences')
          .update({
            approximate_size: size,
            delivery_status: status,
            last_synced_at: new Date().toISOString()
          })
          .eq('meta_audience_id', audience.meta_audience_id);

        if (updateError) {
          console.error(`⚠️ Erro ao atualizar ${audience.name}:`, updateError);
          errors.push({
            name: audience.name,
            error: updateError.message
          });
          continue;
        }

        updates.push({
          name: audience.name,
          size,
          status,
          template_id: audience.template_id
        });

        console.log(`✅ ${audience.name}: ${size.toLocaleString()} pessoas (${status})`);

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err: any) {
        console.error(`❌ Erro ao sincronizar ${audience.name}:`, err.message);
        errors.push({
          name: audience.name,
          error: err.message
        });
      }
    }

    console.log('✅ [Sync Sizes] Concluído!');

    return NextResponse.json({
      success: true,
      summary: {
        synced: updates.length,
        errors: errors.length,
        total: audiences.length
      },
      updates,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('❌ [Sync Sizes] Erro fatal:', error);
    return NextResponse.json({
      error: 'Erro ao sincronizar tamanhos',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Retorna status da última sincronização
    const { data: audiences, error } = await supabaseAdmin
      .from('ads_audiences')
      .select('name, approximate_size, delivery_status, last_synced_at')
      .not('meta_audience_id', 'is', null)
      .order('approximate_size', { ascending: false });

    if (error) throw error;

    const stats = {
      total: audiences?.length || 0,
      ready: audiences?.filter(a => a.delivery_status === 'READY').length || 0,
      populating: audiences?.filter(a => a.delivery_status === 'POPULATING').length || 0,
      total_reach: audiences?.reduce((acc, a) => acc + (a.approximate_size || 0), 0) || 0
    };

    return NextResponse.json({
      success: true,
      stats,
      audiences: audiences || []
    });

  } catch (error: any) {
    console.error('[Sync Sizes GET] Erro:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
