// ================================================================
// Contact List - Lista lateral de conversas (estilo WhatsApp)
// ================================================================

'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { WhatsAppConversation } from '@/lib/types/whatsapp'

interface ContactListProps {
  conversations: WhatsAppConversation[]
  selectedRemoteJid?: string
  onSelectConversation: (remoteJid: string) => void
}

export default function ContactList({
  conversations,
  selectedRemoteJid,
  onSelectConversation
}: ContactListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <p className="text-sm">Nenhuma conversa encontrada</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {conversations.map((conversation) => (
            <ContactItem
              key={conversation.remote_jid}
              conversation={conversation}
              isSelected={conversation.remote_jid === selectedRemoteJid}
              onClick={() => onSelectConversation(conversation.remote_jid)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ContactItem({
  conversation,
  isSelected,
  onClick
}: {
  conversation: WhatsAppConversation
  isSelected: boolean
  onClick: () => void
}) {
  const displayName = conversation.name || conversation.push_name || formatPhoneNumber(conversation.remote_jid)
  
  const lastMessageTime = conversation.last_message_timestamp
    ? formatDistanceToNow(new Date(conversation.last_message_timestamp), {
        addSuffix: false,
        locale: ptBR
      })
    : ''

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 hover:bg-gray-700 transition-colors text-left ${
        isSelected ? 'bg-gray-700' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {conversation.profile_picture_url ? (
            <img
              src={conversation.profile_picture_url}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
              {displayName[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white truncate">
              {displayName}
            </h3>
            {lastMessageTime && (
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                {lastMessageTime}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400 truncate">
              {conversation.last_message_from_me && (
                <span className="text-gray-500 mr-1">Você: </span>
              )}
              {conversation.last_message_content || 'Sem mensagens'}
            </p>

            {conversation.unread_count > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/**
 * Formata número de telefone do remoteJid
 * Ex: 5521999999999@s.whatsapp.net → +55 21 99999-9999
 */
function formatPhoneNumber(remoteJid: string): string {
  const number = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
  
  if (number.length === 13 && number.startsWith('55')) {
    // Brasileiro: 5521999999999 → +55 21 99999-9999
    return `+55 ${number.slice(2, 4)} ${number.slice(4, 9)}-${number.slice(9)}`
  }
  
  return `+${number}`
}
