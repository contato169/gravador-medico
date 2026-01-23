// ================================================================
// Modal para corrigir from_me das mensagens manualmente
// ================================================================

'use client'

import { useState, useEffect } from 'react'
import { X, User, Bot } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  from_me: boolean
  timestamp: string
}

interface FixMessagesModalProps {
  remoteJid: string
  onClose: () => void
  onComplete: () => void
}

export default function FixMessagesModal({ remoteJid, onClose, onComplete }: FixMessagesModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [remoteJid])

  async function loadMessages() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('id, content, from_me, timestamp')
        .eq('remote_jid', remoteJid)
        .order('timestamp', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      alert('Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }

  async function markAs(fromMe: boolean) {
    if (!messages[currentIndex]) return

    try {
      setSaving(true)
      const msg = messages[currentIndex]

      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ from_me: fromMe })
        .eq('id', msg.id)

      if (error) throw error

      // Atualizar localmente
      const updated = [...messages]
      updated[currentIndex] = { ...msg, from_me: fromMe }
      setMessages(updated)

      // Ir para próxima
      if (currentIndex < messages.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Terminou!
        alert('✅ Todas as mensagens foram corrigidas!')
        onComplete()
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const currentMessage = messages[currentIndex]
  const progress = messages.length > 0 ? ((currentIndex + 1) / messages.length * 100).toFixed(0) : 0

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Carregando mensagens...</p>
        </div>
      </div>
    )
  }

  if (!currentMessage) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Corrigir Mensagens</h2>
            <p className="text-sm text-gray-600">
              Mensagem {currentIndex + 1} de {messages.length} ({progress}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              {new Date(currentMessage.timestamp).toLocaleString('pt-BR')}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <p className="text-lg whitespace-pre-wrap break-words">
                {currentMessage.content || '[Mídia/Áudio]'}
              </p>
            </div>
          </div>

          <p className="text-center text-gray-600 mb-6 font-medium">
            Quem enviou esta mensagem?
          </p>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => markAs(false)}
              disabled={saving}
              className="flex-1 py-6 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-2">
                <User className="w-8 h-8 text-gray-700" />
                <span className="text-lg font-bold text-gray-700">CLIENTE</span>
                <span className="text-sm text-gray-500">Mensagem recebida</span>
              </div>
            </button>

            <button
              onClick={() => markAs(true)}
              disabled={saving}
              className="flex-1 py-6 px-4 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-300 hover:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-2">
                <Bot className="w-8 h-8 text-green-700" />
                <span className="text-lg font-bold text-green-700">EU/AUTOMAÇÃO</span>
                <span className="text-sm text-gray-500">Mensagem enviada</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between text-sm text-gray-600">
            <span>💡 Dica: Use as setas do teclado</span>
            <button
              onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="text-blue-600 hover:underline disabled:text-gray-400"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
