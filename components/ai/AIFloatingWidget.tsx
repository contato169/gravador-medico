'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, X, Send, Minimize2, Maximize2, Sparkles, Bot,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Copy, Check, Loader2, ChevronRight, Zap, ArrowRight,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// =====================================================
// TIPOS
// =====================================================

interface QuickInsight {
  type: 'success' | 'warning' | 'critical' | 'info';
  title: string;
  description: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WidgetState {
  isOpen: boolean;
  isExpanded: boolean;
  hasUnreadInsights: boolean;
}

// =====================================================
// CONSTANTES
// =====================================================

const quickPrompts = [
  { label: '🎯 Melhor campanha', prompt: 'Qual minha melhor campanha agora?' },
  { label: '📉 O que pausar', prompt: 'Quais anúncios devo pausar?' },
  { label: '💰 Reduzir CPA', prompt: 'Como posso reduzir meu CPA?' },
  { label: '🚀 Escalar', prompt: 'O que devo escalar primeiro?' },
];

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function InsightBadge({ insight }: { insight: QuickInsight }) {
  const config = {
    success: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle },
    warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: AlertTriangle },
    critical: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: TrendingDown },
    info: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: Sparkles },
  };

  const { bg, border, text, icon: Icon } = config[insight.type];

  return (
    <div className={cn('p-3 rounded-lg border', bg, border)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', text)} />
        <div>
          <p className={cn('text-sm font-medium', text)}>{insight.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// WIDGET PRINCIPAL
// =====================================================

export default function AIFloatingWidget() {
  const [state, setState] = useState<WidgetState>({
    isOpen: false,
    isExpanded: false,
    hasUnreadInsights: true,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar insights rápidos ao abrir
  useEffect(() => {
    if (state.isOpen && quickInsights.length === 0) {
      fetchQuickInsights();
    }
  }, [state.isOpen]);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus no input ao abrir
  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.isOpen]);

  const fetchQuickInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/ai/performance?period=last_7d&type=local&quick=true');
      const data = await res.json();

      // Extrair insights rápidos da análise
      const insights: QuickInsight[] = [];

      if (data.statusConta) {
        insights.push({
          type: data.statusConta === 'SAUDÁVEL' ? 'success' : data.statusConta === 'ATENÇÃO' ? 'warning' : 'critical',
          title: `Conta ${data.statusConta}`,
          description: data.resumoExecutivo?.veredito?.slice(0, 80) + '...' || 'Análise disponível',
        });
      }

      if (data.acoesImediatas?.length > 0) {
        const primeiraAcao = data.acoesImediatas[0];
        insights.push({
          type: primeiraAcao.urgencia === 'CRÍTICO' ? 'critical' : primeiraAcao.urgencia === 'ALTO' ? 'warning' : 'info',
          title: '⚡ Ação Recomendada',
          description: primeiraAcao.acao.slice(0, 80) + (primeiraAcao.acao.length > 80 ? '...' : ''),
        });
      }

      if (data.metricas) {
        if (data.metricas.roasGeral >= 3.5) {
          insights.push({
            type: 'success',
            title: `ROAS ${data.metricas.roasGeral.toFixed(2)}x`,
            description: 'Performance excelente! Considere escalar.',
          });
        } else if (data.metricas.roasGeral < 2) {
          insights.push({
            type: 'critical',
            title: `ROAS ${data.metricas.roasGeral.toFixed(2)}x`,
            description: 'Performance baixa. Revisão urgente necessária.',
          });
        }
      }

      setQuickInsights(insights);
      setState(prev => ({ ...prev, hasUnreadInsights: insights.some(i => i.type === 'critical' || i.type === 'warning') }));
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
      setQuickInsights([{
        type: 'info',
        title: 'IA Pronta',
        description: 'Faça uma pergunta sobre seus ads!',
      }]);
    } finally {
      setLoadingInsights(false);
    }
  };

  const sendMessage = async (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          period: 'last_7d',
          includeContext: true,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.error || 'Erro ao processar resposta',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Erro ao conectar com a IA. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleWidget = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen, hasUnreadInsights: false }));
  };

  const toggleExpand = () => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  return (
    <>
      {/* Botão Flutuante */}
      <AnimatePresence>
        {!state.isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleWidget}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-xl shadow-brand-500/25"
          >
            <Brain className="h-6 w-6" />
            {state.hasUnreadInsights && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-gray-900"
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Widget Expandido */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed z-50 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden',
              state.isExpanded
                ? 'bottom-6 right-6 left-6 top-20 md:left-auto md:w-[600px] md:top-6'
                : 'bottom-6 right-6 w-[380px] h-[520px]'
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-brand-500/20 to-purple-600/20 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/20">
                  <Brain className="h-5 w-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Performance AI</h3>
                  <p className="text-xs text-gray-500">Assistente de tráfego pago</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleExpand}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  {state.isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleWidget}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col h-[calc(100%-60px)]">
              {/* Quick Insights (quando não há mensagens) */}
              {messages.length === 0 && (
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Insights Rápidos</p>
                    <Link
                      href="/admin/ai"
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      Ver análise completa <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {loadingInsights ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 text-brand-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quickInsights.map((insight, i) => (
                        <InsightBadge key={i} insight={insight} />
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Perguntas rápidas:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickPrompts.map((qp, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(qp.prompt)}
                          className="p-2 text-xs text-left rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 transition-colors"
                        >
                          {qp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                          <Bot className="h-3 w-3 text-brand-400" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] p-3 rounded-xl relative group',
                          msg.role === 'user'
                            ? 'bg-brand-500/20 border border-brand-500/30'
                            : 'bg-white/5 border border-white/10'
                        )}
                      >
                        <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                        <button
                          onClick={() => copyMessage(msg.content, msg.id)}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-800 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copied === msg.id ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                        <Bot className="h-3 w-3 text-brand-400" />
                      </div>
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-white/10 bg-gray-900/50">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Pergunte sobre seus ads..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500/50"
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="px-3 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Actions quando tem mensagens */}
                {messages.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setMessages([])}
                      className="px-2 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white whitespace-nowrap"
                    >
                      Limpar chat
                    </button>
                    {quickPrompts.slice(0, 2).map((qp, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(qp.prompt)}
                        className="px-2 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white whitespace-nowrap"
                        disabled={loading}
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
