'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CinematicLoader from './components/CinematicLoader'
import CommandCenter from './components/CommandCenter'
import FloatingInsights from './components/FloatingInsights'

export default function AdminFuturePage() {
  // ========================================
  // STATE: Controla se o sistema está pronto
  // ========================================
  const [isSystemReady, setIsSystemReady] = useState(false)

  return (
    <div className="min-h-screen w-full">
      <AnimatePresence mode="wait">
        {!isSystemReady ? (
          // ========================================
          // CENA 1: O BOOT - Loader Cinematográfico
          // ========================================
          <CinematicLoader 
            key="cinematic-loader"
            onComplete={() => setIsSystemReady(true)} 
          />
        ) : (
          // ========================================
          // CENA 2: O SISTEMA - Dashboard Real
          // ========================================
          <motion.div
            key="dashboard-system"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.1,
              ease: [0.4, 0, 0.2, 1] 
            }}
            className="min-h-screen w-full"
          >
            {/* Command Center - Dashboard Principal */}
            <CommandCenter />
            
            {/* Floating Insights - Orbes de IA */}
            <FloatingInsights />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
