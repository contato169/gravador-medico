'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, ShoppingCart, Target, Eye, MousePointerClick,
  ExternalLink, MessageCircle, Smartphone, AlertCircle, RefreshCw,
  Facebook, BarChart3, Zap, PlayCircle, Globe
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AdsMetrics, calculateAdsMetrics } from '@/lib/meta-marketing';

// Tipo para cliques de saída do GA4
interface OutboundClick {
  url: string;
  clicks: number;
  category: 'whatsapp' | 'appstore' | 'playstore' | 'external' | 'internal';
  label: string;
}

interface OutboundData {
  clicks: OutboundClick[];
  summary: {
    whatsapp: number;
    appstore: number;
    playstore: number;
    external: number;
    total: number;
  };
}

// Formatar moeda BRL
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatar número
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
};

// Formatar percentual
const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

// Glass Card Component
const GlassCard = ({ 
  children, 
  className = '', 
  gradient = false 
}: { 
  children: React.ReactNode; 
  className?: string; 
  gradient?: boolean;
}) => (
  <div className={`
    relative overflow-hidden rounded-2xl 
    ${gradient ? 'bg-gradient-to-br from-white/10 to-white/5' : 'bg-white/5'}
    backdrop-blur-xl border border-white/10 
    shadow-xl shadow-black/20
    ${className}
  `}>
    {children}
  </div>
);

// Badge de categoria
const CategoryBadge = ({ category }: { category: string }) => {
  const styles = {
    whatsapp: 'bg-green-500/20 text-green-300 border-green-500/30',
    appstore: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    playstore: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    external: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  const labels = {
    whatsapp: 'WhatsApp',
    appstore: 'App Store',
    playstore: 'Play Store',
    external: 'Fuga',
  };

  const icons = {
    whatsapp: MessageCircle,
    appstore: Smartphone,
    playstore: Smartphone,
    external: ExternalLink,
  };

  const Icon = icons[category as keyof typeof icons] || ExternalLink;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[category as keyof typeof styles] || styles.external}`}>
      <Icon className="h-3 w-3" />
      {labels[category as keyof typeof labels] || 'Outro'}
    </span>
  );
};

export default function HibridoPage() {
  const [fbMetrics, setFbMetrics] = useState<AdsMetrics | null>(null);
  const [gaOutbound, setGaOutbound] = useState<OutboundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fbError, setFbError] = useState(false);
  const [gaError, setGaError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setFbError(false);
    setGaError(false);

    // Buscar dados em paralelo
    const [fbResult, gaResult] = await Promise.allSettled([
      fetch('/api/ads/insights?period=last_30d').then(r => r.json()),
      fetch('/api/analytics/outbound').then(r => r.json()),
    ]);

    // Processar resultado do Facebook
    if (fbResult.status === 'fulfilled' && Array.isArray(fbResult.value)) {
      setFbMetrics(calculateAdsMetrics(fbResult.value));
    } else {
      setFbError(true);
      setFbMetrics(null);
    }

    // Processar resultado do GA4
    if (gaResult.status === 'fulfilled' && gaResult.value.clicks) {
      setGaOutbound(gaResult.value);
    } else {
      setGaError(true);
      setGaOutbound(null);
    }

    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calcular CPA real (se tiver dados do GA4)
  const realConversions = gaOutbound?.summary.whatsapp || 0;
  const realCpa = fbMetrics?.totalSpend && realConversions > 0 
    ? fbMetrics.totalSpend / realConversions 
    : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Híbrido</h1>
            <p className="text-gray-400 mt-1">
              Análise combinada Meta Ads + Google Analytics
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <span className="text-sm text-gray-500 hidden md:block">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </motion.div>

      {/* SEÇÃO 1: O Cofre (Facebook) */}
      <GlassCard className="mb-6 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Facebook className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">💰 O Cofre</h2>
          <Badge className="bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Meta Ads
          </Badge>
        </div>

        {fbError ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">Erro ao carregar dados do Facebook Ads</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5">
                  <Skeleton className="h-4 w-20 bg-white/10 mb-3" />
                  <Skeleton className="h-8 w-24 bg-white/10" />
                </div>
              ))
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-400">Investimento Total</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(fbMetrics?.totalSpend || 0)}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-400">ROAS</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {(fbMetrics?.roas || 0).toFixed(2)}x
                  </div>
                  <span className="text-xs text-gray-500">Retorno sobre gasto</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-pink-400" />
                    <span className="text-sm text-gray-400">CPA</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(fbMetrics?.cpa || 0)}
                  </div>
                  <span className="text-xs text-gray-500">Custo por aquisição</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-gray-400">CTR Médio</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatPercent(fbMetrics?.avgCtr || 0)}
                  </div>
                  <span className="text-xs text-gray-500">Saúde dos anúncios</span>
                </motion.div>
              </>
            )}
          </div>
        )}
      </GlassCard>

      {/* SEÇÃO 2: Funil de Tráfego (Facebook) */}
      <GlassCard className="mb-6 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Facebook className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">📊 Funil de Tráfego</h2>
          <Badge className="bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Meta Ads
          </Badge>
        </div>

        {fbError ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">Erro ao carregar dados do Facebook Ads</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-6 rounded-xl bg-white/5 text-center">
                  <Skeleton className="h-12 w-24 bg-white/10 mx-auto mb-3" />
                  <Skeleton className="h-4 w-20 bg-white/10 mx-auto" />
                </div>
              ))
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 text-center relative"
                >
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                    1
                  </div>
                  <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatNumber(fbMetrics?.totalImpressions || 0)}
                  </div>
                  <span className="text-gray-400">Impressões</span>
                  <p className="text-xs text-gray-500 mt-2">Quantas vezes apareceu</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 text-center relative"
                >
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                    2
                  </div>
                  <MousePointerClick className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatNumber(fbMetrics?.totalClicks || 0)}
                  </div>
                  <span className="text-gray-400">Cliques no Link</span>
                  <p className="text-xs text-gray-500 mt-2">Quantos interessados</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-xl bg-white/5 border border-white/10 text-center relative"
                >
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">
                    $
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(fbMetrics?.avgCpc || 0)}
                  </div>
                  <span className="text-gray-400">CPC Médio</span>
                  <p className="text-xs text-gray-500 mt-2">Custo por clique</p>
                </motion.div>
              </>
            )}
          </div>
        )}
      </GlassCard>

      {/* SEÇÃO 3: Destino do Usuário (GA4) */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Globe className="h-5 w-5 text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">🎯 Destino do Usuário</h2>
          <Badge className="bg-orange-500/10 text-orange-300 border border-orange-500/30">
            Google Analytics
          </Badge>
        </div>

        {gaError ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-300">Erro ao carregar dados do Google Analytics. Verifique as credenciais.</span>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <Skeleton className="h-6 w-20 bg-white/10" />
                <Skeleton className="h-4 w-64 bg-white/10 flex-1" />
                <Skeleton className="h-6 w-12 bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Resumo de destinos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
              >
                <MessageCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {formatNumber(gaOutbound?.summary.whatsapp || 0)}
                </div>
                <span className="text-sm text-green-400">WhatsApp</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center"
              >
                <Smartphone className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {formatNumber(gaOutbound?.summary.appstore || 0)}
                </div>
                <span className="text-sm text-blue-400">App Store</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center"
              >
                <Smartphone className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {formatNumber(gaOutbound?.summary.playstore || 0)}
                </div>
                <span className="text-sm text-cyan-400">Play Store</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/20 text-center"
              >
                <ExternalLink className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {formatNumber(gaOutbound?.summary.external || 0)}
                </div>
                <span className="text-sm text-gray-400">Outros (Fuga)</span>
              </motion.div>
            </div>

            {/* CPA Real (combinado) */}
            {realCpa > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <div>
                      <span className="text-white font-medium">CPA Real (Meta + GA4)</span>
                      <p className="text-xs text-gray-400">Custo por contato no WhatsApp</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(realCpa)}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tabela de destinos */}
            <h3 className="text-lg font-medium text-white mb-4">Top Destinos de Saída</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tipo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">URL</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Cliques</th>
                  </tr>
                </thead>
                <tbody>
                  {gaOutbound?.clicks.slice(0, 10).map((click, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <CategoryBadge category={click.category} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white text-sm truncate block max-w-md" title={click.url}>
                          {click.url.length > 60 ? click.url.substring(0, 60) + '...' : click.url}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-white">{formatNumber(click.clicks)}</span>
                      </td>
                    </motion.tr>
                  ))}
                  {(!gaOutbound?.clicks || gaOutbound.clicks.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        Nenhum clique de saída registrado no período
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
