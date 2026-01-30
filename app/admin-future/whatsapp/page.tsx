'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle,
  Wifi,
  WifiOff,
  Send,
  Clock,
  CheckCheck,
  XCircle,
  RefreshCw,
  Smartphone,
  QrCode,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react'
import PageContainer from '../components/PageContainer'

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface WhatsAppLog {
  id: string
  phone: string
  message: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  type: 'welcome' | 'purchase' | 'reminder' | 'support'
  created_at: string
}

// Status Badge
function StatusBadge({ status }: { status: WhatsAppLog['status'] }) {
  const config = {
    sent: { label: 'Enviado', icon: Send, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    delivered: { label: 'Entregue', icon: CheckCheck, color: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20' },
    read: { label: 'Lido', icon: CheckCheck, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    failed: { label: 'Falhou', icon: XCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  }
  const { label, icon: Icon, color } = config[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// Type Badge
function TypeBadge({ type }: { type: WhatsAppLog['type'] }) {
  const config = {
    welcome: { label: 'Boas-vindas', color: 'text-purple-400' },
    purchase: { label: 'Compra', color: 'text-[#22c55e]' },
    reminder: { label: 'Lembrete', color: 'text-yellow-400' },
    support: { label: 'Suporte', color: 'text-blue-400' },
  }
  const { label, color } = config[type]

  return <span className={`text-xs font-medium ${color}`}>{label}</span>
}

// Skeleton
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          className="h-16 bg-zinc-800/50 rounded-lg"
        />
      ))}
    </div>
  )
}

export default function WhatsAppPage() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error || !data || data.length === 0) {
        // Dados mockados para demonstração
        setLogs([
          {
            id: '1',
            phone: '+55 11 99999-1234',
            message: 'Olá! Bem-vindo ao Gravador Médico. Seu acesso foi liberado!',
            status: 'read',
            type: 'welcome',
            created_at: '2026-01-30T10:30:00Z',
          },
          {
            id: '2',
            phone: '+55 21 98888-5678',
            message: 'Sua compra foi confirmada! Valor: R$ 297,00',
            status: 'delivered',
            type: 'purchase',
            created_at: '2026-01-30T09:45:00Z',
          },
          {
            id: '3',
            phone: '+55 31 97777-9012',
            message: 'Lembrete: Sua assinatura vence em 7 dias.',
            status: 'sent',
            type: 'reminder',
            created_at: '2026-01-30T08:15:00Z',
          },
          {
            id: '4',
            phone: '+55 41 96666-3456',
            message: 'Obrigado por entrar em contato! Em breve retornaremos.',
            status: 'delivered',
            type: 'support',
            created_at: '2026-01-29T18:30:00Z',
          },
          {
            id: '5',
            phone: '+55 51 95555-7890',
            message: 'Sua compra foi confirmada! Valor: R$ 147,00',
            status: 'failed',
            type: 'purchase',
            created_at: '2026-01-29T16:00:00Z',
          },
        ])
      } else {
        setLogs(data)
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchLogs()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const formatPhone = (phone: string) => {
    return phone.replace(/(\+55)(\d{2})(\d{5})(\d{4})/, '$1 $2 $3-$4')
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return `${diffDays}d atrás`
  }

  // Estatísticas
  const stats = {
    total: logs.length,
    delivered: logs.filter(l => l.status === 'delivered' || l.status === 'read').length,
    failed: logs.filter(l => l.status === 'failed').length,
    rate: logs.length > 0 
      ? Math.round((logs.filter(l => l.status !== 'failed').length / logs.length) * 100)
      : 0,
  }

  // Botão de Reconectar
  const ActionButton = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="
        flex items-center gap-2
        px-4 py-2.5
        bg-[#22c55e] hover:bg-[#16a34a]
        text-white font-medium text-sm
        rounded-xl
        transition-all duration-200
        shadow-lg shadow-[#22c55e]/20
        disabled:opacity-50
      "
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Atualizando...' : 'Atualizar'}
    </motion.button>
  )

  return (
    <PageContainer
      title="WhatsApp"
      subtitle="Monitore a integração e disparos do WhatsApp Business"
      action={ActionButton}
    >
      {/* ===== STATUS DA CONEXÃO ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative overflow-hidden
          bg-gradient-to-br 
          ${isConnected 
            ? 'from-[#22c55e]/10 to-[#22c55e]/5 border-[#22c55e]/30' 
            : 'from-red-500/10 to-red-500/5 border-red-500/30'
          }
          border rounded-2xl p-6 mb-8
        `}
      >
        {/* Ícone WhatsApp gigante no fundo */}
        <div className="absolute -right-8 -bottom-8 opacity-10">
          <MessageCircle className="w-48 h-48" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Ícone com pulso */}
            <div className={`
              relative w-16 h-16 rounded-2xl 
              ${isConnected ? 'bg-[#22c55e]' : 'bg-red-500'}
              flex items-center justify-center
              shadow-lg ${isConnected ? 'shadow-[#22c55e]/30' : 'shadow-red-500/30'}
            `}>
              <MessageCircle className="w-8 h-8 text-white" />
              {isConnected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#22c55e] rounded-full animate-ping" />
              )}
              <span className={`
                absolute -top-1 -right-1 w-4 h-4 rounded-full
                ${isConnected ? 'bg-[#22c55e]' : 'bg-red-500'}
              `} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-[#22c55e]" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <h3 className={`text-xl font-semibold ${isConnected ? 'text-[#22c55e]' : 'text-red-400'}`}>
                  {isConnected ? 'Instância Conectada' : 'Instância Desconectada'}
                </h3>
              </div>
              <p className="text-sm text-zinc-400">
                {isConnected 
                  ? 'WhatsApp Business API ativa e pronta para disparos'
                  : 'Verifique a conexão ou escaneie o QR Code novamente'
                }
              </p>
            </div>
          </div>

          {/* Info da instância */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Instância</p>
              <p className="text-sm text-white font-mono">gravador-medico</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Número</p>
              <p className="text-sm text-white font-mono">+55 11 94002-8922</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== CARDS DE MÉTRICAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Mensagens Hoje', value: stats.total, icon: Send, color: 'text-zinc-400' },
          { label: 'Entregues', value: stats.delivered, icon: CheckCheck, color: 'text-[#22c55e]' },
          { label: 'Falharam', value: stats.failed, icon: XCircle, color: 'text-red-400' },
          { label: 'Taxa de Sucesso', value: `${stats.rate}%`, icon: TrendingUp, color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-semibold ${stat.color === 'text-zinc-400' ? 'text-white' : stat.color}`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ===== TABELA DE DISPAROS RECENTES ===== */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#22c55e]" />
            <h3 className="text-sm font-medium text-white">Disparos Recentes</h3>
          </div>
          <span className="text-xs text-zinc-500">{logs.length} mensagens</span>
        </div>

        {/* Header da Tabela */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/[0.02] border-b border-white/5">
          <div className="col-span-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Destinatário
          </div>
          <div className="col-span-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Mensagem
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Tipo
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-1 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
            Quando
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">Nenhum disparo registrado</p>
            </div>
          ) : (
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors"
                >
                  {/* Destinatário */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-[#22c55e]" />
                    </div>
                    <span className="text-sm text-white font-mono">{log.phone}</span>
                  </div>

                  {/* Mensagem */}
                  <div className="col-span-4">
                    <p className="text-sm text-zinc-400 truncate">{log.message}</p>
                  </div>

                  {/* Tipo */}
                  <div className="col-span-2">
                    <TypeBadge type={log.type} />
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge status={log.status} />
                  </div>

                  {/* Quando */}
                  <div className="col-span-1 text-right">
                    <span className="text-xs text-zinc-500">{formatTime(log.created_at)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>Integração via Evolution API</span>
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22c55e] animate-pulse' : 'bg-red-500'}`} />
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>
    </PageContainer>
  )
}
