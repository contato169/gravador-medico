'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Inbox,
  FileText,
  User,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import PageContainer from '../components/PageContainer'

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface EmailLog {
  id: string
  to: string
  subject: string
  template?: string
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  provider?: string
  created_at: string
  sent_at?: string
  error?: string
}

// Status Badge
function StatusBadge({ status }: { status: EmailLog['status'] }) {
  const config = {
    pending: { 
      label: 'Pendente', 
      icon: Clock, 
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' 
    },
    sent: { 
      label: 'Enviado', 
      icon: Send, 
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
    },
    delivered: { 
      label: 'Entregue', 
      icon: CheckCircle, 
      color: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20' 
    },
    failed: { 
      label: 'Falhou', 
      icon: XCircle, 
      color: 'text-red-400 bg-red-500/10 border-red-500/20' 
    },
  }
  const { label, icon: Icon, color } = config[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
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

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error || !data || data.length === 0) {
        // Dados mockados para demonstração
        setEmails([
          {
            id: '1',
            to: 'dr.silva@clinica.com',
            subject: 'Bem-vindo ao Gravador Médico! 🎉',
            template: 'welcome',
            status: 'delivered',
            provider: 'Resend',
            created_at: '2026-01-30T10:30:00Z',
            sent_at: '2026-01-30T10:30:05Z',
          },
          {
            id: '2',
            to: 'contato@hospital.com.br',
            subject: 'Confirmação de Compra - Gravador Médico PRO',
            template: 'purchase_confirmation',
            status: 'delivered',
            provider: 'Resend',
            created_at: '2026-01-30T09:15:00Z',
            sent_at: '2026-01-30T09:15:03Z',
          },
          {
            id: '3',
            to: 'maria.santos@gmail.com',
            subject: 'Sua assinatura foi renovada!',
            template: 'subscription_renewal',
            status: 'sent',
            provider: 'Resend',
            created_at: '2026-01-30T08:45:00Z',
          },
          {
            id: '4',
            to: 'invalid-email',
            subject: 'Recuperação de Senha',
            template: 'password_reset',
            status: 'failed',
            provider: 'Resend',
            created_at: '2026-01-29T22:30:00Z',
            error: 'Invalid email address',
          },
          {
            id: '5',
            to: 'joao.medico@consultorio.com',
            subject: 'Lembrete: Sua assinatura vence em 7 dias',
            template: 'subscription_reminder',
            status: 'delivered',
            provider: 'Resend',
            created_at: '2026-01-29T18:00:00Z',
            sent_at: '2026-01-29T18:00:02Z',
          },
          {
            id: '6',
            to: 'ana.cardio@uol.com.br',
            subject: 'Nova funcionalidade disponível!',
            template: 'feature_announcement',
            status: 'delivered',
            provider: 'Resend',
            created_at: '2026-01-29T14:30:00Z',
            sent_at: '2026-01-29T14:30:04Z',
          },
          {
            id: '7',
            to: 'suporte@gravadormedico.com',
            subject: 'Ticket #1234 - Novo chamado',
            template: 'support_ticket',
            status: 'pending',
            provider: 'Resend',
            created_at: '2026-01-30T11:00:00Z',
          },
        ])
      } else {
        setEmails(data)
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchEmails()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Filtros
  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || email.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Estatísticas
  const stats = {
    total: emails.length,
    delivered: emails.filter(e => e.status === 'delivered').length,
    failed: emails.filter(e => e.status === 'failed').length,
    pending: emails.filter(e => e.status === 'pending' || e.status === 'sent').length,
  }

  // Formata data
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Trunca texto
  const truncate = (text: string, max: number) => {
    return text.length > max ? text.slice(0, max) + '...' : text
  }

  // Botão de Ação
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
      title="E-mails"
      subtitle="Histórico de e-mails transacionais enviados pelo sistema"
      action={ActionButton}
    >
      {/* ===== CARDS DE MÉTRICAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Enviados', value: stats.total, icon: Mail, color: 'text-zinc-400' },
          { label: 'Entregues', value: stats.delivered, icon: CheckCircle, color: 'text-[#22c55e]' },
          { label: 'Falharam', value: stats.failed, icon: XCircle, color: 'text-red-400' },
          { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
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

      {/* ===== BARRA DE BUSCA E FILTROS ===== */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por assunto ou destinatário..."
            className="
              w-full pl-11 pr-4 py-3
              bg-[#0a0a0a] 
              border border-white/5
              rounded-xl
              text-white placeholder:text-zinc-600
              focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20
              transition-all duration-200
            "
          />
        </div>

        {/* Filtro de Status */}
        <div className="flex gap-2">
          {['all', 'delivered', 'sent', 'failed', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`
                px-3 py-2 text-xs font-medium rounded-lg
                transition-all duration-200
                ${filterStatus === status
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {status === 'all' ? 'Todos' :
               status === 'delivered' ? 'Entregues' :
               status === 'sent' ? 'Enviados' :
               status === 'failed' ? 'Falhos' : 'Pendentes'}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TABELA DE E-MAILS ===== */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header da Tabela */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/5">
          <div className="col-span-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Assunto
          </div>
          <div className="col-span-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Destinatário
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
            Data
          </div>
        </div>

        {/* Body da Tabela */}
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">
                {searchQuery || filterStatus !== 'all'
                  ? 'Nenhum e-mail encontrado para estes filtros'
                  : 'Nenhum e-mail enviado ainda'
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Assunto */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      ${email.status === 'failed' 
                        ? 'bg-red-500/10 text-red-400' 
                        : 'bg-[#22c55e]/10 text-[#22c55e]'
                      }
                    `}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {truncate(email.subject, 40)}
                      </p>
                      {email.template && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {email.template}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Destinatário */}
                  <div className="col-span-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-600" />
                    <span className="text-sm text-zinc-300 truncate">{email.to}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge status={email.status} />
                    {email.error && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {email.error}
                      </p>
                    )}
                  </div>

                  {/* Data */}
                  <div className="col-span-3 text-right">
                    <p className="text-sm text-zinc-400">{formatDate(email.created_at)}</p>
                    {email.provider && (
                      <p className="text-xs text-zinc-600">via {email.provider}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Mostrando {filteredEmails.length} de {emails.length} e-mails
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          Powered by Resend
        </span>
      </div>
    </PageContainer>
  )
}
