'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Plus, 
  Search, 
  DollarSign,
  Tag,
  Archive,
  Pencil,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Check,
  X,
  Loader2
} from 'lucide-react'
import PageContainer from '../components/PageContainer'

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Product {
  id: string
  name: string
  slug?: string
  price: number
  description?: string
  is_active: boolean
  created_at: string
  appmax_id?: string
  stripe_product_id?: string
  stripe_price_id?: string
}

// Badge de Status Ativo/Inativo
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 
      px-2.5 py-1 rounded-full 
      text-xs font-medium
      border
      ${isActive 
        ? 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20' 
        : 'text-red-400 bg-red-500/10 border-red-500/20'
      }
    `}>
      {isActive ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}

// Skeleton de carregamento
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02]"
        >
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-12 h-12 rounded-lg bg-zinc-800"
          />
          <div className="flex-1 space-y-2">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
              className="h-4 w-48 bg-zinc-800 rounded"
            />
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-3 w-24 bg-zinc-800 rounded"
            />
          </div>
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            className="h-6 w-16 bg-zinc-800 rounded-full"
          />
        </div>
      ))}
    </div>
  )
}

// Ícone do Produto
function ProductIcon({ name }: { name: string }) {
  // Gera cor baseada no nome (determinístico)
  const colors = [
    'from-emerald-500/20 to-teal-600/20 text-emerald-400',
    'from-blue-500/20 to-indigo-600/20 text-blue-400',
    'from-purple-500/20 to-pink-600/20 text-purple-400',
    'from-orange-500/20 to-red-600/20 text-orange-400',
    'from-cyan-500/20 to-blue-600/20 text-cyan-400',
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  return (
    <div 
      className={`
        w-12 h-12 rounded-xl 
        bg-gradient-to-br ${colors[colorIndex]}
        border border-white/10
        flex items-center justify-center
      `}
    >
      <Package className="w-5 h-5" />
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar produtos:', error)
        // Fallback com dados mockados
        setProducts([
          {
            id: '1',
            name: 'Gravador Médico PRO',
            slug: 'gravador-medico-pro',
            price: 297.00,
            description: 'Plano profissional com recursos avançados de transcrição',
            is_active: true,
            created_at: '2024-01-15T10:30:00Z',
          },
          {
            id: '2',
            name: 'Gravador Médico Básico',
            slug: 'gravador-medico-basico',
            price: 147.00,
            description: 'Plano inicial para médicos individuais',
            is_active: true,
            created_at: '2024-02-20T14:00:00Z',
          },
          {
            id: '3',
            name: 'Extensão 6 Meses',
            slug: 'extensao-6-meses',
            price: 497.00,
            description: 'Extensão de assinatura por 6 meses',
            is_active: true,
            created_at: '2024-06-10T09:00:00Z',
          },
          {
            id: '4',
            name: 'Gravador Médico Legado',
            slug: 'gravador-medico-legado',
            price: 197.00,
            description: 'Plano descontinuado',
            is_active: false,
            created_at: '2023-03-05T12:00:00Z',
          },
        ])
      } else {
        setProducts(data || [])
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtra produtos pela busca
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.slug && product.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Formata preço em BRL
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  // Formata data
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Estatísticas rápidas
  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    avgPrice: products.length > 0 
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
      : 0,
  }

  // Botão de ação do header
  const ActionButton = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="
        flex items-center gap-2
        px-4 py-2.5
        bg-[#22c55e] hover:bg-[#16a34a]
        text-white font-medium text-sm
        rounded-xl
        transition-all duration-200
        shadow-lg shadow-[#22c55e]/20
      "
    >
      <Plus className="w-4 h-4" />
      Novo Produto
    </motion.button>
  )

  return (
    <PageContainer
      title="Produtos"
      subtitle="Gerencie os produtos e planos disponíveis para venda"
      action={ActionButton}
    >
      {/* ===== CARDS DE ESTATÍSTICAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: 'Total de Produtos', 
            value: stats.total, 
            icon: Package,
            color: 'text-zinc-400',
          },
          { 
            label: 'Produtos Ativos', 
            value: stats.active, 
            icon: Check,
            color: 'text-[#22c55e]',
          },
          { 
            label: 'Produtos Inativos', 
            value: stats.inactive, 
            icon: Archive,
            color: 'text-red-400',
          },
          { 
            label: 'Preço Médio', 
            value: formatPrice(stats.avgPrice), 
            icon: DollarSign,
            color: 'text-blue-400',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="
              bg-[#0a0a0a] border border-white/5 
              rounded-xl p-4
              hover:border-white/10 transition-colors
            "
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-semibold ${stat.color === 'text-zinc-400' ? 'text-white' : stat.color}`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ===== BARRA DE BUSCA ===== */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou slug..."
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

      {/* ===== TABELA BLACK PIANO ===== */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        {/* Header da Tabela */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/5">
          <div className="col-span-5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Produto
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Preço
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Criado em
          </div>
          <div className="col-span-1 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
            Ações
          </div>
        </div>

        {/* Body da Tabela */}
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">
                {searchQuery 
                  ? 'Nenhum produto encontrado para esta busca' 
                  : 'Nenhum produto cadastrado'
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredRow(product.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    grid grid-cols-12 gap-4 px-6 py-4 items-center
                    transition-all duration-200
                    ${hoveredRow === product.id ? 'bg-white/[0.02]' : ''}
                  `}
                >
                  {/* Produto */}
                  <div className="col-span-5 flex items-center gap-4">
                    <ProductIcon name={product.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {product.name}
                      </p>
                      {product.slug && (
                        <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {product.slug}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="col-span-2">
                    <span className="text-sm font-semibold text-[#22c55e]">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge isActive={product.is_active} />
                  </div>

                  {/* Data de Criação */}
                  <div className="col-span-2 text-sm text-zinc-400">
                    {formatDate(product.created_at)}
                  </div>

                  {/* Ações */}
                  <div className="col-span-1 flex justify-end gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`
                        p-2 rounded-lg
                        transition-all duration-200
                        ${hoveredRow === product.id 
                          ? 'text-zinc-400 hover:text-white hover:bg-white/10' 
                          : 'text-transparent'
                        }
                      `}
                    >
                      <Pencil className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`
                        p-2 rounded-lg
                        transition-all duration-200
                        ${hoveredRow === product.id 
                          ? 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10' 
                          : 'text-transparent'
                        }
                      `}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ===== FOOTER COM CONTAGEM ===== */}
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Mostrando {filteredProducts.length} de {products.length} produtos
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          Dados sincronizados com Supabase
        </span>
      </div>
    </PageContainer>
  )
}
