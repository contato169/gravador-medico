'use client'

import { useState } from 'react'
import { RefreshCw, CreditCard } from 'lucide-react'
import Image from 'next/image'

interface SyncResult {
  total: number
  created: number
  updated: number
  skipped: number
  errors: number
}

export function SyncMercadoPagoButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch('/api/admin/sync-mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ days: 30 })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao sincronizar')
      }

      setResult(data.results)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 text-white transition-colors disabled:opacity-50"
        title="Sincronizar vendas do Mercado Pago"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 text-blue-400" />
        )}
        <span className="text-sm font-medium">
          {loading ? 'Sincronizando MP...' : 'Sync MP'}
        </span>
      </button>

      {/* Toast de resultado */}
      {result && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-xl min-w-[250px]">
          <div className="text-sm text-white font-semibold mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            Sincronização MP Concluída
          </div>
          <div className="space-y-1 text-xs text-gray-400">
            <p>Total encontrado: <span className="text-white font-medium">{result.total}</span></p>
            <p className="text-green-400">✅ Criados: {result.created}</p>
            <p className="text-yellow-400">🔄 Atualizados: {result.updated}</p>
            <p className="text-gray-400">⏭️ Ignorados: {result.skipped}</p>
            {result.errors > 0 && (
              <p className="text-red-400">❌ Erros: {result.errors}</p>
            )}
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-2 text-xs text-gray-500 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Toast de erro */}
      {error && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-red-900/80 border border-red-700 rounded-xl p-4 shadow-xl min-w-[250px]">
          <div className="text-sm text-red-200 font-semibold mb-1">❌ Erro</div>
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  )
}
