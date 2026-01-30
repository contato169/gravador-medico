'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AudioWaveform, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

export default function PortalLoginPage() {
  const router = useRouter()
  
  // Estados do formulário
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handler do login - usa a API existente
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      // Sucesso - redireciona para admin-future com delay para garantir cookie
      setTimeout(() => {
        window.location.href = '/admin-future'
      }, 100)
    } catch (err: any) {
      setError(err?.message || 'Erro ao fazer login. Verifique suas credenciais.')
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at center, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at top right, rgba(34, 197, 94, 0.04) 0%, transparent 40%),
          #050505
        `,
      }}
    >
      {/* Grid de fundo sutil */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Cartão Central de Login */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div 
          className="
            bg-black/40 backdrop-blur-xl 
            border border-white/10 
            rounded-2xl 
            p-8 
            shadow-2xl
          "
        >
          {/* Logo Pulsante */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(34, 197, 94, 0.3)',
                  '0 0 40px rgba(34, 197, 94, 0.5)',
                  '0 0 20px rgba(34, 197, 94, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="
                w-16 h-16 rounded-2xl 
                bg-gradient-to-br from-[#22c55e] to-[#16a34a]
                flex items-center justify-center
                mb-4
              "
            >
              <AudioWaveform className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Gravador Médico
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Painel Administrativo
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-zinc-400 font-medium">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="
                    w-full pl-11 pr-4 py-3
                    bg-black/60 
                    border border-zinc-800
                    rounded-xl
                    text-white placeholder:text-zinc-600
                    focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/30
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-zinc-400 font-medium">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="
                    w-full pl-11 pr-4 py-3
                    bg-black/60 
                    border border-zinc-800
                    rounded-xl
                    text-white placeholder:text-zinc-600
                    focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/30
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Checkbox Lembrar-me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="
                  w-4 h-4 rounded
                  bg-black/60 border-zinc-700
                  text-[#22c55e]
                  focus:ring-[#22c55e]/30 focus:ring-offset-0
                  cursor-pointer
                "
              />
              <label htmlFor="rememberMe" className="text-sm text-zinc-500 cursor-pointer">
                Lembrar-me por 30 dias
              </label>
            </div>

            {/* Mensagem de Erro */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="
                    flex items-center gap-2 p-3
                    bg-red-500/10 border border-red-500/20
                    rounded-xl text-red-400 text-sm
                  "
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão de Login */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className={`
                w-full py-3.5 rounded-xl
                font-semibold text-white
                transition-all duration-200
                flex items-center justify-center gap-2
                ${isLoading 
                  ? 'bg-[#22c55e]/50 cursor-not-allowed' 
                  : 'bg-[#22c55e] hover:bg-[#16a34a] hover:shadow-lg hover:shadow-[#22c55e]/20'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Entrar no Sistema</span>
              )}
            </motion.button>
          </form>

          {/* Divisor */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-zinc-600">
              Acesso restrito a usuários autorizados
            </p>
          </div>
        </div>
      </motion.div>

      {/* Rodapé */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-6 text-center"
      >
        <p className="text-xs text-zinc-600 font-mono tracking-wider">
          SISTEMA GRAVADOR MÉDICO OS — ACESSO RESTRITO
        </p>
      </motion.footer>

      {/* Efeito de brilho no canto */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.05) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
