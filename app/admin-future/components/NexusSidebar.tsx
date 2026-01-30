'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  Package, 
  ShoppingCart, 
  Settings,
  ChevronLeft,
  Sparkles,
  LogOut
} from 'lucide-react'

interface MenuItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin-future' },
  { icon: Users, label: 'Usuários', href: '/admin/users' },
  { icon: Mail, label: 'E-mails', href: '/admin/emails' },
  { icon: Package, label: 'Produtos', href: '/admin/products' },
  { icon: ShoppingCart, label: 'Vendas', href: '/admin/sales' },
  { icon: Settings, label: 'Configurações', href: '/admin/settings' },
]

export default function NexusSidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <motion.aside
      className="fixed left-0 top-0 h-full z-50
                 bg-black/40 backdrop-blur-xl 
                 border-r border-white/10
                 flex flex-col"
      initial={{ width: 64 }}
      animate={{ width: isExpanded ? 256 : 64 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <motion.div
          className="flex items-center gap-3 overflow-hidden"
          animate={{ width: isExpanded ? 'auto' : 32 }}
        >
          <motion.div
            animate={{ 
              boxShadow: [
                '0 0 10px rgba(6, 182, 212, 0.3)',
                '0 0 20px rgba(6, 182, 212, 0.5)',
                '0 0 10px rgba(6, 182, 212, 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 
                       flex items-center justify-center flex-shrink-0"
          >
            <span className="text-white font-bold text-sm">N</span>
          </motion.div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <span className="text-white font-bold text-sm tracking-tight">NEXUS</span>
                <span className="text-slate-500 text-[10px] font-mono">Admin v1.0</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`
                  relative flex items-center gap-3 
                  h-11 px-3 rounded-xl
                  transition-colors duration-200
                  group cursor-pointer
                  ${isActive 
                    ? 'bg-cyan-500/10 text-cyan-400' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                `}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Indicador ativo */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 
                               w-1 h-6 rounded-r-full bg-cyan-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Ícone */}
                <div className={`
                  flex-shrink-0 w-6 h-6 flex items-center justify-center
                  ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Label */}
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

                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      absolute right-2 
                      min-w-5 h-5 px-1.5 
                      flex items-center justify-center
                      text-xs font-bold rounded-full
                      bg-red-500 text-white
                      ${!isExpanded && 'right-1 top-1 min-w-4 h-4 text-[10px]'}
                    `}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Separator */}
      <div className="mx-4 border-t border-white/5" />

      {/* Footer Actions */}
      <div className="py-4 px-2 space-y-1">
        {/* Status IA */}
        <motion.div
          className="flex items-center gap-3 h-11 px-3 rounded-xl
                     bg-violet-500/10 text-violet-400"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center relative">
            <Sparkles className="w-5 h-5" />
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400"
            />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
              >
                <span className="text-xs font-medium">IA Ativa</span>
                <span className="text-[10px] text-violet-500/70 font-mono">Monitorando</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Voltar ao Clássico */}
        <Link href="/admin">
          <motion.div
            className="flex items-center gap-3 h-11 px-3 rounded-xl
                       text-slate-500 hover:bg-white/5 hover:text-slate-300
                       transition-colors duration-200 cursor-pointer"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Voltar ao Clássico
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>

        {/* Logout */}
        <motion.div
          className="flex items-center gap-3 h-11 px-3 rounded-xl
                     text-red-500/70 hover:bg-red-500/10 hover:text-red-400
                     transition-colors duration-200 cursor-pointer"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Expand indicator */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 
                       w-1 h-12 rounded-l-full 
                       bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"
          />
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
