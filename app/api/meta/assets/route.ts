/**
 * API: Meta Assets - Lista todos os ativos disponíveis na BM
 * 
 * GET: Lista Ad Accounts, Pages, Pixels, Instagram Accounts
 * POST: Salva configuração selecionada
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// TIPOS
// ============================================

interface MetaAsset {
  id: string;
  name: string;
  // Campos específicos por tipo
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  category?: string;
  username?: string;
  followers_count?: number;
  profile_pic?: string;
  access_token?: string;
  // Instagram vinculado à página
  instagram_actor_id?: string | null;
  instagram_actor_name?: string | null;
}

interface MetaAssetsResponse {
  adAccounts: MetaAsset[];
  pages: MetaAsset[];
  pixels: MetaAsset[];
  instagramAccounts: MetaAsset[];
}

// ============================================
// HELPERS
// ============================================

async function fetchMetaApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('access_token', META_ACCESS_TOKEN!);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    console.error('Meta API Error:', data.error);
    throw new Error(data.error.message || 'Erro na API da Meta');
  }

  return data;
}

// ============================================
// FUNÇÕES DE BUSCA
// ============================================

async function getAdAccounts(): Promise<MetaAsset[]> {
  try {
    const data = await fetchMetaApi<{ data: MetaAsset[] }>('/me/adaccounts', {
      fields: 'id,name,account_status,currency,timezone_name,business_name',
      limit: '100'
    });

    return (data.data || []).map(acc => ({
      id: acc.id.replace('act_', ''),
      name: acc.name || `Conta ${acc.id}`,
      account_status: acc.account_status,
      currency: acc.currency,
      timezone_name: acc.timezone_name
    }));
  } catch (error) {
    console.error('Erro ao buscar Ad Accounts:', error);
    return [];
  }
}

async function getPages(): Promise<MetaAsset[]> {
  try {
    const data = await fetchMetaApi<{ data: Array<{
      id: string;
      name: string;
      category?: string;
      access_token: string;
      instagram_business_account?: {
        id: string;
        username: string;
        profile_picture_url?: string;
        followers_count?: number;
      };
    }> }>('/me/accounts', {
      fields: 'id,name,category,access_token,instagram_business_account{id,username,profile_picture_url,followers_count}',
      limit: '100'
    });

    return (data.data || []).map(page => ({
      id: page.id,
      name: page.name || `Página ${page.id}`,
      category: page.category,
      access_token: page.access_token,
      // Instagram Actor ID (essencial para anúncios no Instagram)
      instagram_actor_id: page.instagram_business_account?.id || null,
      instagram_actor_name: page.instagram_business_account?.username || null
    }));
  } catch (error) {
    console.error('Erro ao buscar Pages:', error);
    return [];
  }
}

async function getPixels(adAccountId?: string): Promise<MetaAsset[]> {
  try {
    // Se temos uma conta de anúncio, buscar pixels dela
    if (adAccountId) {
      const data = await fetchMetaApi<{ data: MetaAsset[] }>(`/act_${adAccountId}/adspixels`, {
        fields: 'id,name,last_fired_time,is_unavailable',
        limit: '50'
      });

      return (data.data || []).map(pixel => ({
        id: pixel.id,
        name: pixel.name || `Pixel ${pixel.id}`
      }));
    }

    // Fallback: buscar via Business Manager (se disponível)
    const data = await fetchMetaApi<{ data: MetaAsset[] }>('/me/adspixels', {
      fields: 'id,name',
      limit: '50'
    });

    return (data.data || []).map(pixel => ({
      id: pixel.id,
      name: pixel.name || `Pixel ${pixel.id}`
    }));
  } catch (error) {
    console.error('Erro ao buscar Pixels:', error);
    return [];
  }
}

async function getInstagramAccounts(): Promise<MetaAsset[]> {
  try {
    // Buscar via páginas conectadas
    const data = await fetchMetaApi<{ data: Array<{ 
      id: string; 
      name: string;
      instagram_business_account?: { 
        id: string; 
        username: string; 
        profile_picture_url?: string;
        followers_count?: number;
      } 
    }> }>('/me/accounts', {
      fields: 'id,name,instagram_business_account{id,username,profile_picture_url,followers_count}',
      limit: '100'
    });

    const igAccounts: MetaAsset[] = [];

    for (const page of data.data || []) {
      if (page.instagram_business_account) {
        igAccounts.push({
          id: page.instagram_business_account.id,
          name: page.instagram_business_account.username || `IG de ${page.name}`,
          username: page.instagram_business_account.username,
          followers_count: page.instagram_business_account.followers_count,
          profile_pic: page.instagram_business_account.profile_picture_url
        });
      }
    }

    return igAccounts;
  } catch (error) {
    console.error('Erro ao buscar Instagram Accounts:', error);
    return [];
  }
}

// ============================================
// GET: Listar todos os ativos
// ============================================

export async function GET(request: NextRequest) {
  try {
    if (!META_ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Token de acesso da Meta não configurado'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const adAccountId = searchParams.get('adAccountId');

    // Buscar todos os ativos em paralelo
    const [adAccounts, pages, instagramAccounts] = await Promise.all([
      getAdAccounts(),
      getPages(),
      getInstagramAccounts()
    ]);

    // Buscar pixels (depende de adAccountId se fornecido)
    const pixels = await getPixels(adAccountId || adAccounts[0]?.id);

    // Buscar configuração salva (global - sistema single-tenant)
    let savedSettings = null;
    
    try {
      // Buscar qualquer configuração default (não depende de user_id para single-tenant)
      const { data } = await supabaseAdmin
        .from('integration_settings')
        .select('*')
        .eq('is_default', true)
        .limit(1)
        .single();
      
      if (data) {
        savedSettings = data;
        console.log('✅ Configuração Meta carregada:', {
          adAccountId: data.meta_ad_account_id,
          pageId: data.meta_page_id,
          pixelId: data.meta_pixel_id
        });
      }
    } catch (e) {
      console.log('ℹ️ Nenhuma configuração Meta salva ainda');
    }

    const response: MetaAssetsResponse & { savedSettings?: unknown } = {
      adAccounts,
      pages,
      pixels,
      instagramAccounts,
      savedSettings
    };

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        adAccountsCount: adAccounts.length,
        pagesCount: pages.length,
        pixelsCount: pixels.length,
        instagramCount: instagramAccounts.length
      }
    });

  } catch (error) {
    console.error('Erro ao listar ativos Meta:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar ativos'
    }, { status: 500 });
  }
}

// ============================================
// POST: Salvar configuração selecionada
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      adAccountId,
      adAccountName,
      pageId,
      pageName,
      pixelId,
      pixelName,
      instagramId,
      instagramName,
      instagramActorId,  // Novo: ID do Instagram vinculado à página
      instagramActorName,
      businessId
    } = body;

    // Validação básica
    if (!adAccountId) {
      return NextResponse.json({
        success: false,
        error: 'Conta de Anúncio é obrigatória'
      }, { status: 400 });
    }

    console.log('📝 Salvando configuração Meta:', {
      adAccountId,
      adAccountName,
      pageId,
      pageName,
      pixelId,
      instagramActorId
    });

    // Preparar dados para salvar (sistema single-tenant - não usa user_id)
    const settingsData = {
      setting_key: 'meta_default',
      meta_ad_account_id: adAccountId,
      meta_ad_account_name: adAccountName,
      meta_page_id: pageId,
      meta_page_name: pageName,
      meta_pixel_id: pixelId,
      meta_pixel_name: pixelName,
      meta_instagram_id: instagramId,
      meta_instagram_name: instagramName,
      instagram_actor_id: instagramActorId || null,
      instagram_actor_name: instagramActorName || null,
      meta_business_id: businessId,
      is_default: true,
      updated_at: new Date().toISOString()
    };

    // Primeiro, deletar configurações antigas para evitar conflitos
    await supabaseAdmin
      .from('integration_settings')
      .delete()
      .eq('setting_key', 'meta_default')
      .eq('is_default', true);

    // Inserir nova configuração
    const { data, error } = await supabaseAdmin
      .from('integration_settings')
      .insert(settingsData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar configuração:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao salvar configuração: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso!',
      data
    });

  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar'
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Remover configuração
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Não autorizado'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('integration_settings')
      .delete()
      .eq('user_id', user.id)
      .eq('setting_key', 'meta_default');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração removida'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao remover configuração'
    }, { status: 500 });
  }
}
