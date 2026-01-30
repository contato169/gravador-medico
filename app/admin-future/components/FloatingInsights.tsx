'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { AlertTriangle, TrendingUp, Shield, Sparkles } from 'lucide-react'

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type InsightType = 'critical' | 'growth' | 'stable'

interface Insight {
  id: string
  type: InsightType
  message: string
  icon: React.ElementType
  priority: number
}

// Configuração de cores por tipo - Black Piano Style
const typeConfig = {
  critical: {
    bg: 'bg-red-600',
    glow: 'shadow-[0_0_20px_rgba(220,38,38,0.6)]',
    glowHover: 'shadow-[0_0_30px_rgba(220,38,38,0.8)]',
    text: 'text-red-400',
    border: 'border-red-600/30',
    bgTooltip: 'bg-red-600/10',
  },
  growth: {
    bg: 'bg-[#22c55e]',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    glowHover: 'shadow-[0_0_30px_rgba(34,197,94,0.8)]',
    text: 'text-[#22c55e]',
    border: 'border-[#22c55e]/30',
    bgTooltip: 'bg-[#22c55e]/10',
  },
  stable: {
    bg: 'bg-zinc-400',
    glow: 'shadow-[0_0_20px_rgba(161,161,170,0.4)]',
    glowHover: 'shadow-[0_0_30px_rgba(161,161,170,0.6)]',
    text: 'text-zinc-400',
    border: 'border-zinc-400/30',
    bgTooltip: 'bg-zinc-400/10',
  },
}

// Componente de Orbe Individual
function InsightOrb({ 
  insight, 
  index, 
  isHovered, 
  onHover 
}: { 
  insight: Insight
  index: number
  isHovered: boolean
  onHover: (id: string | null) => void 
}) {
  const config = typeConfig[insight.type]
  const Icon = insight.icon

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => onHover(insight.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Orbe flutuante */}
      <motion.div
        className={`
          w-4 h-4 rounded-full cursor-pointer
          ${config.bg} ${isHovered ? config.glowHover : config.glow}
          transition-shadow duration-300
        `}
        animate={isHovered ? {} : { 
          y: [0, -12, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2 + index * 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.5,
        }}
        whileHover={{ scale: 1.3 }}
      />

      {/* Tooltip - Abre para a esquerda e para cima */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute right-8 bottom-0
              min-w-[220px] p-3 rounded-xl
              bg-[#0a0a0a]/95 backdrop-blur-md
              border ${config.border}
              ${config.bgTooltip}
            `}
          >
            {/* Seta do tooltip - aponta para a direita */}
            <div 
              className={`absolute right-[-6px] bottom-3
                          w-3 h-3 rotate-45 bg-[#0a0a0a]/95 border-r border-t ${config.border}`}
            />
            
            <div className="relative z-10">
              {/* Header do tooltip */}
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1 rounded-lg ${config.bgTooltip}`}>
                  <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                </div>
                <span className={`text-xs font-mono uppercase tracking-wider ${config.text}`}>
                  {insight.type === 'critical' ? 'Alerta Crítico' : 
                   insight.type === 'growth' ? 'Growth Signal' : 'Status'}
                </span>
              </div>
              
              {/* Mensagem */}
              <p className="text-white text-sm font-medium leading-snug">
                {insight.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FloatingInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const analyzeSystem = useCallback(async () => {
    const newInsights: Insight[] = []

    try {
      // 1. Verificar fila de provisionamento
      const { data: queueData, error: queueError } = await supabase
        .from('provisioning_queue')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')

      const pendingCount = queueData?.length || 0

      if (queueError) {
        console.error('Erro ao verificar fila:', queueError)
      }

      // Regra 1: Alerta crítico se > 5 pendentes
      if (pendingCount > 5) {
        newInsights.push({
          id: 'critical-queue',
          type: 'critical',
          message: `Gargalo na Entrega Detectado. ${pendingCount} itens aguardando processamento.`,
          icon: AlertTriangle,
          priority: 1,
        })
      }

      // 2. Verificar vendas recentes (últimos 30 minutos)
      const thirtyMinAgo = new Date()
      thirtyMinAgo.setMinutes(thirtyMinAgo.getMinutes() - 30)

      const { data: recentSales, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('status', 'approved')
        .gte('created_at', thirtyMinAgo.toISOString())

      if (salesError) {
        console.error('Erro ao verificar vendas:', salesError)
      }

      const recentSalesCount = recentSales?.length || 0

      // Regra 2: Alerta de crescimento se vendas recentes
      if (recentSalesCount > 0) {
        newInsights.push({
          id: 'growth-sales',
          type: 'growth',
          message: `Tração de Vendas Ativa. ${recentSalesCount} venda${recentSalesCount > 1 ? 's' : ''} nos últimos 30 min.`,
          icon: TrendingUp,
          priority: 2,
        })
      }

      // Regra 3: Sistema estável se fila vazia
      if (pendingCount === 0) {
        newInsights.push({
          id: 'stable-system',
          type: 'stable',
          message: 'Sistemas Operacionais Estáveis. Fila de entregas limpa.',
          icon: Shield,
          priority: 3,
        })
      }

      // Se não há insights, adiciona um neutro
      if (newInsights.length === 0) {
        newInsights.push({
          id: 'monitoring',
          type: 'stable',
          message: 'IA Monitorando. Nenhuma anomalia detectada.',
          icon: Sparkles,
          priority: 4,
        })
      }

      // Ordenar por prioridade
      newInsights.sort((a, b) => a.priority - b.priority)
      setInsights(newInsights)

    } catch (error) {
      console.error('Erro na análise:', error)
      setInsights([{
        id: 'error',
        type: 'stable',
        message: 'Reconectando ao sistema...',
        icon: Sparkles,
        priority: 99,
      }])
    }
  }, [])

  useEffect(() => {
    // Análise inicial
    analyzeSystem()

    // Re-analisar a cada 60 segundos
    const interval = setInterval(analyzeSystem, 60000)
    return () => clearInterval(interval)
  }, [analyzeSystem])

  return (
    <motion.div
      className="fixed bottom-24 right-6 z-30 pr-4"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200 }}
    >
      {/* Container principal - Black Piano Style */}
      <motion.div
        className={`
          relative flex flex-col gap-3 p-3 rounded-2xl
          bg-[#0a0a0a]/90 backdrop-blur-md
          border border-white/5
          transition-all duration-300
          ${isExpanded ? 'pr-6' : ''}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false)
          setHoveredId(null)
        }}
      >
        {/* Label "AI" */}
        <motion.div
          className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full
                     bg-[#0a0a0a] border border-[#22c55e]/30
                     text-[10px] font-mono text-[#22c55e] uppercase tracking-wider"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-violet-400" />
            AI
          </span>
        </motion.div>

        {/* Orbes */}
        <AnimatePresence>
          {insights.map((insight, index) => (
            <InsightOrb
              key={insight.id}
              insight={insight}
              index={index}
              isHovered={hoveredId === insight.id}
              onHover={setHoveredId}
            />
          ))}
        </AnimatePresence>

        {/* Indicador de atividade */}
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 
                     w-8 h-0.5 rounded-full bg-gradient-to-r from-transparent via-slate-600 to-transparent"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Tooltip de hint quando não expandido */}
      <AnimatePresence>
        {!isExpanded && insights.some(i => i.type === 'critical') && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-3
                       px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30
                       text-red-400 text-xs font-mono whitespace-nowrap"
          >
            ⚠️ Atenção necessária
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulso de fundo para alertas críticos */}
      {insights.some(i => i.type === 'critical') && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-red-500/10 -z-10"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}
