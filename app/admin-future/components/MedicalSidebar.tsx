'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  Zap,
  ShoppingBag,
  Users,
  Layers,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  TrendingUp,
  FileText,
  ShoppingCart,
  RefreshCw,
  Mail,
  Package,
  Ticket,
  UserCheck,
  DollarSign,
  Heart,
  Megaphone,
  Webhook,
  MessageSquare,
  MessageCircle,
  Cog,
  ScrollText,
  Phone,
} from 'lucide-react'

// Tipos
interface SubMenuItem {
  label: string
  href: string
  icon: React.ElementType
}

interface MenuItem {
  id: string
  label: string
  icon: React.ElementType
  href?: string
  subItems?: SubMenuItem[]
}

// Estrutura completa do menu
const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: LayoutDashboard,
    href: '/admin-future',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart2,
    subItems: [
      { label: 'GA4', href: '/admin-future/analytics/ga4', icon: TrendingUp },
      { label: 'Relatórios', href: '/admin-future/analytics/reports', icon: FileText },
    ],
  },
  {
    id: 'automation',
    label: 'Automação',
    icon: Zap,
    subItems: [
      { label: 'Carrinhos Abandonados', href: '/admin-future/automation/carts', icon: ShoppingCart },
      { label: 'Sala de Recuperação', href: '/admin-future/automation/recovery', icon: RefreshCw },
    ],
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    icon: ShoppingBag,
    subItems: [
      { label: 'Produtos', href: '/admin-future/products', icon: Package },
      { label: 'Cupons', href: '/admin-future/coupons', icon: Ticket },
    ],
  },
  {
    id: 'management',
    label: 'Gestão',
    icon: Users,
    subItems: [
      { label: 'Usuários', href: '/admin-future/users', icon: UserCheck },
      { label: 'Afiliados', href: '/admin-future/affiliates', icon: Heart },
      { label: 'Vendas', href: '/admin-future/sales', icon: DollarSign },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: Layers,
    subItems: [
      { label: 'Lovable', href: '/admin-future/lovable', icon: Heart },
      { label: 'Meta Ads', href: '/admin-future/meta-ads', icon: Megaphone },
      { label: 'Webhooks', href: '/admin-future/webhooks', icon: Webhook },
    ],
  },
  {
    id: 'communication',
    label: 'Comunicação',
    icon: MessageCircle,
    subItems: [
      { label: 'WhatsApp', href: '/admin-future/whatsapp', icon: Phone },
      { label: 'Chat Interno', href: '/admin-future/chat', icon: MessageSquare },
      { label: 'Emails', href: '/admin-future/emails', icon: Mail },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: Settings,
    subItems: [
      { label: 'Configurações', href: '/admin-future/settings', icon: Cog },
      { label: 'Logs', href: '/admin-future/logs', icon: ScrollText },
    ],
  },
]

export default function MedicalSidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [userName, setUserName] = useState('Administrador')
  const [userEmail, setUserEmail] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  // Buscar dados do usuário via API
  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUserName(data.user.name || data.user.email?.split('@')[0] || 'Administrador')
          setUserEmail(data.user.email || '')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Toggle categoria expandida
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Verificar se um link está ativo
  const isActive = (href: string) => pathname === href

  // Verificar se uma categoria tem item ativo
  const categoryHasActiveItem = (item: MenuItem) => {
    if (item.href) return isActive(item.href)
    return item.subItems?.some(sub => isActive(sub.href)) || false
  }

  // Formatar nome do usuário
  const formatUserName = (name: string) => {
    return name.split(' ').slice(0, 2).join(' ')
  }

  // Logout via API
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
    router.push('/portal')
  }

  return (
    <motion.aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col
                 bg-[#050505] border-r border-white/5"
      initial={{ width: 80 }}
      animate={{ width: isExpanded ? 288 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header com Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <motion.div className="flex items-center gap-3 overflow-hidden">
          {/* Logo Icon */}
          <motion.div
            animate={{ 
              boxShadow: isExpanded 
                ? '0 0 20px rgba(34, 197, 94, 0.3)' 
                : '0 0 10px rgba(34, 197, 94, 0.2)'
            }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-500 to-medical-600 
                       flex items-center justify-center flex-shrink-0"
          >
            <span className="text-white font-bold text-lg">G</span>
          </motion.div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="text-white font-bold text-sm tracking-tight">
                  GRAVADOR <span className="text-medical-500">MÉDICO</span>
                </span>
                <span className="text-slate-600 text-[10px] font-mono">ADMIN PANEL</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isItemExpanded = expandedCategories.includes(item.id)
            const isItemActive = categoryHasActiveItem(item)

            return (
              <div key={item.id}>
                {/* Item Principal */}
                {item.href ? (
                  // Link direto (sem sub-items)
                  <Link href={item.href}>
                    <motion.div
                      className={`
                        relative flex items-center gap-3 h-11 px-3 rounded-xl
                        transition-all duration-200 cursor-pointer group
                        ${isItemActive 
                          ? 'bg-white/5 text-medical-500 border-l-2 border-medical-500' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                        }
                      `}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isItemActive ? 'text-medical-500' : ''}`} />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                ) : (
                  // Categoria com sub-items (Accordion)
                  <motion.div
                    className={`
                      relative flex items-center justify-between h-11 px-3 rounded-xl
                      transition-all duration-200 cursor-pointer group
                      ${isItemActive 
                        ? 'bg-white/5 text-medical-500' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }
                    `}
                    onClick={() => isExpanded && toggleCategory(item.id)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isItemActive ? 'text-medical-500' : ''}`} />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && hasSubItems && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {isItemExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Sub Items (Accordion Content) */}
                <AnimatePresence>
                  {hasSubItems && isExpanded && isItemExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 mt-1 space-y-1">
                        {item.subItems?.map((subItem) => {
                          const SubIcon = subItem.icon
                          const isSubActive = isActive(subItem.href)

                          return (
                            <Link key={subItem.href} href={subItem.href}>
                              <motion.div
                                className={`
                                  flex items-center gap-3 h-10 px-3 rounded-lg
                                  transition-all duration-200 cursor-pointer
                                  ${isSubActive 
                                    ? 'bg-medical-500/10 text-medical-500 border-l-2 border-medical-500' 
                                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border-l-2 border-transparent'
                                  }
                                `}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <SubIcon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? 'text-medical-500' : ''}`} />
                                <span className="text-sm whitespace-nowrap">{subItem.label}</span>
                              </motion.div>
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Separator */}
      <div className="mx-4 border-t border-white/5" />

      {/* User Card Footer */}
      <div className="p-3">
        <motion.div
          className={`
            flex items-center gap-3 p-3 rounded-xl
            bg-white/[0.02] border border-white/5
            transition-all duration-200
            ${isExpanded ? 'justify-between' : 'justify-center'}
          `}
        >
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-medical-500/20 to-medical-600/20 
                            border border-medical-500/30 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-medical-500" />
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col overflow-hidden"
                >
                  <span className="text-white text-sm font-medium truncate max-w-[120px]">
                    {formatUserName(userName)}
                  </span>
                  <span className="text-slate-600 text-[10px] font-mono truncate max-w-[120px]">
                    {userEmail || 'admin@gravadormedico.com.br'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout Button */}
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 
                           hover:bg-red-500/10 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Classic Mode Link */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/admin/dashboard">
                <div className="mt-2 flex items-center justify-center gap-2 py-2 
                                text-slate-600 hover:text-slate-400 transition-colors
                                text-xs font-mono cursor-pointer">
                  <ChevronRight className="w-3 h-3 rotate-180" />
                  <span>Modo Clássico</span>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glow indicator when collapsed */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 
                       w-0.5 h-16 rounded-l-full 
                       bg-gradient-to-b from-transparent via-medical-500/30 to-transparent"
          />
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
