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

    // Gerar copies com previsão de performance
    let result;
    
    if (regenerate && previous_variations?.length) {
      // Regenerar com novos ângulos
      result = await regenerateCopies(
        objective_type,
        creative_analysis,
        additional_context,
        previous_variations
      );
    } else {
      // Primeira geração
      result = await generateCopiesWithWinnerPrediction(
        objective_type,
        creative_analysis,
        additional_context
      );
    }

    console.log('✅ [Generate Copies API] Copies geradas com sucesso');

    // Log simplificado (sem salvar no banco por enquanto)
    console.log(`📊 [Generate Copies API] ${result.variations?.length || 0} variações geradas para ${objective_type}`);

    return NextResponse.json({
      success: true,
      ...result
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
