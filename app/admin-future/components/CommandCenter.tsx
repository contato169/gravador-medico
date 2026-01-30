'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Brain,
  Zap,
  TrendingDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Dados fictícios para o gráfico de vendas por hora
const salesByHourData = [
  { hour: '00h', vendas: 12 },
  { hour: '02h', vendas: 8 },
  { hour: '04h', vendas: 5 },
  { hour: '06h', vendas: 15 },
  { hour: '08h', vendas: 45 },
  { hour: '10h', vendas: 120 },
  { hour: '12h', vendas: 95 },
  { hour: '14h', vendas: 150 },
  { hour: '16h', vendas: 180 },
  { hour: '18h', vendas: 220 },
  { hour: '20h', vendas: 165 },
  { hour: '22h', vendas: 85 },
]

// Dados mockados de Meta Ads
const metaAdsData = {
  spend: 2450.80,
  leads: 127,
  cpl: 19.30,
  roas: 3.8,
  impressions: 45230,
  clicks: 892,
}

// Tooltip customizado Black Piano
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 shadow-2xl">
        <p className="text-zinc-500 font-mono text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-lg">
          {payload[0].value} 
          <span className="text-zinc-600 text-xs font-normal ml-1">vendas</span>
        </p>
      </div>
    )
  }
  return null
}

interface KPIData {
  salesToday: number
  revenueToday: number
  pendingQueue: number
  conversionRate: number
}

// Skeleton pulsante para loading
function SkeletonValue({ width = 'w-24' }: { width?: string }) {
  return (
    <motion.div
      className={`h-10 ${width} bg-zinc-800/50 rounded-lg`}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// Card de KPI - Black Piano Style
function KPICard({
  title,
  value,
  icon: Icon,
  suffix = '',
  prefix = '',
  loading = false,
  trend,
  compact = false,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  suffix?: string
  prefix?: string
  loading?: boolean
  trend?: { value: number; positive: boolean }
  compact?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden
        bg-[#0a0a0a]
        border border-white/5
        rounded-2xl ${compact ? 'p-4' : 'p-6'}
        transition-all duration-300
        hover:border-[#22c55e]/50 
        hover:shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]
        group
      `}
    >
      {/* Glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at top right, rgba(34, 197, 94, 0.05) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10">
        {/* Header com ícone e trend */}
        <div className="flex items-center justify-between mb-3">
          <div className={`${compact ? 'p-2' : 'p-2.5'} rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20`}>
            <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-[#22c55e]`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full ${
              trend.positive 
                ? 'text-[#22c55e] bg-[#22c55e]/10' 
                : 'text-red-400 bg-red-500/10'
            }`}>
              {trend.positive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>

        {/* Valor */}
        <div className="mb-2">
          {loading ? (
            <SkeletonValue />
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`${compact ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold text-white tracking-tight`}
            >
              {prefix}
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
              {suffix}
            </motion.div>
          )}
        </div>

        {/* Título */}
        <p className="text-zinc-500 text-sm font-medium tracking-wide">
          {title}
        </p>
      </div>

      {/* Linha decorativa inferior */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#22c55e] to-transparent"
        initial={{ width: '0%' }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  )
}

// Card de Meta Ads com indicador de status
function MetaAdsMetricCard({
  title,
  value,
  icon: Icon,
  status,
  subtitle,
}: {
  title: string
  value: string
  icon: React.ElementType
  status: 'excellent' | 'good' | 'warning' | 'danger'
  subtitle?: string
}) {
  const statusConfig = {
    excellent: { color: '#22c55e', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/30', icon: CheckCircle2 },
    good: { color: '#22c55e', bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/20', icon: CheckCircle2 },
    warning: { color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertTriangle },
    danger: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: TrendingDown },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={`
        relative overflow-hidden
        bg-[#0a0a0a]
        border ${config.border}
        rounded-xl p-4
        transition-all duration-300
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <StatusIcon className="w-4 h-4" style={{ color: config.color }} />
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">
        {value}
      </div>
      
      <p className="text-zinc-500 text-xs font-medium">{title}</p>
      {subtitle && (
        <p className="text-zinc-700 text-[10px] mt-1 font-mono">{subtitle}</p>
      )}
    </motion.div>
  )
}

// Função para saudação baseada na hora
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function CommandCenter() {
  const [kpiData, setKpiData] = useState<KPIData>({
    salesToday: 0,
    revenueToday: 0,
    pendingQueue: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userName, setUserName] = useState<string>('Operador')

  // Buscar nome do usuário via API
  const fetchUserName = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user?.name) {
          // Pega o primeiro nome
          setUserName(data.user.name.split(' ')[0])
        } else if (data.user?.email) {
          // Fallback: extrai nome do email
          const nameFromEmail = data.user.email.split('@')[0]
          setUserName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1))
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      // Buscar vendas aprovadas de hoje
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, total_amount, status')
        .eq('status', 'approved')
        .gte('created_at', todayISO)

      if (salesError) console.error('Erro ao buscar vendas:', salesError)

      const salesToday = salesData?.length || 0
      const revenueToday = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0

      // Buscar itens pendentes na fila
      const { data: queueData, error: queueError } = await supabase
        .from('provisioning_queue')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')

      if (queueError) console.error('Erro ao buscar fila:', queueError)

      const pendingQueue = queueData?.length || 0

      // Taxa de conversão (vendas hoje vs média 7 dias)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: weekSales } = await supabase
        .from('sales')
        .select('id')
        .eq('status', 'approved')
        .gte('created_at', weekAgo.toISOString())

      const avgDailySales = (weekSales?.length || 0) / 7
      const conversionRate = avgDailySales > 0 
        ? Math.round((salesToday / avgDailySales) * 100) 
        : 100

      setKpiData({
        salesToday,
        revenueToday,
        pendingQueue,
        conversionRate: Math.min(conversionRate, 999),
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  useEffect(() => {
    fetchUserName()
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData, fetchUserName])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('R$', '').trim()
  }

  // Determinar status do ROAS
  const getRoasStatus = (roas: number): 'excellent' | 'good' | 'warning' | 'danger' => {
    if (roas >= 3) return 'excellent'
    if (roas >= 2) return 'good'
    if (roas >= 1) return 'warning'
    return 'danger'
  }

  return (
    <div className="p-6 md:p-8">
      {/* ===== CABEÇALHO - BOAS VINDAS ===== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {getGreeting()}, <span className="text-[#22c55e]">{userName}</span>
          </h1>
          <p className="text-zinc-600 mt-2 text-sm">
            Aqui está o panorama da sua operação hoje.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status de conexão */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[#22c55e] text-xs font-mono">ONLINE</span>
          </div>

          {/* Botão de refresh */}
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 
                       hover:border-[#22c55e]/30 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Última atualização */}
          {lastUpdate && (
            <span className="text-zinc-700 text-xs font-mono hidden md:block">
              {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
      </motion.div>

      {/* ===== GRID DE KPIs FINANCEIROS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <KPICard
          title="Vendas Hoje"
          value={kpiData.salesToday}
          icon={Activity}
          loading={loading}
          trend={{ value: kpiData.conversionRate, positive: kpiData.conversionRate >= 100 }}
        />
        
        <KPICard
          title="Faturamento"
          value={formatCurrency(kpiData.revenueToday)}
          icon={DollarSign}
          prefix="R$ "
          loading={loading}
        />
        
        <KPICard
          title="Fila Pendente"
          value={kpiData.pendingQueue}
          icon={Clock}
          loading={loading}
        />
        
        <KPICard
          title="Performance"
          value={`${kpiData.conversionRate}%`}
          icon={TrendingUp}
          loading={loading}
          trend={{ value: kpiData.conversionRate - 100, positive: kpiData.conversionRate >= 100 }}
        />
      </div>

      {/* ===== BLOCO META ADS SIGNALS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Meta Ads Signals
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">
                    BETA
                  </span>
                </h3>
                <p className="text-zinc-600 text-xs">Performance de campanhas hoje</p>
              </div>
            </div>
            
            {/* ROAS Badge */}
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-xl
              ${metaAdsData.roas >= 3 
                ? 'bg-[#22c55e]/10 border border-[#22c55e]/30' 
                : metaAdsData.roas >= 2 
                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }
            `}>
              {metaAdsData.roas >= 3 ? (
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              <span className={`text-sm font-bold ${
                metaAdsData.roas >= 3 ? 'text-[#22c55e]' : metaAdsData.roas >= 2 ? 'text-yellow-500' : 'text-red-400'
              }`}>
                ROAS {metaAdsData.roas.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Grid de métricas Meta Ads */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetaAdsMetricCard
              title="Investimento"
              value={`R$ ${metaAdsData.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              status="good"
              subtitle="Spend diário"
            />
            <MetaAdsMetricCard
              title="Custo por Lead"
              value={`R$ ${metaAdsData.cpl.toFixed(2)}`}
              icon={Target}
              status={metaAdsData.cpl < 25 ? 'excellent' : metaAdsData.cpl < 40 ? 'warning' : 'danger'}
              subtitle={`${metaAdsData.leads} leads`}
            />
            <MetaAdsMetricCard
              title="ROAS"
              value={`${metaAdsData.roas.toFixed(1)}x`}
              icon={TrendingUp}
              status={getRoasStatus(metaAdsData.roas)}
              subtitle={metaAdsData.roas >= 3 ? 'Excelente' : metaAdsData.roas >= 2 ? 'Bom' : 'Atenção'}
            />
            <MetaAdsMetricCard
              title="CTR"
              value={`${((metaAdsData.clicks / metaAdsData.impressions) * 100).toFixed(2)}%`}
              icon={Activity}
              status="good"
              subtitle={`${metaAdsData.clicks} cliques`}
            />
          </div>
        </div>
      </motion.div>

      {/* ===== BLOCO DIREÇÃO DO DIA (IA INSIGHT) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#0f0f0f] border border-[#22c55e]/20 rounded-2xl p-6 relative overflow-hidden">
          {/* Glow effect */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 flex items-start gap-4">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 15px rgba(34, 197, 94, 0.3)',
                  '0 0 25px rgba(34, 197, 94, 0.5)',
                  '0 0 15px rgba(34, 197, 94, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30"
            >
              <Brain className="w-6 h-6 text-[#22c55e]" />
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-white">
                  Direção do Dia
                </h3>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-mono">
                  <Zap className="w-3 h-3" />
                  IA INSIGHT
                </span>
              </div>
              
              <p className="text-zinc-300 text-sm leading-relaxed">
                <span className="text-[#22c55e] font-medium">Análise:</span> Suas campanhas de 
                <span className="text-white font-medium"> "Público Frio" </span>
                estão com CPL alto hoje. 
                <span className="text-[#22c55e] font-medium"> Recomendação:</span> Verificar criativos 03 e 04, 
                considere pausar conjuntos com frequência acima de 2.5.
              </p>
              
              <div className="flex items-center gap-4 mt-4">
                <button className="text-xs text-[#22c55e] hover:text-white transition-colors font-medium flex items-center gap-1">
                  Ver detalhes <ArrowUpRight className="w-3 h-3" />
                </button>
                <span className="text-zinc-700 text-[10px] font-mono">
                  Atualizado às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== GRÁFICO DE VENDAS POR HORA ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 
                        hover:border-[#22c55e]/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20">
                <TrendingUp className="w-5 h-5 text-[#22c55e]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Vendas por Hora
                </h3>
                <p className="text-zinc-600 text-xs font-mono">Últimas 24 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-zinc-500 text-xs font-mono">LIVE</span>
            </div>
          </div>
          
          {/* Área do gráfico */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesByHourData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVendasBlackPiano" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#22c55e" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="hour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#52525b', fontSize: 11, fontFamily: 'monospace' }}
                  dy={10}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.3 }}
                />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVendasBlackPiano)"
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
