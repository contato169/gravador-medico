'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Pencil, 
  Search, 
  UserPlus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react'
import PageContainer from '../components/PageContainer'

// Cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface User {
  id: string
  email: string
  name?: string
  role?: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  last_sign_in_at?: string
}

// Componente de Avatar com iniciais
function UserAvatar({ name, email }: { name?: string; email: string }) {
  const initials = name 
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : email.slice(0, 2).toUpperCase()

  // Gera cor baseada no email (determinístico)
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
  ]
  const colorIndex = email.charCodeAt(0) % colors.length

  return (
    <div 
      className={`
        w-10 h-10 rounded-full 
        bg-gradient-to-br ${colors[colorIndex]}
        flex items-center justify-center
        text-white text-sm font-semibold
        shadow-lg
      `}
    >
      {initials}
    </div>
  )
}

// Componente de Badge de Status
function StatusBadge({ status }: { status: 'active' | 'inactive' | 'pending' }) {
  const config = {
    active: {
      label: 'Ativo',
      classes: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20',
    },
    inactive: {
      label: 'Inativo',
      classes: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    },
    pending: {
      label: 'Pendente',
      classes: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    },
  }

  const { label, classes } = config[status]

  return (
    <span className={`
      inline-flex items-center gap-1.5 
      px-2.5 py-1 rounded-full 
      text-xs font-medium
      border
      ${classes}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'active' ? 'bg-[#22c55e] animate-pulse' : 
        status === 'pending' ? 'bg-yellow-500' : 'bg-zinc-500'
      }`} />
      {label}
    </span>
  )
}

// Componente de Badge de Role
function RoleBadge({ role }: { role?: string }) {
  const isAdmin = role === 'admin' || role === 'superadmin'
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 
      px-2.5 py-1 rounded-full 
      text-xs font-medium
      border
      ${isAdmin 
        ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' 
        : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
      }
    `}>
      {isAdmin ? (
        <ShieldCheck className="w-3 h-3" />
      ) : (
        <Shield className="w-3 h-3" />
      )}
      {role || 'user'}
    </span>
  )
}

// Skeleton para loading
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
            className="w-10 h-10 rounded-full bg-zinc-800"
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
              className="h-3 w-32 bg-zinc-800 rounded"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Tenta buscar da tabela identities ou admin_users
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar usuários:', error)
        // Fallback: dados mockados para demonstração
        setUsers([
          {
            id: '1',
            email: 'contato@helciomattos.com.br',
            name: 'Helcio Mattos',
            role: 'superadmin',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z',
            last_sign_in_at: '2026-01-30T08:45:00Z',
          },
          {
            id: '2',
            email: 'weverton@gravadormedico.com',
            name: 'Weverton Silva',
            role: 'admin',
            status: 'active',
            created_at: '2024-06-20T14:00:00Z',
            last_sign_in_at: '2026-01-29T16:30:00Z',
          },
          {
            id: '3',
            email: 'suporte@gravadormedico.com',
            name: 'Equipe Suporte',
            role: 'support',
            status: 'active',
            created_at: '2025-03-10T09:00:00Z',
            last_sign_in_at: '2026-01-28T11:00:00Z',
          },
          {
            id: '4',
            email: 'novo@gravadormedico.com',
            name: 'Novo Usuário',
            role: 'user',
            status: 'pending',
            created_at: '2026-01-25T10:00:00Z',
          },
        ])
      } else {
        // Mapeia dados reais
        const mappedUsers: User[] = (data || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name || u.full_name,
          role: u.role,
          status: (u.is_active !== false ? 'active' : 'inactive') as 'active' | 'inactive' | 'pending',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
        }))
        setUsers(mappedUsers)
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtra usuários pela busca
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Formata data
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
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
      <UserPlus className="w-4 h-4" />
      Novo Usuário
    </motion.button>
  )

  return (
    <PageContainer
      title="Usuários"
      subtitle="Gerencie os usuários com acesso ao painel administrativo"
      action={ActionButton}
    >
      {/* ===== BARRA DE BUSCA ===== */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou email..."
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
          <div className="col-span-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Usuário
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Função
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Último Acesso
          </div>
          <div className="col-span-2 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">
            Ações
          </div>
        </div>

        {/* Body da Tabela */}
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">
                {searchQuery 
                  ? 'Nenhum usuário encontrado para esta busca' 
                  : 'Nenhum usuário cadastrado'
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredRow(user.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    grid grid-cols-12 gap-4 px-6 py-4 items-center
                    transition-all duration-200
                    ${hoveredRow === user.id ? 'bg-white/[0.02]' : ''}
                  `}
                >
                  {/* Coluna: Usuário */}
                  <div className="col-span-4 flex items-center gap-3">
                    <UserAvatar name={user.name} email={user.email} />
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {user.name || 'Sem nome'}
                      </p>
                      <p className="text-zinc-500 text-sm truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Coluna: Função */}
                  <div className="col-span-2">
                    <RoleBadge role={user.role} />
                  </div>

                  {/* Coluna: Status */}
                  <div className="col-span-2">
                    <StatusBadge status={user.status} />
                  </div>

                  {/* Coluna: Último Acesso */}
                  <div className="col-span-2">
                    <span className="text-zinc-400 text-sm flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      {formatDate(user.last_sign_in_at)}
                    </span>
                  </div>

                  {/* Coluna: Ações */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <AnimatePresence>
                      {hoveredRow === user.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center gap-1"
                        >
                          <button 
                            className="
                              p-2 rounded-lg
                              text-zinc-500 hover:text-[#22c55e]
                              hover:bg-[#22c55e]/10
                              transition-all duration-200
                            "
                            title="Editar usuário"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            className="
                              p-2 rounded-lg
                              text-zinc-500 hover:text-white
                              hover:bg-white/10
                              transition-all duration-200
                            "
                            title="Mais opções"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer da Tabela */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <p className="text-zinc-600 text-xs">
              Exibindo <span className="text-zinc-400">{filteredUsers.length}</span> de{' '}
              <span className="text-zinc-400">{users.length}</span> usuários
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
