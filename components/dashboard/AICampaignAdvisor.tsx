'use client';

/**
 * 🤖 AI Campaign Advisor Component
 * 
 * Exibe análises e dicas de IA sobre campanhas de marketing
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Loader2,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TIPOS
// =====================================================

interface CampaignInsightAI {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  action?: string;
  metric?: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIAnalysisResult {
  summary: string;
  insights: CampaignInsightAI[];
  recommendations: string[];
  healthScore: number;
  generatedAt: string;
  cached?: boolean;
  totalCampaigns?: number;
  totalSpend?: number;
  roas?: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function HealthScoreGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getLabel = () => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            className="fill-none stroke-white/10"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            className={cn('fill-none', getColor().replace('text-', 'stroke-'))}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score * 2.01} 201`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-xl font-bold', getColor())}>{score}</span>
        </div>
      </div>
      <div>
        <p className={cn('font-semibold', getColor())}>{getLabel()}</p>
        <p className="text-xs text-gray-400">Health Score</p>
      </div>
    </div>
  );
}

function InsightCard({ insight, index }: { insight: CampaignInsightAI; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (insight.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'danger': return <XCircle className="h-5 w-5 text-red-400" />;
      default: return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (insight.type) {
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'danger': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      high: 'bg-red-500/20 text-red-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      low: 'bg-gray-500/20 text-gray-400'
    };
    const labels = { high: 'Alta', medium: 'Média', low: 'Baixa' };
    
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[insight.priority])}>
        {labels[insight.priority]}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn('rounded-xl border p-4 cursor-pointer transition-all', getBgColor())}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div>
            <h4 className="font-medium text-white">{insight.title}</h4>
            {insight.metric && (
              <p className="text-sm text-gray-400 mt-1">{insight.metric}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getPriorityBadge()}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
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
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-300">{insight.description}</p>
              {insight.action && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-white/5">
                  <Zap className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-brand-300">{insight.action}</p>
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

interface AICampaignAdvisorProps {
  period?: string;
  showChat?: boolean;
  className?: string;
}

export function AICampaignAdvisor({ 
  period = 'last_7d', 
  showChat = true,
  className 
}: AICampaignAdvisorProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchAnalysis = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(
        `/api/ai/campaign-insights?period=${period}${forceRefresh ? '&refresh=true' : ''}`
      );
      
      if (!res.ok) throw new Error('Falha ao carregar análise');
      
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
      setError('Não foi possível carregar a análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/campaign-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          history: messages.slice(-6) // Últimas 6 mensagens para contexto
        })
      });

      if (!res.ok) throw new Error('Falha ao processar pergunta');

      const data = await res.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Erro no chat:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, não consegui processar sua pergunta. Tente novamente.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 p-6', className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Analisando campanhas com IA...</h3>
            <p className="text-sm text-gray-400">Isso pode levar alguns segundos</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 overflow-hidden', className)}>
      {/* Header */}
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Consultor de IA
                {analysis.cached && (
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
                    em cache
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-400">
                {analysis.totalCampaigns} campanhas analisadas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchAnalysis(true);
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Atualizar análise"
            >
              <RefreshCw className={cn('h-4 w-4 text-gray-400', loading && 'animate-spin')} />
            </button>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Health Score - sempre visível */}
        <div className="mt-4 flex items-center justify-between">
          <HealthScoreGauge score={analysis.healthScore} />
          
          <div className="text-right">
            {analysis.totalSpend !== undefined && (
              <p className="text-sm text-gray-400">
                Investimento: <span className="text-white font-medium">
                  R$ {analysis.totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
            {analysis.roas !== undefined && (
              <p className="text-sm text-gray-400">
                ROAS: <span className={cn('font-medium', analysis.roas >= 3 ? 'text-green-400' : analysis.roas >= 2 ? 'text-yellow-400' : 'text-red-400')}>
                  {analysis.roas.toFixed(2)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6">
              {/* Resumo */}
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-gray-300">{analysis.summary}</p>
              </div>

              {/* Insights */}
              {analysis.insights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-brand-400" />
                    Insights
                  </h4>
                  {analysis.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} index={i} />
                  ))}
                </div>
              )}

              {/* Recomendações */}
              {analysis.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    Recomendações
                  </h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span className="text-brand-400 mt-1">•</span>
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chat */}
              {showChat && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {chatOpen ? 'Fechar chat' : 'Perguntar sobre as campanhas'}
                  </button>

                  <AnimatePresence>
                    {chatOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-3">
                          {/* Mensagens */}
                          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                            {messages.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                Faça uma pergunta sobre suas campanhas
                              </p>
                            )}
                            {messages.map((msg, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'p-3 rounded-lg text-sm',
                                  msg.role === 'user' 
                                    ? 'bg-brand-500/20 ml-8' 
                                    : 'bg-white/5 mr-8'
                                )}
                              >
                                <p className={msg.role === 'user' ? 'text-brand-300' : 'text-gray-300'}>
                                  {msg.content}
                                </p>
                              </div>
                            ))}
                            {chatLoading && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Pensando...
                              </div>
                            )}
                          </div>

                          {/* Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Ex: Qual campanha devo pausar?"
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={chatLoading || !inputValue.trim()}
                              className="p-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                              <Send className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-500 text-right">
                Atualizado em {new Date(analysis.generatedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AICampaignAdvisor;
