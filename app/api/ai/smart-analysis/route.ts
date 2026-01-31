/**
 * 🧠 API ROUTE - Smart Campaign Analysis v2.0
 * 
 * Análise COMPLETA que cruza:
 * - Meta Ads (campanhas, conjuntos, criativos)
 * - Vendas Reais (gateway de pagamento)
 * - Tráfego (GA4/Analytics)
 * 
 * Calcula ROAS REAL e gera insights acionáveis
 * INCLUI análise de Ad Sets e Criativos
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSmartAnalysis, generateFullAnalysis, RealSalesData, FullAnalysisResult } from '@/lib/smart-analyzer';
import { calculateAdsMetrics, CampaignInsight } from '@/lib/meta-marketing';
import { supabaseAdmin } from '@/lib/supabase';

// Cache em memória
const analysisCache = new Map<string, { data: FullAnalysisResult; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos (reduzido para dados mais frescos)

// Função para buscar vendas reais do banco
async function fetchRealSales(startDate: string, endDate: string): Promise<RealSalesData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sales')
      .select('total_amount, created_at')
      .in('status', ['approved', 'paid', 'completed'])
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (error) {
      console.error('Erro ao buscar vendas:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return {
        totalRevenue: 0,
        totalSales: 0,
        avgTicket: 0,
        period: `${startDate} a ${endDate}`
      };
    }
    
    const totalRevenue = data.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    const totalSales = data.length;
    
    return {
      totalRevenue,
      totalSales,
      avgTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      period: `${startDate} a ${endDate}`
    };
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return null;
  }
}

// Função para calcular datas baseado no período
function getDateRange(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;
  
  switch (period) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const endYesterday = new Date(start);
      endYesterday.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: endYesterday.toISOString() };
    case 'last_7d':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'last_14d':
      start = new Date(now);
      start.setDate(start.getDate() - 14);
      break;
    case 'last_30d':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: start.toISOString(), end: endLastMonth.toISOString() };
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
  }
  
  return { start: start.toISOString(), end };
}

// Função para buscar dados de um nível específico
async function fetchAdsData(baseUrl: string, period: string, level: 'campaign' | 'adset' | 'ad'): Promise<CampaignInsight[]> {
  try {
    const response = await fetch(
      `${baseUrl}/api/ads/insights?period=${period}&level=${level}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      console.error(`Erro ao buscar ${level}:`, response.status);
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Erro ao buscar ${level}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'last_7d';
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Verificar cache
    const cacheKey = `smart-analysis-v2-${period}`;
    const cached = analysisCache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString()
      });
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { start, end } = getDateRange(period);
    
    console.log(`📊 [Smart Analysis v2] Período: ${period}, ${start} até ${end}`);
    
    // Buscar dados de TODOS os níveis em paralelo
    const [campaignsData, adSetsData, adsData] = await Promise.all([
      fetchAdsData(baseUrl, period, 'campaign'),
      fetchAdsData(baseUrl, period, 'adset'),
      fetchAdsData(baseUrl, period, 'ad')
    ]);
    
    console.log(`📊 [Smart Analysis v2] Campanhas: ${campaignsData.length}, AdSets: ${adSetsData.length}, Ads: ${adsData.length}`);
    
    if (campaignsData.length === 0) {
      return NextResponse.json({
        executiveSummary: '⚠️ Nenhuma campanha encontrada no período selecionado. Configure suas campanhas no Facebook Ads Manager.',
        overallScore: 0,
        scoreBreakdown: { efficiency: 0, conversion: 0, scale: 0, health: 0 },
        insights: [],
        campaignHealth: [],
        benchmarks: [],
        topActions: [{
          priority: 1,
          action: 'Configure suas campanhas no Facebook Ads Manager',
          expectedImpact: 'Começar a gerar dados de performance',
          effort: 'high'
        }],
        criticalAlerts: ['Nenhuma campanha ativa encontrada'],
        opportunities: [],
        calculatedMetrics: { roasReal: 0, cpaReal: 0, effectiveCTR: 0, wastedSpend: 0, potentialSavings: 0 },
        adSetAnalysis: [],
        winningAdSets: [],
        losingAdSets: [],
        adCreativeAnalysis: [],
        winningAds: [],
        losingAds: [],
        optimizationPlan: [],
        optimizationSummary: { adsToScale: 0, adsToPause: 0, adsToTest: 0, potentialSavings: 0, potentialGrowth: 0 },
        analyzedAt: new Date().toISOString(),
        dataQuality: 'low',
        warnings: ['Sem dados de campanhas para análise']
      });
    }
    
    // Calcular métricas agregadas das campanhas
    const adsMetrics = calculateAdsMetrics(campaignsData);
    
    // Buscar vendas REAIS do gateway
    let realSales: RealSalesData | null = null;
    try {
      realSales = await fetchRealSales(start, end);
      if (realSales) {
        console.log(`📊 [Smart Analysis v2] Vendas reais: ${realSales.totalSales} vendas, R$ ${realSales.totalRevenue.toFixed(2)}`);
      }
    } catch (e) {
      console.error('Erro ao buscar vendas reais:', e);
    }
    
    // Gerar análise COMPLETA (incluindo ad sets e ads)
    const analysis = generateFullAnalysis(
      adsMetrics,
      adSetsData,
      adsData,
      realSales || undefined
    );
    
    // Salvar no cache
    analysisCache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });
    
    return NextResponse.json({
      ...analysis,
      cached: false,
      totalCampaigns: campaignsData.length,
      totalAdSets: adSetsData.length,
      totalAds: adsData.length,
      realSales: realSales ? {
        revenue: realSales.totalRevenue,
        sales: realSales.totalSales,
        avgTicket: realSales.avgTicket
      } : null
    });
    
  } catch (error) {
    console.error('❌ Erro na análise inteligente:', error);
    return NextResponse.json(
      { error: 'Erro ao processar análise. Tente novamente.' },
      { status: 500 }
    );
  }
}
