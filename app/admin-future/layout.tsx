'use client'

import { Inter, JetBrains_Mono } from 'next/font/google'
import { ReactNode } from 'react'
import MedicalSidebar from './components/MedicalSidebar'

// Fonte principal para UI
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Fonte monospace para dados técnicos e terminais
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})


interface AdminFutureLayoutProps {
  children: ReactNode
}

// Proteção de autenticação é feita pelo middleware.ts
// Redireciona automaticamente para /portal se não logado
export default function AdminFutureLayout({ children }: AdminFutureLayoutProps) {
  return (
    <div
      className={`
        ${inter.variable} 
        ${jetbrainsMono.variable} 
        font-sans
        min-h-screen 
        w-full 
        bg-[#050505]
        text-white
        antialiased
        overflow-x-hidden
        selection:bg-[#22c55e]
        selection:text-black
      `}
      style={{
        // Black Piano Premium - gradiente de profundidade
        background: `
          radial-gradient(ellipse at top, rgba(10, 10, 10, 1) 0%, rgba(5, 5, 5, 1) 50%),
          linear-gradient(to bottom, #050505 0%, #0a0a0a 100%)
        `,
      }}
    >
      {/* Sidebar de navegação */}
      <MedicalSidebar />

      {/* Container principal - imersão total sem headers/sidebars externos */}
      <main className="relative min-h-screen w-full pl-20 transition-all duration-300 ease-in-out">
        {/* Grid sutil de fundo estilo Black Piano Premium */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Conteúdo do painel */}
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
