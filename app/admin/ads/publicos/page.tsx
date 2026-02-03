'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  Target,
  Zap,
  Eye,
  ShoppingCart,
  UserCheck,
  Play,
  Instagram,
  Facebook,
  ExternalLink,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================

interface Audience {
  id: string;
  meta_audience_id: string;
  template_id?: string;
  name: string;
  audience_type: 'CUSTOM' | 'LOOKALIKE';
  source_type?: string;
  funnel_stage?: 'TOPO' | 'MEIO' | 'FUNDO';
  approximate_size?: number;
  health_status?: string;
  is_essential?: boolean;
  use_for_exclusion?: boolean;
  recommended_for?: string[];
  lookalike_ratio?: number;
  retention_days?: number;
  last_health_check?: string;
}

interface HealthCheck {
  id: string;
  name: string;
  size: number;
  is_healthy: boolean;
  status: string;
  status_description: string;
}

interface AudienceStats {
  total: number;
  custom: number;
  lookalikes: number;
  healthy: number;
  unhealthy: number;
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    'READY': { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
    'FILLING': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Loader2 },
    'ERROR': { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
    'DELETED': { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle },
  };

  const { bg, text, icon: Icon } = config[status] || config['ERROR'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className={`w-3 h-3 ${status === 'FILLING' ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
}

function FunnelBadge({ stage }: { stage?: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    'TOPO': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Topo' },
    'MEIO': { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Meio' },
    'FUNDO': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Fundo' },
  };

  if (!stage) return null;

  const { bg, text, label } = config[stage] || config['MEIO'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

function TypeIcon({ type, source }: { type: string; source?: string }) {
  if (type === 'LOOKALIKE') {
    return <TrendingUp className="w-5 h-5 text-green-400" />;
  }

  const icons: Record<string, any> = {
    'WEBSITE': Eye,
    'ENGAGEMENT': Facebook,
    'VIDEO': Play,
    'INSTAGRAM': Instagram,
  };

  const Icon = icons[source || ''] || Users;
  return <Icon className="w-5 h-5 text-blue-400" />;
}

function AudienceCard({ 
  audience, 
  healthData,
  onRefresh 
}: { 
  audience: Audience; 
  healthData?: HealthCheck;
  onRefresh: (id: string) => void;
}) {
  const size = healthData?.size || audience.approximate_size || 0;
  const status = healthData?.status || audience.health_status || 'UNKNOWN';
  const isHealthy = healthData?.is_healthy ?? (size >= 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gray-800/50 rounded-xl p-4 border transition-all
        ${audience.use_for_exclusion 
          ? 'border-red-500/30 hover:border-red-500/50' 
          : 'border-white/10 hover:border-white/20'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-white/5">
            <TypeIcon type={audience.audience_type} source={audience.source_type} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-white truncate">
                {audience.name}
              </h3>
              {audience.is_essential && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                  Essencial
                </span>
              )}
              {audience.use_for_exclusion && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  Exclusão
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {size.toLocaleString('pt-BR')} pessoas
              </span>
              
              {audience.lookalike_ratio && (
                <span className="text-green-400">
                  {(audience.lookalike_ratio * 100).toFixed(0)}% Similar
                </span>
              )}

              {audience.retention_days && (
                <span>{audience.retention_days} dias</span>
              )}

              <FunnelBadge stage={audience.funnel_stage} />
            </div>

            {audience.recommended_for && audience.recommended_for.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <span className="text-xs text-gray-500">Recomendado para:</span>
                {audience.recommended_for.map(obj => (
                  <span 
                    key={obj}
                    className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded"
                  >
                    {obj}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          
          {!isHealthy && size < 1000 && (
            <div className="relative group">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-gray-900 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Público pequeno. Mínimo recomendado: 1.000 pessoas
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [healthData, setHealthData] = useState<Map<string, HealthCheck>>(new Map());
  const [stats, setStats] = useState<AudienceStats>({ total: 0, custom: 0, lookalikes: 0, healthy: 0, unhealthy: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterFunnel, setFilterFunnel] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Carregar públicos
  const loadAudiences = useCallback(async () => {
    try {
      const response = await fetch('/api/meta/audiences');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar públicos');
      }

      // Formatar dados
      const formattedAudiences: Audience[] = (data.audiences || []).map((a: any) => ({
        id: a.id,
        meta_audience_id: a.id,
        template_id: a.template_id,
        name: a.name,
        audience_type: a.subtype === 'LOOKALIKE' ? 'LOOKALIKE' : 'CUSTOM',
        source_type: a.subtype,
        approximate_size: a.approximate_count,
        health_status: a.isReady ? 'READY' : 'FILLING',
        is_essential: a.is_essential,
        lookalike_ratio: a.lookalike_spec?.ratio,
      }));

      setAudiences(formattedAudiences);
      setStats({
        total: formattedAudiences.length,
        custom: formattedAudiences.filter(a => a.audience_type === 'CUSTOM').length,
        lookalikes: formattedAudiences.filter(a => a.audience_type === 'LOOKALIKE').length,
        healthy: formattedAudiences.filter(a => (a.approximate_size || 0) >= 1000).length,
        unhealthy: formattedAudiences.filter(a => (a.approximate_size || 0) < 1000).length,
      });

    } catch (error: any) {
      console.error('Erro ao carregar públicos:', error);
      toast.error(error.message || 'Erro ao carregar públicos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Criar públicos essenciais
  const handleCreateEssentials = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/meta/audiences/create-essentials', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar públicos');
      }

      const { summary } = data;
      
      toast.success(
        `✅ ${summary.audiences_created} públicos criados, ${summary.lookalikes_created} lookalikes!`,
        {
          description: summary.skipped > 0 
            ? `${summary.skipped} já existiam` 
            : undefined
        }
      );

      // Recarregar lista
      await loadAudiences();

    } catch (error: any) {
      console.error('Erro ao criar públicos:', error);
      toast.error(error.message || 'Erro ao criar públicos');
    } finally {
      setIsCreating(false);
    }
  };

  // Health check
  const handleHealthCheck = async () => {
    setIsRefreshing(true);

    try {
      const response = await fetch('/api/meta/audiences/health-check');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar saúde');
      }

      // Atualizar mapa de saúde
      const newHealthData = new Map<string, HealthCheck>();
      data.health_checks?.forEach((h: HealthCheck) => {
        newHealthData.set(h.id, h);
      });
      setHealthData(newHealthData);

      toast.success(
        `✅ ${data.summary.healthy}/${data.summary.total} públicos saudáveis`
      );

    } catch (error: any) {
      console.error('Erro no health check:', error);
      toast.error(error.message || 'Erro ao verificar saúde');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Carregar ao montar
  useEffect(() => {
    loadAudiences();
  }, [loadAudiences]);

  // Filtrar públicos
  const filteredAudiences = audiences.filter(a => {
    if (filterFunnel && a.funnel_stage !== filterFunnel) return false;
    if (filterType && a.audience_type !== filterType) return false;
    return true;
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gerenciador de Públicos</h1>
            <p className="text-sm text-gray-400">
              Custom Audiences e Lookalikes do Meta Ads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleHealthCheck}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Health Check
          </button>

          <button
            onClick={handleCreateEssentials}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium transition-all disabled:opacity-50"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isCreating ? 'Criando...' : 'Criar Essenciais'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'blue' },
          { label: 'Personalizados', value: stats.custom, icon: Target, color: 'purple' },
          { label: 'Lookalikes', value: stats.lookalikes, icon: TrendingUp, color: 'green' },
          { label: 'Saudáveis', value: stats.healthy, icon: CheckCircle, color: 'emerald' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800/50 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-gray-400">Filtrar por:</span>
        
        <div className="flex items-center gap-2">
          {['TOPO', 'MEIO', 'FUNDO'].map(stage => (
            <button
              key={stage}
              onClick={() => setFilterFunnel(filterFunnel === stage ? null : stage)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterFunnel === stage
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          {[
            { value: 'CUSTOM', label: 'Personalizados' },
            { value: 'LOOKALIKE', label: 'Lookalikes' },
          ].map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(filterType === type.value ? null : type.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterType === type.value
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {(filterFunnel || filterType) && (
          <button
            onClick={() => { setFilterFunnel(null); setFilterType(null); }}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Lista de Públicos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : filteredAudiences.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-white/10">
          <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {audiences.length === 0 ? 'Nenhum público criado' : 'Nenhum resultado'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {audiences.length === 0 
              ? 'Crie automaticamente os públicos essenciais para suas campanhas de remarketing e aquisição.'
              : 'Tente ajustar os filtros para encontrar o que procura.'
            }
          </p>
          {audiences.length === 0 && (
            <button
              onClick={handleCreateEssentials}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium"
            >
              <Sparkles className="w-5 h-5" />
              Criar Públicos Essenciais
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredAudiences.map((audience) => (
              <AudienceCard
                key={audience.id || audience.meta_audience_id}
                audience={audience}
                healthData={healthData.get(audience.meta_audience_id)}
                onRefresh={() => {}}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info sobre públicos essenciais */}
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Públicos Essenciais Incluem:
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-purple-400">🎯 Remarketing (Fundo)</h4>
            <ul className="text-gray-400 space-y-1">
              <li>• Visitantes 7/30/180 dias</li>
              <li>• Abandonou Checkout</li>
              <li>• Adicionou ao Carrinho</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-400">📱 Engajamento (Meio)</h4>
            <ul className="text-gray-400 space-y-1">
              <li>• Engajou no Facebook</li>
              <li>• Engajou no Instagram</li>
              <li>• Assistiu Vídeos 75%+</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-green-400">🚀 Aquisição (Topo)</h4>
            <ul className="text-gray-400 space-y-1">
              <li>• Lookalike Compradores 1-5%</li>
              <li>• Lookalike Checkout 1%</li>
              <li>• Lookalike Engajamento IG</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
