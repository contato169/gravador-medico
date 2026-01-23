import { supabase } from '@/lib/supabase'

// Evolution API Base Configuration
const EVOLUTION_API_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || ''

interface SendMessageParams {
  instanceName: string
  number: string
  text: string
}

interface SendMediaParams {
  instanceName: string
  number: string
  mediaUrl: string
  caption?: string
}

interface SendReactionParams {
  instanceName: string
  remoteJid: string
  messageId: string
  emoji: string
}

interface SendPresenceParams {
  instanceName: string
  number: string
  presence: 'composing' | 'recording' | 'available' | 'unavailable' | string
  delay?: number
}

interface InstancePresenceParams {
  instanceName: string
  presence: 'available' | 'unavailable' | string
}

interface AlwaysOnlineParams {
  instanceName: string
  alwaysOnline?: boolean
}

interface PrivacySettingsParams {
  instanceName: string
  last_seen?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  online?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  profile_photo?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  status?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  readreceipts?: 'all' | 'contacts' | 'contact_blacklist' | 'none'
}

/**
 * Envia mensagem de texto via Evolution API
 */
export async function sendMessage({ instanceName, number, text }: SendMessageParams) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number,
        text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

/**
 * Envia sticker via Evolution API
 */
export async function sendSticker({ instanceName, number, mediaUrl }: SendMediaParams) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendSticker/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number,
        sticker: mediaUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending sticker:', error)
    throw error
  }
}

/**
 * Envia GIF via Evolution API
 */
export async function sendGif({ instanceName, number, mediaUrl, caption }: SendMediaParams) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number,
        mediatype: 'video', // GIFs são enviados como video no WhatsApp
        media: mediaUrl,
        caption: caption || '',
      }),
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending GIF:', error)
    throw error
  }
}

/**
 * Envia reação a uma mensagem via Evolution API
 */
export async function sendReaction({ instanceName, remoteJid, messageId, emoji }: SendReactionParams) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendReaction/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        key: {
          remoteJid,
          fromMe: false,
          id: messageId,
        },
        reaction: emoji,
      }),
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending reaction:', error)
    throw error
  }
}

/**
 * Envia presença (digitando/gravando) para um chat
 */
export async function sendPresence({ instanceName, number, presence, delay }: SendPresenceParams) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/chat/sendPresence/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: number.replace(/@s\.whatsapp\.net$/i, ''),
        presence,
        ...(delay !== undefined ? { delay } : {})
      }),
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending presence:', error)
    throw error
  }
}

/**
 * Define presença global da instância (online/offline)
 */
export async function setInstancePresence({ instanceName, presence }: InstancePresenceParams) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/setPresence/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ presence }),
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error setting instance presence:', error)
    throw error
  }
}

/**
 * Ativa/Desativa Always Online
 */
export async function setAlwaysOnline({ instanceName, alwaysOnline = true }: AlwaysOnlineParams) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/settings/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ alwaysOnline }),
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error setting always online:', error)
    throw error
  }
}

/**
 * Atualiza configurações de privacidade do perfil
 */
export async function updatePrivacySettings({ instanceName, ...settings }: PrivacySettingsParams) {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/profile-settings/update-privacy-settings/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(settings),
      }
    )

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    throw error
  }
}

/**
 * Busca mensagens do Supabase para um chat específico
 */
export async function fetchMessages(chatId: string) {
  try {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('remote_jid', chatId)
      .order('timestamp', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
}

/**
 * Busca contatos/chats do Supabase
 */
export async function fetchContacts() {
  try {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .order('last_message_time', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching contacts:', error)
    throw error
  }
}

/**
 * Atualiza status online da instância
 */
export async function updateInstanceStatus(instanceName: string, isOnline: boolean) {
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('instance_name', instanceName)

    if (error) throw error
  } catch (error) {
    console.error('Error updating instance status:', error)
    throw error
  }
}

/**
 * Marca mensagem como lida
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ read: true })
      .eq('message_id', messageId)

    if (error) throw error
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}
