/**
 * 🤖 API ROUTE - Campaign AI Insights
 * 
 * Endpoint para análise de campanhas usando IA
 * GET: Retorna análise completa das campanhas
 * POST: Chat interativo sobre campanhas
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeCampaigns, chatAboutCampaigns, AIAnalysisResult } from '@/lib/ai-advisor';
import { calculateAdsMetrics, CampaignInsight } from '@/lib/meta-marketing';

// Cache em memória (em produção, usar Redis)
const analysisCache = new Map<string, { data: AIAnalysisResult; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

/**
 * GET - Retorna análise completa das campanhas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'last_7d';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Verifica cache
    const cacheKey = `analysis-${period}`;
    const cached = analysisCache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString()
      });
    }

    // Busca dados das campanhas
    const adsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ads/insights?period=${period}&level=campaign`,
      { cache: 'no-store' }
    );

    if (!adsResponse.ok) {
      throw new Error('Falha ao buscar dados das campanhas');
    }

    const campaignsData: CampaignInsight[] = await adsResponse.json();
    
    if (!Array.isArray(campaignsData) || campaignsData.length === 0) {
      return NextResponse.json({
        summary: 'Nenhuma campanha encontrada no período selecionado.',
        insights: [],
        recommendations: ['Configure suas campanhas no Facebook Ads Manager'],
        healthScore: 0,
        generatedAt: new Date().toISOString(),
        cached: false
      });
    }

    // Calcula métricas agregadas
    const metrics = calculateAdsMetrics(campaignsData);

    // Busca métricas do dashboard (opcional)
    let dashboardMetrics;
    try {
      const dashboardResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/metrics`,
        { cache: 'no-store' }
      );
      if (dashboardResponse.ok) {
        const dashData = await dashboardResponse.json();
        dashboardMetrics = {
          revenue: dashData.revenue || 0,
          sales: dashData.sales || 0,
          visitors: dashData.unique_visitors || 0,
          conversionRate: dashData.conversion_rate || 0,
          averageOrderValue: dashData.average_order_value || 0,
          revenueChange: dashData.revenue_change || 0,
          salesChange: dashData.sales_change || 0,
        };
      }
    } catch (e) {
      console.log('Dashboard metrics not available:', e);
    }

    // Analisa com IA
    const analysis = await analyzeCampaigns(metrics, dashboardMetrics);

    // Salva no cache
    analysisCache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });

    return NextResponse.json({
      ...analysis,
      cached: false,
      totalCampaigns: campaignsData.length,
      totalSpend: metrics.totalSpend,
      roas: metrics.roas
    });

  } catch (error) {
    console.error('❌ Erro na análise de IA:', error);
    return NextResponse.json(
      { error: 'Erro ao processar análise. Tente novamente.' },
      { status: 500 }
    );
  }
}

/**
 * POST - Chat interativo sobre campanhas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, history = [] } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Pergunta inválida' },
        { status: 400 }
      );
    }

    // Busca dados das campanhas
    const adsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ads/insights?period=last_7d&level=campaign`,
      { cache: 'no-store' }
    );

    if (!adsResponse.ok) {
      throw new Error('Falha ao buscar dados das campanhas');
    }

    const campaignsData: CampaignInsight[] = await adsResponse.json();
    const metrics = calculateAdsMetrics(campaignsData);

    // Processa pergunta com IA
    const response = await chatAboutCampaigns(question, metrics, history);

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no chat:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pergunta. Tente novamente.' },
      { status: 500 }
    );
  }
}
