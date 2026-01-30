'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageContainerProps {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
}

export default function PageContainer({ 
  title, 
  subtitle, 
  children, 
  action 
}: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="max-w-7xl mx-auto p-6 md:p-8 pt-8 md:pt-10"
    >
      {/* ===== CABEÇALHO DA PÁGINA ===== */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-zinc-400 text-sm mt-1">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Ação opcional (botão, etc) */}
        {action && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex-shrink-0"
          >
            {action}
          </motion.div>
        )}
      </div>

      {/* Divisória */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="border-b border-white/10 mb-6 origin-left"
      />

      {/* ===== CONTEÚDO DA PÁGINA ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
