/**
 * =====================================================
 * API: GERAR COPIES COM IA
 * =====================================================
 * 
 * POST /api/ads/generate-copies
 * 
 * Recebe análise do criativo + objetivo e gera:
 * - 3 variações de copy com ranking
 * - Indicação da copy CAMPEÃ
 * - Justificativas para cada variação
 * - Verificação de duplicatas contra anúncios ativos
 * 
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateCopiesWithWinnerPrediction, 
  regenerateCopies,
  CreativeAnalysis,
  CopyVariation
} from '@/lib/meta/creative-analyzer';
import { ObjectiveType } from '@/lib/gravador-medico-knowledge';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import {
  getActiveCampaignsCache,
  checkCopyDuplication,
  generateAntiDuplicationContext,
  ActiveCampaignAd
} from '@/lib/ads/active-campaigns-analyzer';

interface GenerateCopiesRequest {
  objective_type: ObjectiveType;
  creative_analysis: CreativeAnalysis;
  additional_context?: string;
  regenerate?: boolean;
  previous_variations?: CopyVariation[];
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação via cookie auth_token ou header Authorization
    let token: string | undefined;
    
    // Tentar do header primeiro
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    // Se não tiver no header, tentar do cookie
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar JWT próprio
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    console.log(`📝 [Generate Copies API] Usuário: ${payload.email}`);

    // Parse do body
    const body: GenerateCopiesRequest = await req.json();
    const { 
      objective_type, 
      creative_analysis, 
      additional_context,
      regenerate,
      previous_variations
    } = body;

    // Validações
    if (!objective_type || !['TRAFEGO', 'CONVERSAO', 'REMARKETING'].includes(objective_type)) {
      return NextResponse.json(
        { error: 'objective_type inválido. Use: TRAFEGO, CONVERSAO ou REMARKETING' },
        { status: 400 }
      );
    }

    if (!creative_analysis) {
      return NextResponse.json(
        { error: 'creative_analysis é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`✍️ [Generate Copies API] Objetivo: ${objective_type}, Regenerar: ${regenerate || false}`);

    // =====================================================
    // BUSCAR CAMPANHAS ATIVAS PARA EVITAR DUPLICATAS
    // =====================================================
    let activeCampaigns: ActiveCampaignAd[] = [];
    let antiDuplicationContext = '';
    
    try {
      // Buscar ID da conta Meta do banco
      const accountId = process.env.FACEBOOK_AD_ACCOUNT_ID;
      
      if (accountId) {
        activeCampaigns = await getActiveCampaignsCache(accountId);
        
        if (activeCampaigns.length > 0) {
          antiDuplicationContext = generateAntiDuplicationContext(activeCampaigns);
          console.log(`📊 [Generate Copies API] ${activeCampaigns.length} anúncios ativos encontrados para verificação de duplicatas`);
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ [Generate Copies API] Não foi possível buscar campanhas ativas:', cacheError);
    }

    // Combinar contexto adicional com contexto anti-duplicata
    const enrichedContext = [additional_context, antiDuplicationContext].filter(Boolean).join('\n\n');

    // Gerar copies com previsão de performance
    let result;
    
    if (regenerate && previous_variations?.length) {
      // Regenerar com novos ângulos
      result = await regenerateCopies(
        objective_type,
        creative_analysis,
        enrichedContext,
        previous_variations
      );
    } else {
      // Primeira geração
      result = await generateCopiesWithWinnerPrediction(
        objective_type,
        creative_analysis,
        enrichedContext
      );
    }

    console.log('✅ [Generate Copies API] Copies geradas com sucesso');

    // =====================================================
    // VERIFICAR DUPLICATAS NAS COPIES GERADAS
    // =====================================================
    const validatedVariations = result.variations?.map((variation: CopyVariation) => {
      const duplicationCheck = checkCopyDuplication(
        variation.primary_text,
        activeCampaigns
      );
      
      return {
        ...variation,
        duplicationCheck: {
          isDuplicate: duplicationCheck.isDuplicate,
          similarity: duplicationCheck.similarity,
          warning: duplicationCheck.warning
        }
      };
    }) || [];

    // Log simplificado
    console.log(`📊 [Generate Copies API] ${validatedVariations.length} variações geradas e validadas para ${objective_type}`);
    
    // Contar duplicatas
    const duplicatesCount = validatedVariations.filter((v: any) => v.duplicationCheck?.isDuplicate).length;
    if (duplicatesCount > 0) {
      console.warn(`⚠️ [Generate Copies API] ${duplicatesCount} variações similares a anúncios existentes`);
    }

    return NextResponse.json({
      success: true,
      variations: validatedVariations,
      generation_notes: result.generation_notes,
      activeCampaignsCount: activeCampaigns.length
    });

  } catch (error: any) {
    console.error('[Generate Copies API] Erro:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro interno ao gerar copies',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
