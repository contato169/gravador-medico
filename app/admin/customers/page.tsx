'use client'

import { useState, useEffect } from 'react'
import { Users, Crown, Search, TrendingUp, DollarSign, Calendar, Phone, FileText, ArrowUpDown, ChevronDown, Info } from 'lucide-react'
import { formatBRDateTime } from '@/lib/date-utils'

interface Customer {
  email: string
  name: string
  phone: string
  cpf: string
  total_orders: number
  paid_orders: number
  ltv: number
  aov: number
  segment: 'VIP' | 'New' | 'Dormant' | 'Churn Risk' | 'Regular'
  engagement_score: number
  first_purchase: string
  last_purchase: string
}

type SortField = 'first_purchase' | 'ltv' | 'last_purchase' | 'engagement_score'
type SortOrder = 'asc' | 'desc'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('first_purchase')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [stats, setStats] = useState({ total_customers: 0, vip_count: 0, total_ltv: 0, avg_ltv: 0 })

  useEffect(() => {
    fetchCustomers()
  }, [search, sortBy, sortOrder])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ 
        search, 
        limit: '50',
        sortBy,
        sortOrder
      })
      const res = await fetch(`/api/admin/customers?${params}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setCustomers(data.customers || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) => {
    if (!val) return 'R$ 0'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const formatCpf = (cpf: string) => {
    if (!cpf) return '—'
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return cpf
  }

  const formatPhone = (phone: string) => {
    if (!phone) return '—'
    const cleaned = phone.replace(/\D/g, '')
    
    // Telefone com código do país (55) + DDD + número (13 dígitos)
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
    }
    // Telefone com código do país (55) + DDD + número fixo (12 dígitos)
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4')
    }
    // Telefone sem código do país - celular (11 dígitos)
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3')
    }
    // Telefone sem código do país - fixo (10 dígitos)
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '+55 ($1) $2-$3')
    }
    return phone
  }

  const getSegmentColor = (seg: string) => {
    const colors: Record<string, string> = {
      'VIP': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'New': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Dormant': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'Churn Risk': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Regular': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
    return colors[seg] || colors.Regular
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-blue-500 to-indigo-600'
    if (score >= 40) return 'from-yellow-500 to-orange-500'
    if (score >= 20) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-red-700'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente'
    if (score >= 60) return 'Bom'
    if (score >= 40) return 'Médio'
    if (score >= 20) return 'Baixo'
    return 'Muito Baixo'
  }

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const SortButton = ({ field, label }: { field: SortField, label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-sm font-semibold pb-3 hover:text-white transition-colors ${
        sortBy === field ? 'text-brand-400' : 'text-gray-400'
      }`}
    >
      {label}
      {sortBy === field && (
        <ChevronDown className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-400" />
          Clientes
        </h1>
        <p className="text-gray-400 mt-1">Mini-CRM: Identifique VIPs e acompanhe LTV</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Clientes</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total_customers}</p>
            </div>
            <Users className="w-10 h-10 text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/30 to-amber-800/20 border border-yellow-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">VIPs</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.vip_count}</p>
            </div>
            <Crown className="w-10 h-10 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 border border-green-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">LTV Total</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.total_ltv)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/30 to-indigo-800/20 border border-blue-700/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">LTV Médio</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.avg_ltv)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="px-3 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white text-sm"
            >
              <option value="first_purchase">Data de Entrada</option>
              <option value="last_purchase">Última Compra</option>
              <option value="ltv">LTV</option>
              <option value="engagement_score">Engajamento</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title={sortOrder === 'asc' ? 'Mais antigo primeiro' : 'Mais recente primeiro'}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhum cliente encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-sm font-semibold pb-3">Cliente</th>
                  <th className="text-left text-gray-400 text-sm font-semibold pb-3">Contato</th>
                  <th className="text-left text-gray-400 text-sm font-semibold pb-3">CPF/CNPJ</th>
                  <th className="text-left text-gray-400 text-sm font-semibold pb-3">
                    <SortButton field="first_purchase" label="Entrada" />
                  </th>
                  <th className="text-left text-gray-400 text-sm font-semibold pb-3">Segmento</th>
                  <th className="text-right text-gray-400 text-sm font-semibold pb-3">
                    <SortButton field="ltv" label="LTV" />
                  </th>
                  <th className="text-right text-gray-400 text-sm font-semibold pb-3">Pedidos</th>
                  <th className="text-center text-gray-400 text-sm font-semibold pb-3">
                    <div className="flex items-center justify-center gap-1">
                      <SortButton field="engagement_score" label="Score" />
                      <span title="Passe o mouse sobre o score para ver detalhes">
                        <Info className="w-3 h-3 text-gray-500" />
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email} className="border-b border-gray-800 hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-white">{c.name || 'Sem nome'}</p>
                        <p className="text-sm text-gray-500">{c.email}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-300">{formatPhone(c.phone)}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-300 font-mono">{formatCpf(c.cpf)}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-300">
                          {c.first_purchase ? formatBRDateTime(c.first_purchase) : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSegmentColor(c.segment)}`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-bold text-green-400">{formatCurrency(c.ltv)}</span>
                    </td>
                    <td className="py-4 text-right text-white">
                      {c.paid_orders}/{c.total_orders}
                    </td>
                    <td className="py-4 text-center">
                      <div className="group relative inline-flex items-center justify-center">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getScoreColor(c.engagement_score)} flex items-center justify-center cursor-help`}>
                          <span className="text-white font-bold text-sm">{c.engagement_score}</span>
                        </div>
                        {/* Tooltip - abre para a esquerda */}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-64 whitespace-nowrap">
                          <div className="text-center mb-2">
                            <span className={`text-sm font-bold ${
                              c.engagement_score >= 80 ? 'text-green-400' :
                              c.engagement_score >= 60 ? 'text-blue-400' :
                              c.engagement_score >= 40 ? 'text-yellow-400' :
                              c.engagement_score >= 20 ? 'text-orange-400' : 'text-red-400'
                            }`}>
                              {getScoreLabel(c.engagement_score)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-300 space-y-1">
                            <p className="font-semibold text-white border-b border-gray-700 pb-1 mb-1">📊 Score (0-100)</p>
                            <p className="flex justify-between"><span>🛒 Compras</span><span className="text-gray-400">máx 20</span></p>
                            <p className="flex justify-between"><span>💰 LTV</span><span className="text-gray-400">máx 10</span></p>
                            <p className="flex justify-between"><span>⏰ Recência</span><span className="text-gray-400">máx 10</span></p>
                            <p className="flex justify-between"><span>👁️ Visitas</span><span className="text-gray-400">máx 10</span></p>
                            <p className="flex justify-between"><span>📄 Páginas</span><span className="text-gray-400">máx 10</span></p>
                            <p className="flex justify-between"><span>📱 Meta Pixel</span><span className="text-gray-400">máx 8</span></p>
                            <p className="flex justify-between"><span>🔗 UTM</span><span className="text-gray-400">máx 7</span></p>
                            <p className="flex justify-between"><span>💬 WhatsApp</span><span className="text-gray-400">máx 15</span></p>
                          </div>
                          {/* Seta para a direita */}
                          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1">
                            <div className="border-8 border-transparent border-l-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
