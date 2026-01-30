'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { AudioWaveform, Shield, CheckCircle2 } from 'lucide-react'

interface CinematicLoaderProps {
  onComplete: () => void
}

type LoadingPhase = 'authenticating' | 'loading' | 'welcome' | 'entering'

export default function CinematicLoader({ onComplete }: CinematicLoaderProps) {
  const [phase, setPhase] = useState<LoadingPhase>('authenticating')
  const [userName, setUserName] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)

  const fetchUser = useCallback(async () => {
    try {
      // Buscar usuário via API de autenticação existente
      const response = await fetch('/api/auth/me')
      
      if (response.ok) {
        const data = await response.json()
        if (data.user?.name) {
          setUserName(data.user.name)
        } else if (data.user?.email) {
          // Fallback: primeiro nome do email
          const nameFromEmail = data.user.email.split('@')[0]
          setUserName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1))
        } else {
          setUserName('Administrador')
        }
      } else {
        setUserName('Administrador')
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      setUserName('Administrador')
    }
  }, [])

  useEffect(() => {
    // Fase 1: Autenticando (0-1.5s)
    fetchUser()
    
    const phase1 = setTimeout(() => {
      setPhase('loading')
      setProgress(30)
    }, 1500)

    // Fase 2: Carregando (1.5s-3s)
    const phase2 = setTimeout(() => {
      setPhase('welcome')
      setProgress(70)
    }, 3000)

    // Fase 3: Bem-vindo (3s-4.5s)
    const phase3 = setTimeout(() => {
      setPhase('entering')
      setProgress(100)
    }, 4500)

    // Fase 4: Entrar (4.5s-5.5s)
    const complete = setTimeout(() => {
      onComplete()
    }, 5500)

    return () => {
      clearTimeout(phase1)
      clearTimeout(phase2)
      clearTimeout(phase3)
      clearTimeout(complete)
    }
  }, [fetchUser, onComplete])

  // Formatar nome do usuário
  const formatUserName = (name: string) => {
    // Capitalizar primeira letra de cada palavra
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .slice(0, 2) // Pegar só os dois primeiros nomes
      .join(' ')
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-piano-black flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.5,
        transition: { 
          duration: 0.8, 
          ease: [0.4, 0, 0.2, 1] 
        }
      }}
    >
      {/* Efeito de glow verde pulsante no fundo */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at center, rgba(34, 197, 94, 0.03) 0%, transparent 50%)',
            'radial-gradient(circle at center, rgba(34, 197, 94, 0.08) 0%, transparent 60%)',
            'radial-gradient(circle at center, rgba(34, 197, 94, 0.03) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Grid sutil de fundo */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Ícone do Gravador Médico */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative mb-8"
        >
          {/* Círculo de fundo com glow */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 30px rgba(34, 197, 94, 0.2)',
                '0 0 60px rgba(34, 197, 94, 0.4)',
                '0 0 30px rgba(34, 197, 94, 0.2)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-full bg-piano-surface border border-medical-500/30 
                       flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <AudioWaveform className="w-12 h-12 text-medical-500" />
            </motion.div>
          </motion.div>

          {/* Badge de status */}
          {phase === 'welcome' || phase === 'entering' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full 
                         bg-medical-500 flex items-center justify-center
                         shadow-piano-glow"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
            </motion.div>
          ) : null}
        </motion.div>

        {/* Logo Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="text-white">GRAVADOR </span>
            <span className="text-medical-500">MÉDICO</span>
            <span className="text-slate-500 text-lg ml-2 font-normal">OS</span>
          </h1>
          <p className="text-slate-600 text-sm font-mono mt-2 tracking-wider">
            ADMIN INTELLIGENCE SYSTEM
          </p>
        </motion.div>

        {/* Status Text - Muda conforme a fase */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="h-16 flex flex-col items-center justify-center mb-8"
        >
          {phase === 'authenticating' && (
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-500 animate-pulse" />
              <span className="text-slate-400 font-mono text-sm">
                Identificando usuário...
              </span>
            </div>
          )}

          {phase === 'loading' && (
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-medical-500/30 border-t-medical-500 rounded-full"
              />
              <span className="text-slate-400 font-mono text-sm">
                Preparando ambiente seguro...
              </span>
            </div>
          )}

          {phase === 'welcome' && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <p className="text-slate-500 text-sm mb-1">Bem-vindo(a)</p>
              <p className="text-white text-xl font-semibold">
                Dr(a). {formatUserName(userName)}
              </p>
            </motion.div>
          )}

          {phase === 'entering' && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <span className="text-medical-500 font-mono text-sm">
                Entrando no sistema...
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Barra de Progresso */}
        <div className="w-64 md:w-80">
          <div className="flex justify-between text-xs text-slate-600 font-mono mb-2">
            <span>INICIALIZANDO</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-piano-surface rounded-full overflow-hidden border border-piano-border">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Decorações de canto */}
      <div className="absolute top-6 left-6 text-slate-800 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-medical-500/50 animate-pulse" />
          <span>SECURE CONNECTION</span>
        </div>
      </div>
      
      <div className="absolute bottom-6 right-6 text-slate-800 font-mono text-xs text-right">
        <div>v2.0.0 | NEXUS CORE</div>
        <div className="text-medical-600">● ENCRYPTED</div>
      </div>

      {/* Linha decorativa inferior */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.3) 50%, transparent 100%)',
        }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  )
}
