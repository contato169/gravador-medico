// ================================================================
// WhatsApp Chat Layout - Container Principal
// ================================================================

'use client'

import { useState } from 'react'
import type { WhatsAppConversation } from '@/lib/types/whatsapp'

interface ChatLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

export default function ChatLayout({ children, sidebar }: ChatLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar de conversas */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
        {sidebar}
      </div>

      {/* Área principal de mensagens */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
