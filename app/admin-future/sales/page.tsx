'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  Download, 
  Search,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import PageContainer from '../components/PageContainer'

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Sale {
  id: string
  customer_email: string
  customer_name?: string
  total_amount: number
  status: string
  created_at: string
  payment_method?: string
  product_name?: string
}

// Badge de Status com cores neon
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string; icon: React.ElementType }> = {
    approved: {
      label: 'Pago',
      classes: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20',
      icon: CheckCircle2,
    },
    paid: {
      label: 'Pago',
      classes: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20',
      icon: CheckCircle2,
    },
    pending: {
      label: 'Pendente',
      classes: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      icon: Clock,
    },
    cancelled: {
      label: 'Cancelado',
      classes: 'text-red-500 bg-red-500/10 border-red-500/20',
      icon: XCircle,
    },
    refunded: {
      label: 'Reembolsado',
      classes: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      icon: AlertCircle,
    },
  }

  const statusConfig = config[status] || config.pending
  const Icon = statusConfig.icon

  return (
    <span className={`
      inline-flex items-center gap-1.5 
      px-2.5 py-1 rounded-full 
      text-xs font-medium
      border
      ${statusConfig.classes}
    `}>
      <Icon className="w-3 h-3" />
      {statusConfig.label}
    </span>
  )
}

// Skeleton loading
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex-1 h-4 bg-zinc-800 rounded"
          />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            className="w-24 h-4 bg-zinc-800 rounded"
          />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="w-20 h-6 bg-zinc-800 rounded-full"
          />
        </div>
      ))}
    </div>
  )
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro ao buscar vendas:', error)
      } else {
        setSales(data || [])
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar vendas
  const filteredSales = sales.filter(sale =>
    sale.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  // Formatar data
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Exportar CSV
  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = [
        ['ID', 'Cliente', 'Email', 'Valor', 'Status', 'Data'].join(','),
        ...sales.map(sale => [
          sale.id,
          sale.customer_name || '-',
          sale.customer_email,
          sale.total_amount,
          sale.status,
          sale.created_at,
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vendas-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } finally {
      setExporting(false)
    }
  }

  // Calcular totais
  const totalRevenue = sales
    .filter(s => s.status === 'approved' || s.status === 'paid')
    .reduce((sum, s) => sum + (s.total_amount || 0), 0)

  // Botão de ação
  const ActionButton = (
    <motion.button
      onClick={handleExport}
      disabled={exporting || sales.length === 0}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="
        flex items-center gap-2
        px-4 py-2.5
        bg-[#0a0a0a] hover:bg-[#111]
        border border-white/10 hover:border-[#22c55e]/30
        text-white font-medium text-sm
        rounded-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Exportar CSV
    </motion.button>
  )

  return (
    <PageContainer
      title="Vendas"
      subtitle={`${sales.length} vendas encontradas • ${formatCurrency(totalRevenue)} em receita aprovada`}
      action={ActionButton}
    >
      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente ou email..."
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
      </div>

      {/* Tabela Black Piano */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/5">
          <div className="col-span-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Cliente
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Valor
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Data
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">
                {searchQuery ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredSales.map((sale, index) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center
                             hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  {/* Cliente */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22c55e]/20 to-emerald-600/20 
                                    border border-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[#22c55e]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-300 font-medium truncate">
                        {sale.customer_name || 'Cliente'}
                      </p>
                      <p className="text-xs text-zinc-600 truncate">
                        {sale.customer_email}
                      </p>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="col-span-2">
                    <span className="text-sm text-white font-semibold">
                      {formatCurrency(sale.total_amount)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge status={sale.status} />
                  </div>

                  {/* Data */}
                  <div className="col-span-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="text-sm text-zinc-400">
                      {formatDate(sale.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {!loading && filteredSales.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <p className="text-zinc-600 text-xs">
              Exibindo <span className="text-zinc-400">{filteredSales.length}</span> de{' '}
              <span className="text-zinc-400">{sales.length}</span> vendas
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
