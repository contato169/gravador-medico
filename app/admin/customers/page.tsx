'use client'

import { useState, useEffect } from 'react'
import { Users, Crown, Search, TrendingUp, DollarSign } from 'lucide-react'

interface Customer {
  email: string
  name: string
  phone: string
  total_orders: number
  paid_orders: number
  ltv: number
  aov: number
  segment: 'VIP' | 'New' | 'Dormant' | 'Churn Risk' | 'Regular'
  engagement_score: number
  last_purchase: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total_customers: 0, vip_count: 0, total_ltv: 0, avg_ltv: 0 })

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, limit: '50' })
      const res = await fetch(`/api/admin/customers?${params}`)
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
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white placeholder:text-gray-500"
          />
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
                  <th className="text-left text-gray-400 text-sm font-semibold pb-3">Segmento</th>
                  <th className="text-right text-gray-400 text-sm font-semibold pb-3">LTV</th>
                  <th className="text-right text-gray-400 text-sm font-semibold pb-3">Pedidos</th>
                  <th className="text-center text-gray-400 text-sm font-semibold pb-3">Score</th>
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
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
                        <span className="text-white font-bold text-sm">{c.engagement_score}</span>
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
