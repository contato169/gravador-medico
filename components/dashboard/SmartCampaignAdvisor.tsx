'use client';

/**
 * 🧠 Smart Campaign Advisor Component v2.0
 * 
 * Componente completo para análise inteligente de campanhas
 * INCLUI: Análise de Ad Sets, Criativos e Plano de Otimização
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  DollarSign,
  MousePointerClick,
  Eye,
  ShoppingCart,
  BarChart3,
  Flame,
  Award,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Layers,
  Image,
  Video,
  Layout,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  TrendingUp as Scale,
  Wrench,
  ListChecks
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TIPOS
// =====================================================

interface SmartInsight {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'opportunity' | 'info';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  metrics?: Record<string, number | string>;
  affectedCampaigns?: string[];
}

interface CampaignHealth {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: string[];
  opportunities: string[];
}

interface Benchmark {
  metric: string;
  yourValue: number;
  benchmark: number;
  status: 'above' | 'below' | 'on_target';
  difference: number;
}

interface TopAction {
  priority: number;
  action: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

// Tipos para Ad Sets (compatível com API)
interface AdSetAnalysis {
  id: string;
  name: string;
  campaignName: string;
  score: number;
  status: 'winner' | 'potential' | 'underperforming' | 'loser';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
  recommendation: string;
  issues?: string[];
}

// Tipos para Criativos (compatível com API)
interface AdCreativeAnalysis {
  id: string;
  name: string;
  adsetName: string;
  campaignName: string;
  score: number;
  status: 'winner' | 'potential' | 'underperforming' | 'loser';
  creativeType: 'video' | 'image' | 'carousel' | 'unknown';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  recommendation: string;
}

// Tipos para Plano de Otimização (compatível com API)
interface OptimizationRecommendation {
  level: string;
  targetName: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  expectedResult: string;
  howTo: string[];
}

interface SmartAnalysisData {
  executiveSummary: string;
  overallScore: number;
  scoreBreakdown: {
    efficiency: number;
    conversion: number;
    scale: number;
    health: number;
  };
  insights: SmartInsight[];
  campaignHealth: CampaignHealth[];
  benchmarks: Benchmark[];
  topActions: TopAction[];
  criticalAlerts: string[];
  opportunities: string[];
  calculatedMetrics: {
    roasReal: number;
    cpaReal: number;
    effectiveCTR: number;
    wastedSpend: number;
    potentialSavings: number;
  };
  // Novos campos v2
  adSetAnalysis?: AdSetAnalysis[];
  winningAdSets?: AdSetAnalysis[];
  losingAdSets?: AdSetAnalysis[];
  adCreativeAnalysis?: AdCreativeAnalysis[];
  winningAds?: AdCreativeAnalysis[];
  losingAds?: AdCreativeAnalysis[];
  optimizationPlan?: OptimizationRecommendation[];
  optimizationSummary?: {
    adsToScale: number;
    adsToPause: number;
    adsToTest: number;
    potentialSavings: number;
    potentialGrowth: number;
  };
  analyzedAt: string;
  dataQuality: 'high' | 'medium' | 'low';
  warnings: string[];
  cached?: boolean;
  totalCampaigns?: number;
  totalAdSets?: number;
  totalAds?: number;
  realSales?: {
    revenue: number;
    sales: number;
    avgTicket: number;
  };
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function ScoreGauge({ score, size = 'large' }: { score: number; size?: 'large' | 'small' }) {
  const getColor = () => {
    if (score >= 80) return { text: 'text-green-400', stroke: 'stroke-green-400', bg: 'bg-green-400' };
    if (score >= 60) return { text: 'text-yellow-400', stroke: 'stroke-yellow-400', bg: 'bg-yellow-400' };
    if (score >= 40) return { text: 'text-orange-400', stroke: 'stroke-orange-400', bg: 'bg-orange-400' };
    return { text: 'text-red-400', stroke: 'stroke-red-400', bg: 'bg-red-400' };
  };

  const getLabel = () => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  const colors = getColor();
  const dimensions = size === 'large' ? 'w-28 h-28' : 'w-16 h-16';
  const strokeWidth = size === 'large' ? 8 : 6;
  const radius = size === 'large' ? 48 : 28;
  const center = size === 'large' ? 56 : 32;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', dimensions)}>
        <svg className={cn(dimensions, 'transform -rotate-90')}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="fill-none stroke-white/10"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            className={cn('fill-none', colors.stroke)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: '0 301.6' }}
            animate={{ strokeDasharray: `${score * 3.016} 301.6` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', colors.text, size === 'large' ? 'text-3xl' : 'text-lg')}>
            {score}
          </span>
        </div>
      </div>
      {size === 'large' && (
        <div className="text-center">
          <p className={cn('font-semibold', colors.text)}>{getLabel()}</p>
          <p className="text-xs text-gray-400">Health Score</p>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const getColor = () => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-500';
    if (value >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-gray-400">
          {icon}
          {label}
        </span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: SmartInsight; index: number }) {
  const [expanded, setExpanded] = useState(insight.type === 'critical');

  const getConfig = () => {
    switch (insight.type) {
      case 'critical':
        return { 
          icon: <XCircle className="h-5 w-5" />, 
          colors: 'bg-red-500/10 border-red-500/30 text-red-400',
          iconBg: 'bg-red-500/20'
        };
      case 'warning':
        return { 
          icon: <AlertTriangle className="h-5 w-5" />, 
          colors: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
          iconBg: 'bg-yellow-500/20'
        };
      case 'success':
        return { 
          icon: <CheckCircle className="h-5 w-5" />, 
          colors: 'bg-green-500/10 border-green-500/30 text-green-400',
          iconBg: 'bg-green-500/20'
        };
      case 'opportunity':
        return { 
          icon: <Lightbulb className="h-5 w-5" />, 
          colors: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          iconBg: 'bg-purple-500/20'
        };
      default:
        return { 
          icon: <Info className="h-5 w-5" />, 
          colors: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          iconBg: 'bg-blue-500/20'
        };
    }
  };

  const config = getConfig();
  const impactColors = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn('rounded-xl border p-4 cursor-pointer transition-all hover:border-white/20', config.colors)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.iconBg)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-white truncate">{insight.title}</h4>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', impactColors[insight.impact])}>
                {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
              </span>
              {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </div>
          
          {insight.metrics && (
            <div className="flex gap-3 mt-1 text-sm text-gray-400">
              {Object.entries(insight.metrics).slice(0, 2).map(([key, value]) => (
                <span key={key}>{key}: <span className="text-white">{value}</span></span>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <p className="text-sm text-gray-300">{insight.description}</p>
              
              {insight.action && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
                  <Zap className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-brand-300">{insight.action}</p>
                </div>
              )}
              
              {insight.affectedCampaigns && insight.affectedCampaigns.length > 0 && (
                <div className="text-xs text-gray-500">
                  Campanhas afetadas: {insight.affectedCampaigns.slice(0, 3).join(', ')}
                  {insight.affectedCampaigns.length > 3 && ` +${insight.affectedCampaigns.length - 3}`}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BenchmarkCard({ benchmark }: { benchmark: Benchmark }) {
  const getStatusConfig = () => {
    switch (benchmark.status) {
      case 'above':
        return { icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-400', label: 'Acima' };
      case 'below':
        return { icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-400', label: 'Abaixo' };
      default:
        return { icon: <Target className="h-4 w-4" />, color: 'text-yellow-400', label: 'Na média' };
    }
  };

  const config = getStatusConfig();
  const formatValue = (metric: string, value: number) => {
    if (metric === 'CTR') return `${value.toFixed(2)}%`;
    if (metric === 'ROAS') return `${value.toFixed(2)}x`;
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{benchmark.metric}</span>
        <span className={cn('flex items-center gap-1 text-xs', config.color)}>
          {config.icon}
          {config.label}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-bold text-white">{formatValue(benchmark.metric, benchmark.yourValue)}</span>
        <span className="text-xs text-gray-500">Benchmark: {formatValue(benchmark.metric, benchmark.benchmark)}</span>
      </div>
    </div>
  );
}

function ActionCard({ action, index }: { action: TopAction; index: number }) {
  const effortConfig = {
    low: { color: 'bg-green-500/20 text-green-400', label: 'Fácil' },
    medium: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Médio' },
    high: { color: 'bg-red-500/20 text-red-400', label: 'Difícil' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
    >
      <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-brand-400">{action.priority}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{action.action}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{action.expectedImpact}</span>
          <span className={cn('px-1.5 py-0.5 rounded text-xs', effortConfig[action.effort].color)}>
            {effortConfig[action.effort].label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CampaignHealthCard({ campaign }: { campaign: CampaignHealth }) {
  const statusConfig = {
    excellent: { color: 'border-green-500/30 bg-green-500/10', badge: 'bg-green-500/20 text-green-400' },
    good: { color: 'border-blue-500/30 bg-blue-500/10', badge: 'bg-blue-500/20 text-blue-400' },
    warning: { color: 'border-yellow-500/30 bg-yellow-500/10', badge: 'bg-yellow-500/20 text-yellow-400' },
    critical: { color: 'border-red-500/30 bg-red-500/10', badge: 'bg-red-500/20 text-red-400' }
  };

  return (
    <div className={cn('p-3 rounded-lg border', statusConfig[campaign.status].color)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white truncate">{campaign.name}</span>
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusConfig[campaign.status].badge)}>
            {campaign.score}
          </span>
        </div>
      </div>
      {campaign.issues.length > 0 && (
        <p className="text-xs text-red-400">• {campaign.issues[0]}</p>
      )}
      {campaign.opportunities.length > 0 && (
        <p className="text-xs text-green-400">• {campaign.opportunities[0]}</p>
      )}
    </div>
  );
}

// =====================================================
// NOVOS COMPONENTES v2.0 - Ad Sets, Criativos, Otimização
// =====================================================

function AdSetCard({ adSet }: { adSet: AdSetAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  
  const statusConfig = {
    winner: { color: 'border-green-500/30 bg-green-500/10', badge: 'bg-green-500/20 text-green-400', icon: <ThumbsUp className="h-3 w-3" />, label: '🏆 Winner' },
    potential: { color: 'border-blue-500/30 bg-blue-500/10', badge: 'bg-blue-500/20 text-blue-400', icon: <TrendingUp className="h-3 w-3" />, label: '📈 Potencial' },
    underperforming: { color: 'border-yellow-500/30 bg-yellow-500/10', badge: 'bg-yellow-500/20 text-yellow-400', icon: <AlertTriangle className="h-3 w-3" />, label: '⚠️ Atenção' },
    loser: { color: 'border-red-500/30 bg-red-500/10', badge: 'bg-red-500/20 text-red-400', icon: <ThumbsDown className="h-3 w-3" />, label: '🛑 Pausar' }
  };

  const config = statusConfig[adSet.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-lg border p-3 cursor-pointer transition-all hover:border-white/30', config.color)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-white truncate">{adSet.name}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{adSet.campaignName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1', config.badge)}>
            {config.icon}
            {adSet.score}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="flex gap-3 mt-2 text-xs">
        <span className="text-gray-400">CTR: <span className="text-white">{adSet.ctr?.toFixed(2) || '0.00'}%</span></span>
        <span className="text-gray-400">CPC: <span className="text-white">R${adSet.cpc?.toFixed(2) || '0.00'}</span></span>
        <span className="text-gray-400">ROAS: <span className={(adSet.roas || 0) >= 2 ? 'text-green-400' : 'text-red-400'}>{adSet.roas?.toFixed(2) || '0.00'}x</span></span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-white/5">
                  <span className="text-gray-500">Gasto</span>
                  <p className="text-white font-medium">R$ {adSet.spend?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <span className="text-gray-500">Conversões</span>
                  <p className="text-white font-medium">{adSet.conversions || 0}</p>
                </div>
              </div>
              
              {adSet.issues && adSet.issues.length > 0 && (
                <div className="space-y-1">
                  {adSet.issues.map((issue: string, i: number) => (
                    <p key={i} className="text-xs text-yellow-400">⚠️ {issue}</p>
                  ))}
                </div>
              )}
              
              <div className="p-2 rounded bg-brand-500/10 border border-brand-500/20">
                <p className="text-xs text-brand-300">{adSet.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreativeCard({ ad }: { ad: AdCreativeAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    winner: { color: 'border-green-500/30 bg-green-500/10', badge: 'bg-green-500/20 text-green-400', label: '🏆 Winner' },
    potential: { color: 'border-blue-500/30 bg-blue-500/10', badge: 'bg-blue-500/20 text-blue-400', label: '📈 Potencial' },
    underperforming: { color: 'border-yellow-500/30 bg-yellow-500/10', badge: 'bg-yellow-500/20 text-yellow-400', label: '⚠️ Atenção' },
    loser: { color: 'border-red-500/30 bg-red-500/10', badge: 'bg-red-500/20 text-red-400', label: '🛑 Pausar' }
  };

  const typeIcon = {
    video: <Video className="h-4 w-4 text-purple-400" />,
    image: <Image className="h-4 w-4 text-blue-400" />,
    carousel: <Layout className="h-4 w-4 text-orange-400" />,
    unknown: <Eye className="h-4 w-4 text-gray-400" />
  };

  const config = statusConfig[ad.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-lg border p-3 cursor-pointer transition-all hover:border-white/30', config.color)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {typeIcon[ad.creativeType]}
            <span className="text-sm font-medium text-white truncate">{ad.name}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{ad.adsetName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', config.badge)}>
            {ad.score}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      <div className="flex gap-3 mt-2 text-xs">
        <span className="text-gray-400">CTR: <span className="text-white">{ad.ctr?.toFixed(2) || '0.00'}%</span></span>
        <span className="text-gray-400">CPC: <span className="text-white">R${ad.cpc?.toFixed(2) || '0.00'}</span></span>
        <span className="text-gray-400">Conv: <span className="text-green-400">{ad.conversions || 0}</span></span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-white/5">
                  <span className="text-gray-500">Gasto</span>
                  <p className="text-white font-medium">R$ {ad.spend?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <span className="text-gray-500">Impressões</span>
                  <p className="text-white font-medium">{ad.impressions || 0}</p>
                </div>
              </div>
              
              <div className="p-2 rounded bg-brand-500/10 border border-brand-500/20">
                <p className="text-xs text-brand-300">{ad.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OptimizationCard({ recommendation, index }: { recommendation: OptimizationRecommendation; index: number }) {
  const [expanded, setExpanded] = useState(recommendation.priority === 'urgent' || recommendation.priority === 'critical');

  const priorityConfig: Record<string, { color: string; badge: string; label: string }> = {
    urgent: { color: 'border-red-500/30 bg-red-500/10', badge: 'bg-red-500/20 text-red-400', label: '🚨 Urgente' },
    critical: { color: 'border-red-500/30 bg-red-500/10', badge: 'bg-red-500/20 text-red-400', label: '🚨 Crítico' },
    high: { color: 'border-orange-500/30 bg-orange-500/10', badge: 'bg-orange-500/20 text-orange-400', label: '⚡ Alta' },
    medium: { color: 'border-yellow-500/30 bg-yellow-500/10', badge: 'bg-yellow-500/20 text-yellow-400', label: '📊 Média' },
    low: { color: 'border-gray-500/30 bg-gray-500/10', badge: 'bg-gray-500/20 text-gray-400', label: '💡 Baixa' }
  };

  const typeIcon: Record<string, React.ReactNode> = {
    scale: <TrendingUp className="h-4 w-4 text-green-400" />,
    pause: <Pause className="h-4 w-4 text-red-400" />,
    test: <Zap className="h-4 w-4 text-purple-400" />,
    optimize: <Wrench className="h-4 w-4 text-yellow-400" />,
    create: <Play className="h-4 w-4 text-blue-400" />,
    duplicate: <Layers className="h-4 w-4 text-blue-400" />
  };

  const config = priorityConfig[recommendation.priority] || priorityConfig.medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn('rounded-lg border p-4 cursor-pointer transition-all hover:border-white/30', config.color)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          {typeIcon[recommendation.type] || <Target className="h-4 w-4 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-white">{recommendation.title}</h4>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', config.badge)}>
                {config.label}
              </span>
              {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{recommendation.targetName} ({recommendation.level})</p>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Por que:</p>
                <p className="text-sm text-gray-300">{recommendation.description}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Impacto esperado:</p>
                <p className="text-sm text-green-400">{recommendation.expectedResult}</p>
              </div>
              
              {recommendation.howTo && recommendation.howTo.length > 0 && (
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <ListChecks className="h-3 w-3" />
                    Como fazer:
                  </p>
                  <ol className="space-y-1">
                    {recommendation.howTo.map((step, i) => (
                      <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-brand-400 font-medium">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

interface SmartAdvisorProps {
  period?: string;
  className?: string;
}

export function SmartCampaignAdvisor({ period = 'last_7d', className }: SmartAdvisorProps) {
  const [analysis, setAnalysis] = useState<SmartAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'adsets' | 'creatives' | 'optimization' | 'benchmarks'>('insights');

  const fetchAnalysis = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `/api/ai/smart-analysis?period=${period}${forceRefresh ? '&refresh=true' : ''}`
      );
      
      if (!res.ok) throw new Error('Falha ao carregar análise');
      
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
      setError('Não foi possível carregar a análise.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <div className={cn('rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 p-6', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-indigo-500/20">
            <Brain className="h-6 w-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Analisando dados...</h3>
            <p className="text-sm text-gray-400">Cruzando campanhas com vendas reais</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className={cn('rounded-2xl bg-red-500/10 border border-red-500/20 p-6', className)}>
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-400" />
          <div>
            <h3 className="font-semibold text-white">Erro na análise</h3>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        </div>
        <button
          onClick={() => fetchAnalysis(true)}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <Brain className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Análise Inteligente</h3>
              <p className="text-sm text-gray-400">
                {analysis.totalCampaigns} campanhas • {analysis.dataQuality === 'high' ? 'Alta qualidade' : analysis.dataQuality === 'medium' ? 'Qualidade média' : 'Dados limitados'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {analysis.cached && (
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">
                em cache
              </span>
            )}
            <button
              onClick={() => fetchAnalysis(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4 text-gray-400', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Score + Metrics */}
        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* Health Score */}
          <div className="flex items-center gap-6">
            <ScoreGauge score={analysis.overallScore} />
            
            <div className="space-y-2 min-w-[200px]">
              <ScoreBar 
                label="Eficiência" 
                value={analysis.scoreBreakdown.efficiency} 
                icon={<MousePointerClick className="h-3 w-3" />} 
              />
              <ScoreBar 
                label="Conversão" 
                value={analysis.scoreBreakdown.conversion} 
                icon={<ShoppingCart className="h-3 w-3" />} 
              />
              <ScoreBar 
                label="Escala" 
                value={analysis.scoreBreakdown.scale} 
                icon={<BarChart3 className="h-3 w-3" />} 
              />
              <ScoreBar 
                label="Saúde" 
                value={analysis.scoreBreakdown.health} 
                icon={<Flame className="h-3 w-3" />} 
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <DollarSign className="h-3 w-3" />
                ROAS Real
              </div>
              <p className={cn(
                'text-xl font-bold',
                analysis.calculatedMetrics.roasReal >= 3 ? 'text-green-400' : 
                analysis.calculatedMetrics.roasReal >= 2 ? 'text-yellow-400' : 'text-red-400'
              )}>
                {analysis.calculatedMetrics.roasReal.toFixed(2)}x
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Target className="h-3 w-3" />
                CPA Real
              </div>
              <p className="text-xl font-bold text-white">
                R$ {analysis.calculatedMetrics.cpaReal.toFixed(2)}
              </p>
            </div>
            
            {analysis.realSales && (
              <>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <ShoppingCart className="h-3 w-3" />
                    Vendas Reais
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {analysis.realSales.sales}
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <DollarSign className="h-3 w-3" />
                    Receita Real
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    R$ {analysis.realSales.revenue.toFixed(0)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="px-6 py-4 bg-white/5">
        <p className="text-gray-300">{analysis.executiveSummary}</p>
      </div>

      {/* Critical Alerts */}
      {analysis.criticalAlerts.length > 0 && (
        <div className="px-6 py-3 bg-red-500/10 border-y border-red-500/20">
          {analysis.criticalAlerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* Optimization Summary - se disponível */}
      {analysis.optimizationSummary && (
        <div className="px-6 py-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-y border-white/10">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-gray-400">Escalar:</span>
              <span className="text-green-400 font-medium">{analysis.optimizationSummary.adsToScale} anúncios</span>
            </div>
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-red-400" />
              <span className="text-gray-400">Pausar:</span>
              <span className="text-red-400 font-medium">{analysis.optimizationSummary.adsToPause} anúncios</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-gray-400">Testar:</span>
              <span className="text-purple-400 font-medium">{analysis.optimizationSummary.adsToTest} variações</span>
            </div>
            {analysis.optimizationSummary.potentialSavings > 0 && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                <span className="text-gray-400">Economia potencial:</span>
                <span className="text-yellow-400 font-medium">R$ {analysis.optimizationSummary.potentialSavings.toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10 overflow-x-auto">
        <div className="flex px-6 min-w-max">
          {[
            { id: 'insights', label: '💡 Insights', count: analysis.insights.length },
            { id: 'adsets', label: '📦 Ad Sets', count: analysis.adSetAnalysis?.length || 0 },
            { id: 'creatives', label: '🎨 Criativos', count: analysis.adCreativeAnalysis?.length || 0 },
            { id: 'optimization', label: '🎯 Otimização', count: analysis.optimizationPlan?.length || 0 },
            { id: 'benchmarks', label: '📊 Benchmarks', count: analysis.benchmarks.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'insights' && (
          <div className="grid gap-3">
            {analysis.insights.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum insight disponível ainda</p>
            ) : (
              analysis.insights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))
            )}
          </div>
        )}

        {activeTab === 'adsets' && (
          <div className="space-y-4">
            {/* Winners */}
            {analysis.winningAdSets && analysis.winningAdSets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Ad Sets Vencedores ({analysis.winningAdSets.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.winningAdSets.map((adSet) => (
                    <AdSetCard key={adSet.id} adSet={adSet} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Losers */}
            {analysis.losingAdSets && analysis.losingAdSets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4" />
                  Ad Sets para Pausar ({analysis.losingAdSets.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.losingAdSets.map((adSet) => (
                    <AdSetCard key={adSet.id} adSet={adSet} />
                  ))}
                </div>
              </div>
            )}

            {/* All */}
            {analysis.adSetAnalysis && analysis.adSetAnalysis.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Todos os Ad Sets ({analysis.adSetAnalysis.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.adSetAnalysis.map((adSet) => (
                    <AdSetCard key={adSet.id} adSet={adSet} />
                  ))}
                </div>
              </div>
            )}

            {(!analysis.adSetAnalysis || analysis.adSetAnalysis.length === 0) && (
              <p className="text-gray-400 text-center py-8">
                Nenhum ad set encontrado. Certifique-se que suas campanhas têm conjuntos de anúncios ativos.
              </p>
            )}
          </div>
        )}

        {activeTab === 'creatives' && (
          <div className="space-y-4">
            {/* Winners */}
            {analysis.winningAds && analysis.winningAds.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Criativos Vencedores ({analysis.winningAds.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.winningAds.map((ad) => (
                    <CreativeCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Losers */}
            {analysis.losingAds && analysis.losingAds.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Criativos para Pausar ({analysis.losingAds.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.losingAds.map((ad) => (
                    <CreativeCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            )}

            {/* All */}
            {analysis.adCreativeAnalysis && analysis.adCreativeAnalysis.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Todos os Criativos ({analysis.adCreativeAnalysis.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {analysis.adCreativeAnalysis.map((ad) => (
                    <CreativeCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            )}

            {(!analysis.adCreativeAnalysis || analysis.adCreativeAnalysis.length === 0) && (
              <p className="text-gray-400 text-center py-8">
                Nenhum criativo encontrado. Certifique-se que suas campanhas têm anúncios ativos.
              </p>
            )}
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-3">
            {analysis.optimizationPlan && analysis.optimizationPlan.length > 0 ? (
              analysis.optimizationPlan.map((rec, i) => (
                <OptimizationCard key={`opt-${i}-${rec.targetName}`} recommendation={rec} index={i} />
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                Nenhuma recomendação de otimização disponível. Continue coletando dados.
              </p>
            )}
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {analysis.benchmarks.map((benchmark, i) => (
              <BenchmarkCard key={i} benchmark={benchmark} />
            ))}
          </div>
        )}
      </div>

      {/* Top Actions */}
      {analysis.topActions.length > 0 && (
        <div className="px-6 pb-6">
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-brand-400" />
            Ações Prioritárias
          </h4>
          <div className="space-y-2">
            {analysis.topActions.slice(0, 5).map((action, i) => (
              <ActionCard key={i} action={action} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/10 text-xs text-gray-500 flex items-center justify-between">
        <span>
          {analysis.totalCampaigns} campanhas • {analysis.totalAdSets || 0} ad sets • {analysis.totalAds || 0} anúncios
          {' • '}Atualizado em {new Date(analysis.analyzedAt).toLocaleString('pt-BR')}
        </span>
        {analysis.warnings.length > 0 && (
          <span className="text-yellow-500">{analysis.warnings[0]}</span>
        )}
      </div>
    </div>
  );
}

export default SmartCampaignAdvisor;
