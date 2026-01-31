/**
 * 🧠 SMART CAMPAIGN ANALYZER v2.0
 * 
 * Análise COMPLETA e INTELIGENTE de campanhas - SEM depender de API externa
 * Cruza dados de Meta Ads + Vendas Reais + Tráfego para gerar insights profundos
 * 
 * AGORA INCLUI:
 * - Análise de Conjuntos de Anúncios (Ad Sets)
 * - Análise de Criativos (Ads)
 * - Recomendações de Otimização específicas
 * - Identificação de públicos e criativos vencedores
 */

import { AdsMetrics, CampaignInsight, ACTION_TYPES, sumActions, sumActionValues } from './meta-marketing';

// =====================================================
// TIPOS
// =====================================================

export interface SmartInsight {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'opportunity' | 'info';
  category: 'roas' | 'ctr' | 'cpc' | 'conversion' | 'budget' | 'creative' | 'audience' | 'general';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  metrics?: Record<string, number | string>;
  affectedCampaigns?: string[];
}

export interface CampaignHealth {
  name: string;
  score: number; // 0-100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: string[];
  opportunities: string[];
}

export interface SmartAnalysisResult {
  // Resumo Executivo
  executiveSummary: string;
  
  // Health Score Geral (0-100)
  overallScore: number;
  scoreBreakdown: {
    efficiency: number;    // CTR, CPC
    conversion: number;    // ROAS, CPA
    scale: number;         // Volume, alcance
    health: number;        // Campanhas ativas, diversificação
  };
  
  // Insights Detalhados
  insights: SmartInsight[];
  
  // Saúde por Campanha
  campaignHealth: CampaignHealth[];
  
  // Comparativos
  benchmarks: {
    metric: string;
    yourValue: number;
    benchmark: number;
    status: 'above' | 'below' | 'on_target';
    difference: number;
  }[];
  
  // Recomendações Prioritárias
  topActions: {
    priority: number;
    action: string;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
  }[];
  
  // Alertas Críticos
  criticalAlerts: string[];
  
  // Oportunidades Identificadas
  opportunities: string[];
  
  // Métricas Calculadas
  calculatedMetrics: {
    roasReal: number;
    cpaReal: number;
    effectiveCTR: number;
    wastedSpend: number;
    potentialSavings: number;
  };
  
  // Metadados
  analyzedAt: string;
  dataQuality: 'high' | 'medium' | 'low';
  warnings: string[];
}

export interface RealSalesData {
  totalRevenue: number;
  totalSales: number;
  avgTicket: number;
  period: string;
}

// =====================================================
// TIPOS PARA AD SETS E ADS
// =====================================================

export interface AdSetAnalysis {
  id: string;
  name: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  revenue: number;
  roas: number;
  score: number;
  status: 'winner' | 'potential' | 'underperforming' | 'loser';
  recommendation: string;
  issues: string[];
}

export interface AdCreativeAnalysis {
  id: string;
  name: string;
  adsetName: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  score: number;
  status: 'winner' | 'potential' | 'underperforming' | 'loser';
  creativeType: 'image' | 'video' | 'carousel' | 'unknown';
  recommendation: string;
  copyAnalysis?: {
    hasUrgency: boolean;
    hasBenefit: boolean;
    hasCTA: boolean;
  };
}

export interface OptimizationRecommendation {
  level: 'campaign' | 'adset' | 'ad';
  targetName: string;
  type: 'scale' | 'pause' | 'optimize' | 'test' | 'duplicate';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedResult: string;
  howTo: string[];
}

export interface FullAnalysisResult extends SmartAnalysisResult {
  // Análise de Ad Sets
  adSetAnalysis: AdSetAnalysis[];
  winningAdSets: AdSetAnalysis[];
  losingAdSets: AdSetAnalysis[];
  
  // Análise de Criativos
  adCreativeAnalysis: AdCreativeAnalysis[];
  winningAds: AdCreativeAnalysis[];
  losingAds: AdCreativeAnalysis[];
  
  // Recomendações de Otimização Detalhadas
  optimizationPlan: OptimizationRecommendation[];
  
  // Resumo de Otimização
  optimizationSummary: {
    adsToScale: number;
    adsToPause: number;
    adsToTest: number;
    potentialSavings: number;
    potentialGrowth: number;
  };
}

// =====================================================
// BENCHMARKS (E-commerce Brasil 2024-2026)
// =====================================================

const BENCHMARKS = {
  // CTR (Click-Through Rate)
  ctr: {
    excellent: 2.5,
    good: 1.5,
    average: 1.0,
    poor: 0.5
  },
  // CPC (Custo por Clique)
  cpc: {
    excellent: 0.80,
    good: 1.50,
    average: 2.50,
    poor: 4.00
  },
  // CPM (Custo por Mil Impressões)
  cpm: {
    excellent: 10,
    good: 20,
    average: 35,
    poor: 50
  },
  // ROAS
  roas: {
    excellent: 5.0,
    good: 3.0,
    breakeven: 2.0,
    poor: 1.0
  },
  // Taxa de Conversão do Site
  conversionRate: {
    excellent: 4.0,
    good: 2.5,
    average: 1.5,
    poor: 0.5
  },
  // Frequência de Anúncios
  frequency: {
    ideal: 2.5,
    warning: 4.0,
    fatigue: 6.0
  }
};

// =====================================================
// FUNÇÕES DE ANÁLISE
// =====================================================

function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (spend / impressions) * 1000;
}

function analyzeCTR(ctr: number): { status: string; insight: string } {
  if (ctr >= BENCHMARKS.ctr.excellent) {
    return { status: 'excellent', insight: `CTR de ${ctr.toFixed(2)}% está excelente! Seus criativos estão muito atrativos.` };
  }
  if (ctr >= BENCHMARKS.ctr.good) {
    return { status: 'good', insight: `CTR de ${ctr.toFixed(2)}% está bom, mas há espaço para melhorar os criativos.` };
  }
  if (ctr >= BENCHMARKS.ctr.average) {
    return { status: 'average', insight: `CTR de ${ctr.toFixed(2)}% está na média. Teste novos criativos com headlines mais impactantes.` };
  }
  return { status: 'poor', insight: `CTR de ${ctr.toFixed(2)}% está baixo. Seus anúncios não estão chamando atenção. Revise urgentemente os criativos.` };
}

function analyzeCPC(cpc: number): { status: string; insight: string } {
  if (cpc <= BENCHMARKS.cpc.excellent) {
    return { status: 'excellent', insight: `CPC de R$ ${cpc.toFixed(2)} está excelente! Você está pagando muito pouco por clique.` };
  }
  if (cpc <= BENCHMARKS.cpc.good) {
    return { status: 'good', insight: `CPC de R$ ${cpc.toFixed(2)} está bom para o mercado brasileiro.` };
  }
  if (cpc <= BENCHMARKS.cpc.average) {
    return { status: 'average', insight: `CPC de R$ ${cpc.toFixed(2)} está na média. Pode melhorar a segmentação.` };
  }
  return { status: 'poor', insight: `CPC de R$ ${cpc.toFixed(2)} está alto! Você está pagando caro demais por clique. Revise a segmentação.` };
}

function analyzeROAS(roas: number, spend: number): { status: string; insight: string; wastedMoney: number } {
  let wastedMoney = 0;
  
  if (roas >= BENCHMARKS.roas.excellent) {
    return { 
      status: 'excellent', 
      insight: `ROAS de ${roas.toFixed(2)}x está excelente! Cada R$ 1 investido retorna R$ ${roas.toFixed(2)}. Considere escalar o investimento.`,
      wastedMoney: 0
    };
  }
  if (roas >= BENCHMARKS.roas.good) {
    return { 
      status: 'good', 
      insight: `ROAS de ${roas.toFixed(2)}x está bom. Há margem para otimização.`,
      wastedMoney: 0
    };
  }
  if (roas >= BENCHMARKS.roas.breakeven) {
    wastedMoney = spend * 0.2; // 20% poderia ser economizado
    return { 
      status: 'average', 
      insight: `ROAS de ${roas.toFixed(2)}x está próximo do ponto de equilíbrio. Atenção: margem de lucro apertada.`,
      wastedMoney
    };
  }
  if (roas >= BENCHMARKS.roas.poor) {
    wastedMoney = spend * 0.4; // 40% está sendo desperdiçado
    return { 
      status: 'poor', 
      insight: `⚠️ ROAS de ${roas.toFixed(2)}x está ABAIXO do ponto de equilíbrio. Você está PERDENDO dinheiro com ads.`,
      wastedMoney
    };
  }
  
  wastedMoney = spend * 0.6; // 60% desperdiçado
  return { 
    status: 'critical', 
    insight: `🚨 CRÍTICO: ROAS de ${roas.toFixed(2)}x é muito baixo. Pause campanhas imediatamente e revise toda a estratégia.`,
    wastedMoney
  };
}

function identifyWastefulCampaigns(campaigns: CampaignInsight[]): CampaignInsight[] {
  return campaigns.filter(c => {
    const spend = Number(c.spend || 0);
    const clicks = Number(c.clicks || 0);
    const ctr = Number(c.ctr || 0);
    
    // Campanha com gasto > R$50 e CTR < 0.5% é desperdício
    if (spend > 50 && ctr < 0.5) return true;
    
    // Campanha com gasto > R$100 e menos de 10 cliques
    if (spend > 100 && clicks < 10) return true;
    
    return false;
  });
}

function identifyTopPerformers(campaigns: CampaignInsight[]): CampaignInsight[] {
  return campaigns.filter(c => {
    const ctr = Number(c.ctr || 0);
    const cpc = Number(c.cpc || 0);
    
    // CTR > 1.5% e CPC < R$ 2
    return ctr > 1.5 && cpc < 2;
  });
}

function calculateCampaignScore(campaign: CampaignInsight): number {
  let score = 50; // Base
  
  const ctr = Number(campaign.ctr || 0);
  const cpc = Number(campaign.cpc || 0);
  const spend = Number(campaign.spend || 0);
  const clicks = Number(campaign.clicks || 0);
  
  // CTR (até +25 pontos)
  if (ctr >= 2.5) score += 25;
  else if (ctr >= 1.5) score += 20;
  else if (ctr >= 1.0) score += 10;
  else if (ctr < 0.5) score -= 15;
  
  // CPC (até +25 pontos)
  if (cpc <= 1.0) score += 25;
  else if (cpc <= 1.5) score += 20;
  else if (cpc <= 2.5) score += 10;
  else if (cpc > 4) score -= 15;
  
  // Volume - campanhas com mais dados são mais confiáveis
  if (clicks > 100) score += 5;
  if (spend > 200) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function getCampaignStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'warning';
  return 'critical';
}

// =====================================================
// FUNÇÃO PRINCIPAL DE ANÁLISE
// =====================================================

export function generateSmartAnalysis(
  adsMetrics: AdsMetrics,
  realSales?: RealSalesData
): SmartAnalysisResult {
  const insights: SmartInsight[] = [];
  const criticalAlerts: string[] = [];
  const opportunities: string[] = [];
  const topActions: SmartAnalysisResult['topActions'] = [];
  
  const campaigns = adsMetrics.campaigns || [];
  const totalSpend = adsMetrics.totalSpend || 0;
  const totalClicks = adsMetrics.totalClicks || 0;
  const totalImpressions = adsMetrics.totalImpressions || 0;
  
  // =====================================================
  // CALCULAR MÉTRICAS REAIS
  // =====================================================
  
  // ROAS Real (baseado em vendas do gateway, não do pixel)
  let roasReal = 0;
  let cpaReal = 0;
  
  if (realSales && totalSpend > 0) {
    roasReal = realSales.totalRevenue / totalSpend;
    cpaReal = realSales.totalSales > 0 ? totalSpend / realSales.totalSales : 0;
  } else if (adsMetrics.roas > 0) {
    roasReal = adsMetrics.roas;
    cpaReal = adsMetrics.cpa;
  }
  
  const cpm = calculateCPM(totalSpend, totalImpressions);
  const avgCTR = adsMetrics.avgCtr || 0;
  const avgCPC = adsMetrics.avgCpc || 0;
  
  // =====================================================
  // ANÁLISE DE EFICIÊNCIA (CTR, CPC)
  // =====================================================
  
  const ctrAnalysis = analyzeCTR(avgCTR);
  const cpcAnalysis = analyzeCPC(avgCPC);
  
  // Insight de CTR
  insights.push({
    id: 'ctr-analysis',
    type: ctrAnalysis.status === 'poor' ? 'critical' : ctrAnalysis.status === 'average' ? 'warning' : 'success',
    category: 'ctr',
    title: ctrAnalysis.status === 'poor' ? '🚨 CTR Crítico' : ctrAnalysis.status === 'average' ? '⚠️ CTR Abaixo do Ideal' : '✅ CTR Saudável',
    description: ctrAnalysis.insight,
    impact: ctrAnalysis.status === 'poor' ? 'high' : 'medium',
    action: ctrAnalysis.status === 'poor' 
      ? 'URGENTE: Pause campanhas com CTR < 0.5% e crie novos criativos com headlines que gerem curiosidade'
      : 'Teste variações de criativos para melhorar o engajamento',
    metrics: { ctr: `${avgCTR.toFixed(2)}%`, benchmark: `${BENCHMARKS.ctr.good}%` }
  });
  
  // Insight de CPC
  insights.push({
    id: 'cpc-analysis',
    type: cpcAnalysis.status === 'poor' ? 'warning' : cpcAnalysis.status === 'excellent' ? 'success' : 'info',
    category: 'cpc',
    title: cpcAnalysis.status === 'poor' ? '💸 CPC Muito Alto' : cpcAnalysis.status === 'excellent' ? '💰 CPC Excelente' : '📊 CPC na Média',
    description: cpcAnalysis.insight,
    impact: cpcAnalysis.status === 'poor' ? 'high' : 'low',
    action: cpcAnalysis.status === 'poor'
      ? 'Refine a segmentação: exclua públicos que não convertem e foque em lookalikes dos compradores'
      : 'Continue monitorando e teste expandir para novos públicos similares',
    metrics: { cpc: `R$ ${avgCPC.toFixed(2)}`, benchmark: `R$ ${BENCHMARKS.cpc.good}` }
  });
  
  // =====================================================
  // ANÁLISE DE CONVERSÃO (ROAS, CPA)
  // =====================================================
  
  const roasAnalysis = analyzeROAS(roasReal, totalSpend);
  
  if (roasReal > 0) {
    insights.push({
      id: 'roas-analysis',
      type: roasAnalysis.status === 'critical' ? 'critical' : roasAnalysis.status === 'poor' ? 'warning' : 'success',
      category: 'roas',
      title: roasAnalysis.status === 'critical' ? '🚨 ROAS CRÍTICO - PREJUÍZO' : 
             roasAnalysis.status === 'poor' ? '⚠️ ROAS Abaixo do Ponto de Equilíbrio' : 
             `💰 ROAS ${roasReal.toFixed(2)}x`,
      description: roasAnalysis.insight,
      impact: 'high',
      action: roasAnalysis.status === 'critical' || roasAnalysis.status === 'poor'
        ? 'URGENTE: Pause campanhas com ROAS < 2. Revise landing pages e ofertas.'
        : 'Considere aumentar o orçamento das campanhas com melhor ROAS',
      metrics: { 
        roas: `${roasReal.toFixed(2)}x`,
        revenue: realSales ? `R$ ${realSales.totalRevenue.toFixed(2)}` : 'N/A',
        spend: `R$ ${totalSpend.toFixed(2)}`
      }
    });
    
    if (roasAnalysis.status === 'critical') {
      criticalAlerts.push(`🚨 Você está PERDENDO dinheiro! ROAS de ${roasReal.toFixed(2)}x significa prejuízo de aproximadamente R$ ${roasAnalysis.wastedMoney.toFixed(2)}`);
    }
  }
  
  // =====================================================
  // ANÁLISE POR CAMPANHA
  // =====================================================
  
  const campaignHealth: CampaignHealth[] = campaigns.slice(0, 10).map(c => {
    const score = calculateCampaignScore(c);
    const status = getCampaignStatus(score);
    const issues: string[] = [];
    const opps: string[] = [];
    
    const ctr = Number(c.ctr || 0);
    const cpc = Number(c.cpc || 0);
    const spend = Number(c.spend || 0);
    
    if (ctr < 0.5 && spend > 30) issues.push('CTR muito baixo - criativos não engajam');
    if (cpc > 3) issues.push('CPC alto - segmentação cara');
    if (c.effective_status === 'PAUSED') issues.push('Campanha pausada');
    
    if (ctr > 2 && cpc < 1.5) opps.push('Performance excelente - considere escalar');
    if (spend < 50 && ctr > 1) opps.push('Campanha com potencial - aumente o orçamento');
    
    return {
      name: c.campaign_name || 'Sem nome',
      score,
      status,
      issues,
      opportunities: opps
    };
  });
  
  // Campanhas problemáticas
  const wastefulCampaigns = identifyWastefulCampaigns(campaigns);
  if (wastefulCampaigns.length > 0) {
    const wastedAmount = wastefulCampaigns.reduce((sum, c) => sum + Number(c.spend || 0), 0);
    insights.push({
      id: 'wasteful-campaigns',
      type: 'critical',
      category: 'budget',
      title: `🗑️ ${wastefulCampaigns.length} Campanhas Desperdiçando Dinheiro`,
      description: `Identificamos ${wastefulCampaigns.length} campanhas com performance muito ruim que estão consumindo R$ ${wastedAmount.toFixed(2)} sem gerar resultados significativos.`,
      impact: 'high',
      action: 'Pause imediatamente as seguintes campanhas: ' + wastefulCampaigns.map(c => c.campaign_name).join(', '),
      metrics: { wastedSpend: `R$ ${wastedAmount.toFixed(2)}`, campaigns: wastefulCampaigns.length },
      affectedCampaigns: wastefulCampaigns.map(c => c.campaign_name || '')
    });
    
    topActions.push({
      priority: 1,
      action: `Pausar ${wastefulCampaigns.length} campanhas ineficientes`,
      expectedImpact: `Economizar R$ ${wastedAmount.toFixed(2)}/período`,
      effort: 'low'
    });
  }
  
  // Campanhas top performers
  const topPerformers = identifyTopPerformers(campaigns);
  if (topPerformers.length > 0) {
    opportunities.push(`🌟 ${topPerformers.length} campanhas com excelente performance podem ser escaladas`);
    
    insights.push({
      id: 'top-performers',
      type: 'opportunity',
      category: 'budget',
      title: `🚀 ${topPerformers.length} Campanhas com Alto Potencial`,
      description: `Estas campanhas têm CTR acima de 1.5% e CPC abaixo de R$ 2. Considere aumentar o orçamento em 30-50%.`,
      impact: 'high',
      action: 'Aumente o orçamento gradualmente (20% por semana) e monitore a frequência',
      affectedCampaigns: topPerformers.map(c => c.campaign_name || '')
    });
    
    topActions.push({
      priority: 2,
      action: 'Aumentar orçamento das campanhas top performers',
      expectedImpact: 'Potencial de +30% em vendas mantendo ROAS',
      effort: 'low'
    });
  }
  
  // =====================================================
  // ANÁLISE DE DIVERSIFICAÇÃO
  // =====================================================
  
  const activeCampaigns = campaigns.filter(c => c.effective_status === 'ACTIVE').length;
  const pausedCampaigns = campaigns.filter(c => c.effective_status === 'PAUSED').length;
  
  if (activeCampaigns < 3 && totalSpend > 500) {
    insights.push({
      id: 'low-diversification',
      type: 'warning',
      category: 'general',
      title: '⚠️ Baixa Diversificação',
      description: `Você tem apenas ${activeCampaigns} campanhas ativas com investimento de R$ ${totalSpend.toFixed(2)}. Isso concentra risco.`,
      impact: 'medium',
      action: 'Crie pelo menos 3-5 campanhas com abordagens diferentes para testar o que funciona melhor'
    });
  }
  
  if (pausedCampaigns > activeCampaigns * 2) {
    insights.push({
      id: 'many-paused',
      type: 'info',
      category: 'general',
      title: `📋 ${pausedCampaigns} Campanhas Pausadas`,
      description: 'Você tem muitas campanhas pausadas. Revise se alguma pode ser reativada com ajustes.',
      impact: 'low',
      action: 'Analise as campanhas pausadas e reative as que tinham potencial com novos criativos'
    });
  }
  
  // =====================================================
  // CALCULAR SCORES
  // =====================================================
  
  // Efficiency Score (CTR + CPC)
  let efficiencyScore = 50;
  if (avgCTR >= BENCHMARKS.ctr.good) efficiencyScore += 25;
  else if (avgCTR < BENCHMARKS.ctr.poor) efficiencyScore -= 20;
  if (avgCPC <= BENCHMARKS.cpc.good) efficiencyScore += 25;
  else if (avgCPC > BENCHMARKS.cpc.poor) efficiencyScore -= 20;
  
  // Conversion Score (ROAS + CPA)
  let conversionScore = 50;
  if (roasReal >= BENCHMARKS.roas.good) conversionScore += 30;
  else if (roasReal >= BENCHMARKS.roas.breakeven) conversionScore += 10;
  else if (roasReal < BENCHMARKS.roas.poor) conversionScore -= 30;
  
  // Scale Score (volume)
  let scaleScore = 50;
  if (totalClicks > 500) scaleScore += 20;
  if (totalSpend > 1000) scaleScore += 15;
  if (totalImpressions > 50000) scaleScore += 15;
  
  // Health Score (campanhas ativas, diversificação)
  let healthScore = 50;
  if (activeCampaigns >= 5) healthScore += 25;
  else if (activeCampaigns >= 3) healthScore += 15;
  else if (activeCampaigns < 2) healthScore -= 20;
  if (wastefulCampaigns.length === 0) healthScore += 15;
  if (topPerformers.length >= 2) healthScore += 10;
  
  // Normalizar scores
  efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));
  conversionScore = Math.max(0, Math.min(100, conversionScore));
  scaleScore = Math.max(0, Math.min(100, scaleScore));
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  // Overall Score (média ponderada)
  const overallScore = Math.round(
    efficiencyScore * 0.25 +
    conversionScore * 0.35 +
    scaleScore * 0.15 +
    healthScore * 0.25
  );
  
  // =====================================================
  // GERAR RESUMO EXECUTIVO
  // =====================================================
  
  let executiveSummary = '';
  
  if (overallScore >= 80) {
    executiveSummary = `🎯 Excelente! Suas campanhas estão performando muito bem com ROAS de ${roasReal.toFixed(2)}x. `;
    executiveSummary += `Investimento total de R$ ${totalSpend.toFixed(2)} gerou ${totalClicks} cliques. `;
    executiveSummary += `Foco agora deve ser em escalar as melhores campanhas.`;
  } else if (overallScore >= 60) {
    executiveSummary = `📊 Suas campanhas estão com performance razoável. `;
    executiveSummary += `Investimento de R$ ${totalSpend.toFixed(2)} com CTR de ${avgCTR.toFixed(2)}%. `;
    executiveSummary += `Há oportunidades de otimização para melhorar resultados.`;
  } else if (overallScore >= 40) {
    executiveSummary = `⚠️ ATENÇÃO: Performance abaixo do esperado. `;
    executiveSummary += `ROAS de ${roasReal.toFixed(2)}x está próximo ou abaixo do ponto de equilíbrio. `;
    executiveSummary += `Necessário revisar criativos, segmentação e landing pages URGENTEMENTE.`;
  } else {
    executiveSummary = `🚨 CRÍTICO: Suas campanhas estão com problemas sérios. `;
    executiveSummary += `Com ROAS de ${roasReal.toFixed(2)}x, você está perdendo dinheiro. `;
    executiveSummary += `PAUSE campanhas ineficientes imediatamente e revise toda a estratégia antes de continuar investindo.`;
  }
  
  // Adicionar contexto de vendas reais se disponível
  if (realSales && realSales.totalSales > 0) {
    executiveSummary += ` | 💰 Vendas reais: ${realSales.totalSales} pedidos, R$ ${realSales.totalRevenue.toFixed(2)} de receita.`;
  }
  
  // =====================================================
  // BENCHMARKS COMPARATIVOS
  // =====================================================
  
  const benchmarks: SmartAnalysisResult['benchmarks'] = [
    {
      metric: 'CTR',
      yourValue: avgCTR,
      benchmark: BENCHMARKS.ctr.good,
      status: avgCTR >= BENCHMARKS.ctr.good ? 'above' : avgCTR >= BENCHMARKS.ctr.average ? 'on_target' : 'below',
      difference: ((avgCTR - BENCHMARKS.ctr.good) / BENCHMARKS.ctr.good) * 100
    },
    {
      metric: 'CPC',
      yourValue: avgCPC,
      benchmark: BENCHMARKS.cpc.good,
      status: avgCPC <= BENCHMARKS.cpc.good ? 'above' : avgCPC <= BENCHMARKS.cpc.average ? 'on_target' : 'below',
      difference: ((BENCHMARKS.cpc.good - avgCPC) / BENCHMARKS.cpc.good) * 100
    },
    {
      metric: 'ROAS',
      yourValue: roasReal,
      benchmark: BENCHMARKS.roas.good,
      status: roasReal >= BENCHMARKS.roas.good ? 'above' : roasReal >= BENCHMARKS.roas.breakeven ? 'on_target' : 'below',
      difference: ((roasReal - BENCHMARKS.roas.good) / BENCHMARKS.roas.good) * 100
    },
    {
      metric: 'CPM',
      yourValue: cpm,
      benchmark: BENCHMARKS.cpm.good,
      status: cpm <= BENCHMARKS.cpm.good ? 'above' : cpm <= BENCHMARKS.cpm.average ? 'on_target' : 'below',
      difference: ((BENCHMARKS.cpm.good - cpm) / BENCHMARKS.cpm.good) * 100
    }
  ];
  
  // =====================================================
  // AÇÕES PRIORITÁRIAS ADICIONAIS
  // =====================================================
  
  if (avgCTR < BENCHMARKS.ctr.average) {
    topActions.push({
      priority: topActions.length + 1,
      action: 'Criar 3-5 novos criativos com headlines diferentes',
      expectedImpact: 'Potencial de +50% em CTR',
      effort: 'medium'
    });
  }
  
  if (avgCPC > BENCHMARKS.cpc.average) {
    topActions.push({
      priority: topActions.length + 1,
      action: 'Refinar segmentação e excluir públicos de baixa qualidade',
      expectedImpact: 'Reduzir CPC em até 30%',
      effort: 'medium'
    });
  }
  
  if (roasReal < BENCHMARKS.roas.breakeven && realSales) {
    topActions.push({
      priority: topActions.length + 1,
      action: 'Revisar landing page e otimizar para conversão',
      expectedImpact: 'Aumentar taxa de conversão em 20-40%',
      effort: 'high'
    });
  }
  
  // Ordenar ações por prioridade
  topActions.sort((a, b) => a.priority - b.priority);
  
  // =====================================================
  // MÉTRICAS CALCULADAS
  // =====================================================
  
  const wastedSpend = roasAnalysis.wastedMoney || 0;
  const potentialSavings = wastefulCampaigns.reduce((sum, c) => sum + Number(c.spend || 0), 0);
  
  // =====================================================
  // RETORNAR RESULTADO
  // =====================================================
  
  return {
    executiveSummary,
    overallScore,
    scoreBreakdown: {
      efficiency: efficiencyScore,
      conversion: conversionScore,
      scale: scaleScore,
      health: healthScore
    },
    insights: insights.sort((a, b) => {
      const priority = { critical: 0, warning: 1, opportunity: 2, success: 3, info: 4 };
      return priority[a.type] - priority[b.type];
    }),
    campaignHealth,
    benchmarks,
    topActions,
    criticalAlerts,
    opportunities,
    calculatedMetrics: {
      roasReal,
      cpaReal,
      effectiveCTR: avgCTR,
      wastedSpend,
      potentialSavings
    },
    analyzedAt: new Date().toISOString(),
    dataQuality: totalClicks > 100 && totalSpend > 100 ? 'high' : totalClicks > 20 ? 'medium' : 'low',
    warnings: totalClicks < 50 ? ['Dados insuficientes para análise precisa. Aguarde mais tráfego.'] : []
  };
}

// =====================================================
// ANÁLISE DE AD SETS
// =====================================================

function analyzeAdSet(adset: CampaignInsight, avgMetrics: { ctr: number; cpc: number; roas: number }): AdSetAnalysis {
  const spend = Number(adset.spend || 0);
  const impressions = Number(adset.impressions || 0);
  const clicks = Number(adset.clicks || 0);
  const ctr = Number(adset.ctr || 0);
  const cpc = Number(adset.cpc || 0);
  const conversions = sumActions(adset.actions, ACTION_TYPES.purchases);
  const revenue = sumActionValues(adset.action_values, ACTION_TYPES.purchases);
  const roas = spend > 0 ? revenue / spend : 0;
  
  // Calcular score do ad set
  let score = 50;
  
  // CTR comparado com média
  if (ctr >= avgMetrics.ctr * 1.5) score += 20;
  else if (ctr >= avgMetrics.ctr) score += 10;
  else if (ctr < avgMetrics.ctr * 0.5) score -= 15;
  
  // CPC comparado com média
  if (cpc <= avgMetrics.cpc * 0.7) score += 20;
  else if (cpc <= avgMetrics.cpc) score += 10;
  else if (cpc > avgMetrics.cpc * 1.5) score -= 15;
  
  // ROAS
  if (roas >= 3) score += 15;
  else if (roas >= 2) score += 5;
  else if (roas < 1 && spend > 50) score -= 20;
  
  // Conversões
  if (conversions > 0) score += 10;
  
  score = Math.max(0, Math.min(100, score));
  
  // Determinar status
  let status: AdSetAnalysis['status'];
  if (score >= 75) status = 'winner';
  else if (score >= 55) status = 'potential';
  else if (score >= 35) status = 'underperforming';
  else status = 'loser';
  
  // Gerar recomendação
  let recommendation = '';
  const issues: string[] = [];
  
  if (status === 'winner') {
    recommendation = '🚀 ESCALAR: Aumente o orçamento em 20-30% gradualmente';
  } else if (status === 'potential') {
    recommendation = '🔧 OTIMIZAR: Teste novos criativos mantendo este público';
    if (ctr < avgMetrics.ctr) issues.push('CTR abaixo da média - criativos podem melhorar');
    if (cpc > avgMetrics.cpc) issues.push('CPC alto - revise lances ou público');
  } else if (status === 'underperforming') {
    recommendation = '⚠️ TESTAR: Dê mais 3-5 dias ou teste novo criativo';
    if (ctr < avgMetrics.ctr * 0.7) issues.push('CTR muito baixo - público pode não ser ideal');
    if (conversions === 0 && spend > 30) issues.push('Sem conversões com gasto significativo');
  } else {
    recommendation = '🛑 PAUSAR: Este conjunto não está performando';
    issues.push('Performance geral muito abaixo do esperado');
    if (ctr < 0.5) issues.push('CTR crítico - público ou criativo inadequado');
  }
  
  return {
    id: adset.adset_id || '',
    name: adset.adset_name || 'Sem nome',
    campaignName: adset.campaign_name || '',
    spend,
    impressions,
    clicks,
    ctr,
    cpc,
    conversions,
    revenue,
    roas,
    score,
    status,
    recommendation,
    issues
  };
}

// =====================================================
// ANÁLISE DE CRIATIVOS (ADS)
// =====================================================

function analyzeAd(ad: CampaignInsight, avgMetrics: { ctr: number; cpc: number }): AdCreativeAnalysis {
  const spend = Number(ad.spend || 0);
  const impressions = Number(ad.impressions || 0);
  const clicks = Number(ad.clicks || 0);
  const ctr = Number(ad.ctr || 0);
  const cpc = Number(ad.cpc || 0);
  const conversions = sumActions(ad.actions, ACTION_TYPES.purchases);
  
  // Detectar tipo de criativo pelo nome (heurística)
  let creativeType: AdCreativeAnalysis['creativeType'] = 'unknown';
  const adName = (ad.ad_name || '').toLowerCase();
  if (adName.includes('video') || adName.includes('vídeo') || adName.includes('vsl')) {
    creativeType = 'video';
  } else if (adName.includes('carrossel') || adName.includes('carousel')) {
    creativeType = 'carousel';
  } else if (adName.includes('imagem') || adName.includes('image') || adName.includes('static')) {
    creativeType = 'image';
  }
  
  // Calcular score do criativo
  let score = 50;
  
  // CTR é o principal indicador de qualidade do criativo
  if (ctr >= BENCHMARKS.ctr.excellent) score += 30;
  else if (ctr >= BENCHMARKS.ctr.good) score += 20;
  else if (ctr >= BENCHMARKS.ctr.average) score += 10;
  else if (ctr < BENCHMARKS.ctr.poor) score -= 20;
  
  // CPC
  if (cpc <= BENCHMARKS.cpc.excellent) score += 15;
  else if (cpc <= BENCHMARKS.cpc.good) score += 10;
  else if (cpc > BENCHMARKS.cpc.poor) score -= 10;
  
  // Volume - criativos com mais dados são mais confiáveis
  if (impressions > 1000) score += 5;
  if (clicks > 50) score += 5;
  
  score = Math.max(0, Math.min(100, score));
  
  // Determinar status
  let status: AdCreativeAnalysis['status'];
  if (score >= 75) status = 'winner';
  else if (score >= 55) status = 'potential';
  else if (score >= 35) status = 'underperforming';
  else status = 'loser';
  
  // Gerar recomendação específica para criativo
  let recommendation = '';
  
  if (status === 'winner') {
    recommendation = '⭐ DUPLICAR: Crie variações deste criativo (mesmo conceito, diferentes hooks)';
  } else if (status === 'potential') {
    if (ctr < avgMetrics.ctr) {
      recommendation = '🎨 MELHORAR HOOK: O início do criativo precisa ser mais impactante';
    } else {
      recommendation = '📝 TESTAR COPY: Mantenha o visual, teste diferentes textos';
    }
  } else if (status === 'underperforming') {
    recommendation = '🔄 REFORMULAR: Teste uma abordagem completamente diferente';
  } else {
    recommendation = '🗑️ DESCARTAR: Este criativo não engaja o público';
  }
  
  return {
    id: ad.ad_id || '',
    name: ad.ad_name || 'Sem nome',
    adsetName: ad.adset_name || '',
    campaignName: ad.campaign_name || '',
    spend,
    impressions,
    clicks,
    ctr,
    cpc,
    conversions,
    score,
    status,
    creativeType,
    recommendation
  };
}

// =====================================================
// GERAR PLANO DE OTIMIZAÇÃO
// =====================================================

function generateOptimizationPlan(
  campaigns: CampaignInsight[],
  adsets: AdSetAnalysis[],
  ads: AdCreativeAnalysis[],
  roasReal: number
): OptimizationRecommendation[] {
  const plan: OptimizationRecommendation[] = [];
  
  // 1. Campanhas/AdSets para pausar (URGENTE)
  const losers = adsets.filter(a => a.status === 'loser' && a.spend > 30);
  if (losers.length > 0) {
    losers.forEach(adset => {
      plan.push({
        level: 'adset',
        targetName: adset.name,
        type: 'pause',
        priority: 'urgent',
        title: `Pausar "${adset.name}"`,
        description: `Este conjunto gastou R$ ${adset.spend.toFixed(2)} com CTR de ${adset.ctr.toFixed(2)}% e ${adset.conversions} conversões. Está abaixo do aceitável.`,
        expectedResult: `Economia de R$ ${(adset.spend * 0.5).toFixed(2)}/semana`,
        howTo: [
          'Acesse o Gerenciador de Anúncios',
          `Encontre o conjunto "${adset.name}"`,
          'Clique no botão de pause (||)',
          'Confirme a pausa'
        ]
      });
    });
  }
  
  // 2. Criativos para pausar
  const loserAds = ads.filter(a => a.status === 'loser' && a.spend > 20);
  loserAds.slice(0, 3).forEach(ad => {
    plan.push({
      level: 'ad',
      targetName: ad.name,
      type: 'pause',
      priority: 'high',
      title: `Pausar criativo "${ad.name}"`,
      description: `CTR de ${ad.ctr.toFixed(2)}% muito abaixo do benchmark. Não está gerando engajamento.`,
      expectedResult: 'Redirecionar verba para criativos melhores',
      howTo: [
        'Acesse o Gerenciador de Anúncios > Anúncios',
        `Encontre "${ad.name}"`,
        'Pause este anúncio específico'
      ]
    });
  });
  
  // 3. AdSets vencedores para escalar
  const winners = adsets.filter(a => a.status === 'winner' && a.roas >= 2);
  winners.forEach(adset => {
    plan.push({
      level: 'adset',
      targetName: adset.name,
      type: 'scale',
      priority: 'high',
      title: `Escalar "${adset.name}"`,
      description: `ROAS de ${adset.roas.toFixed(2)}x com ${adset.conversions} conversões. Este público está convertendo bem!`,
      expectedResult: `+30% em vendas com aumento gradual de orçamento`,
      howTo: [
        'Aumente o orçamento em 20% (não mais que isso de uma vez)',
        'Aguarde 3-4 dias para estabilizar',
        'Se mantiver performance, aumente mais 20%',
        'Monitore a frequência - se passar de 3, crie lookalike'
      ]
    });
  });
  
  // 4. Criativos vencedores para duplicar
  const winnerAds = ads.filter(a => a.status === 'winner');
  winnerAds.slice(0, 3).forEach(ad => {
    plan.push({
      level: 'ad',
      targetName: ad.name,
      type: 'duplicate',
      priority: 'medium',
      title: `Criar variações de "${ad.name}"`,
      description: `CTR de ${ad.ctr.toFixed(2)}% indica que este conceito funciona. Crie variações para testar.`,
      expectedResult: 'Encontrar versões ainda melhores do criativo vencedor',
      howTo: [
        'Duplique o anúncio',
        'Mude apenas o HOOK (primeiros 3 segundos ou primeira linha)',
        'Mantenha o restante igual',
        'Teste 3-5 variações de hook'
      ]
    });
  });
  
  // 5. Sugestões de teste para potenciais
  const potentials = adsets.filter(a => a.status === 'potential');
  if (potentials.length > 0) {
    plan.push({
      level: 'adset',
      targetName: potentials.map(p => p.name).join(', '),
      type: 'test',
      priority: 'medium',
      title: `Otimizar ${potentials.length} conjuntos com potencial`,
      description: 'Estes conjuntos têm métricas razoáveis mas podem melhorar. Teste novos criativos neles.',
      expectedResult: 'Transformar conjuntos medianos em vencedores',
      howTo: [
        'Identifique o criativo com melhor CTR da conta',
        'Adicione esse criativo aos conjuntos com potencial',
        'Dê 500-1000 impressões antes de avaliar',
        'Pause criativos ruins e mantenha os bons'
      ]
    });
  }
  
  // 6. Recomendação geral de ROAS baixo
  if (roasReal < 2 && roasReal > 0) {
    plan.push({
      level: 'campaign',
      targetName: 'Todas as campanhas',
      type: 'optimize',
      priority: 'urgent',
      title: 'Otimizar Landing Page',
      description: `ROAS de ${roasReal.toFixed(2)}x indica problema de conversão no site, não só nos ads.`,
      expectedResult: 'Aumentar ROAS para 3x+ melhorando a página de vendas',
      howTo: [
        'Analise o tempo de carregamento (deve ser < 3s)',
        'Verifique se a headline é clara e direta',
        'Adicione mais provas sociais e depoimentos',
        'Simplifique o checkout (menos campos)',
        'Teste urgência/escassez na oferta'
      ]
    });
  }
  
  // Ordenar por prioridade
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  plan.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return plan;
}

// =====================================================
// FUNÇÃO PRINCIPAL - ANÁLISE COMPLETA
// =====================================================

export function generateFullAnalysis(
  adsMetrics: AdsMetrics,
  adSetsData: CampaignInsight[],
  adsData: CampaignInsight[],
  realSales?: RealSalesData
): FullAnalysisResult {
  // Primeiro, gera análise básica
  const basicAnalysis = generateSmartAnalysis(adsMetrics, realSales);
  
  // Calcular médias para comparação
  const avgMetrics = {
    ctr: adsMetrics.avgCtr || 1,
    cpc: adsMetrics.avgCpc || 2,
    roas: basicAnalysis.calculatedMetrics.roasReal || 0
  };
  
  // Analisar Ad Sets
  const adSetAnalysis = adSetsData
    .filter(as => Number(as.spend || 0) > 0)
    .map(as => analyzeAdSet(as, avgMetrics))
    .sort((a, b) => b.score - a.score);
  
  const winningAdSets = adSetAnalysis.filter(a => a.status === 'winner');
  const losingAdSets = adSetAnalysis.filter(a => a.status === 'loser');
  
  // Analisar Criativos
  const adCreativeAnalysis = adsData
    .filter(ad => Number(ad.spend || 0) > 0)
    .map(ad => analyzeAd(ad, avgMetrics))
    .sort((a, b) => b.score - a.score);
  
  const winningAds = adCreativeAnalysis.filter(a => a.status === 'winner');
  const losingAds = adCreativeAnalysis.filter(a => a.status === 'loser');
  
  // Gerar plano de otimização
  const optimizationPlan = generateOptimizationPlan(
    adsMetrics.campaigns,
    adSetAnalysis,
    adCreativeAnalysis,
    basicAnalysis.calculatedMetrics.roasReal
  );
  
  // Calcular resumo de otimização
  const optimizationSummary = {
    adsToScale: winningAdSets.length + winningAds.length,
    adsToPause: losingAdSets.length + losingAds.length,
    adsToTest: adSetAnalysis.filter(a => a.status === 'potential').length,
    potentialSavings: losingAdSets.reduce((sum, a) => sum + a.spend, 0) + losingAds.reduce((sum, a) => sum + a.spend, 0),
    potentialGrowth: winningAdSets.reduce((sum, a) => sum + a.spend * 0.3, 0) // 30% growth potential
  };
  
  // Adicionar insights sobre ad sets e criativos
  const additionalInsights: SmartInsight[] = [];
  
  if (winningAdSets.length > 0) {
    additionalInsights.push({
      id: 'winning-adsets',
      type: 'success',
      category: 'audience',
      title: `🎯 ${winningAdSets.length} Públicos Vencedores Identificados`,
      description: `Os conjuntos ${winningAdSets.slice(0, 2).map(a => `"${a.name}"`).join(' e ')} estão com excelente performance. Estes públicos respondem bem à sua oferta.`,
      impact: 'high',
      action: 'Aumente o orçamento destes conjuntos em 20% e crie lookalikes baseados neles.',
      affectedCampaigns: winningAdSets.map(a => a.name)
    });
  }
  
  if (losingAdSets.length > 0) {
    additionalInsights.push({
      id: 'losing-adsets',
      type: 'critical',
      category: 'audience',
      title: `🛑 ${losingAdSets.length} Públicos para Pausar`,
      description: `Os conjuntos ${losingAdSets.slice(0, 2).map(a => `"${a.name}"`).join(' e ')} estão desperdiçando R$ ${losingAdSets.reduce((s, a) => s + a.spend, 0).toFixed(2)} sem resultados.`,
      impact: 'high',
      action: 'Pause AGORA estes conjuntos para parar de perder dinheiro.',
      affectedCampaigns: losingAdSets.map(a => a.name),
      metrics: { wastedSpend: `R$ ${losingAdSets.reduce((s, a) => s + a.spend, 0).toFixed(2)}` }
    });
  }
  
  if (winningAds.length > 0) {
    additionalInsights.push({
      id: 'winning-creatives',
      type: 'opportunity',
      category: 'creative',
      title: `⭐ ${winningAds.length} Criativos Vencedores`,
      description: `Os anúncios ${winningAds.slice(0, 2).map(a => `"${a.name}"`).join(' e ')} têm CTR acima da média. O conceito criativo está funcionando!`,
      impact: 'high',
      action: 'Crie 3-5 variações de cada criativo vencedor mudando apenas o hook inicial.',
      affectedCampaigns: winningAds.map(a => a.name)
    });
  }
  
  if (losingAds.length > 0) {
    additionalInsights.push({
      id: 'losing-creatives',
      type: 'warning',
      category: 'creative',
      title: `🎨 ${losingAds.length} Criativos Fracos`,
      description: `Estes criativos têm CTR muito baixo: ${losingAds.slice(0, 2).map(a => `"${a.name}" (${a.ctr.toFixed(2)}%)`).join(', ')}`,
      impact: 'medium',
      action: 'Pause estes criativos e teste novas abordagens visuais e de copy.',
      affectedCampaigns: losingAds.map(a => a.name)
    });
  }
  
  // Análise de tipo de criativo
  const videoAds = adCreativeAnalysis.filter(a => a.creativeType === 'video');
  const imageAds = adCreativeAnalysis.filter(a => a.creativeType === 'image');
  
  if (videoAds.length > 0 && imageAds.length > 0) {
    const avgVideoCTR = videoAds.reduce((s, a) => s + a.ctr, 0) / videoAds.length;
    const avgImageCTR = imageAds.reduce((s, a) => s + a.ctr, 0) / imageAds.length;
    
    if (avgVideoCTR > avgImageCTR * 1.3) {
      additionalInsights.push({
        id: 'video-vs-image',
        type: 'info',
        category: 'creative',
        title: '🎬 Vídeos Performam Melhor',
        description: `CTR médio de vídeos (${avgVideoCTR.toFixed(2)}%) é ${((avgVideoCTR / avgImageCTR - 1) * 100).toFixed(0)}% maior que imagens (${avgImageCTR.toFixed(2)}%).`,
        impact: 'medium',
        action: 'Priorize criação de mais conteúdo em vídeo para suas campanhas.'
      });
    } else if (avgImageCTR > avgVideoCTR * 1.3) {
      additionalInsights.push({
        id: 'image-vs-video',
        type: 'info',
        category: 'creative',
        title: '🖼️ Imagens Performam Melhor',
        description: `CTR médio de imagens (${avgImageCTR.toFixed(2)}%) é superior aos vídeos (${avgVideoCTR.toFixed(2)}%).`,
        impact: 'medium',
        action: 'Seu público responde melhor a imagens estáticas. Invista mais nesse formato.'
      });
    }
  }
  
  // Merge insights
  const allInsights = [...additionalInsights, ...basicAnalysis.insights];
  
  return {
    ...basicAnalysis,
    insights: allInsights.sort((a, b) => {
      const priority = { critical: 0, warning: 1, opportunity: 2, success: 3, info: 4 };
      return priority[a.type] - priority[b.type];
    }),
    adSetAnalysis,
    winningAdSets,
    losingAdSets,
    adCreativeAnalysis,
    winningAds,
    losingAds,
    optimizationPlan,
    optimizationSummary
  };
}
