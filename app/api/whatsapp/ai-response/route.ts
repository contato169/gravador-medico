// ================================================================
// EXEMPLO: Integração com IA (GPT-5.2 / Claude)
// ================================================================
// Este arquivo demonstra como criar um endpoint que:
// 1. Lê o histórico de mensagens de um contato
// 2. Envia para uma IA (ex: OpenAI GPT-5.2)
// 3. Retorna uma resposta inteligente
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppMessages } from '@/lib/whatsapp-db'

/**
 * POST /api/whatsapp/ai-response
 * 
 * Body: { remoteJid: '552199999999@s.whatsapp.net' }
 * 
 * Retorna: { response: 'Resposta gerada pela IA' }
 */
export async function POST(request: NextRequest) {
  try {
    const { remoteJid } = await request.json()

    if (!remoteJid) {
      return NextResponse.json({ error: 'remoteJid é obrigatório' }, { status: 400 })
    }

    // 1. Buscar histórico de mensagens (últimas 50)
    const messages = await getWhatsAppMessages(remoteJid, 50)

    // 2. Formatar mensagens para contexto da IA
    const context = messages
      .map(msg => {
        const role = msg.from_me ? 'Você (Atendente)' : 'Cliente'
        return `${role}: ${msg.content}`
      })
      .join('\n')

    // 3. Prompt para a IA
    const prompt = `
Você é um assistente de atendimento ao cliente de uma empresa de tecnologia médica.

Histórico da conversa:
${context}

Com base no histórico acima, gere uma resposta profissional e útil para o cliente.
Seja empático, objetivo e proponha soluções.
    `.trim()

    // 4. Chamar API da OpenAI (ou outra IA)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de atendimento profissional e empático.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 500
      })
    })

    if (!openaiResponse.ok) {
      throw new Error('Erro ao chamar OpenAI API')
    }

    const data = await openaiResponse.json()
    const aiResponse = data.choices[0].message.content

    return NextResponse.json({
      success: true,
      response: aiResponse,
      messagesAnalyzed: messages.length
    })

  } catch (error) {
    console.error('❌ Erro ao gerar resposta IA:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
}

// ================================================================
// EXEMPLO DE USO NO FRONTEND
// ================================================================

/**
 * Componente: Botão "Sugerir Resposta com IA"
 * 
 * <AISuggestButton remoteJid={selectedRemoteJid} />
 */
/*
'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export default function AISuggestButton({ remoteJid }: { remoteJid: string }) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState('')

  async function getSuggestion() {
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteJid })
      })

      const data = await response.json()
      if (data.success) {
        setSuggestion(data.response)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={getSuggestion}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? 'Gerando...' : 'Sugerir Resposta com IA'}
      </button>

      {suggestion && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-gray-700">{suggestion}</p>
          <button className="mt-2 text-xs text-purple-600 underline">
            Usar esta resposta
          </button>
        </div>
      )}
    </div>
  )
}
*/

// ================================================================
// ALTERNATIVA: Claude AI (Anthropic)
// ================================================================

/*
const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_completion_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })
})

const data = await claudeResponse.json()
const aiResponse = data.content[0].text
*/

// ================================================================
// RESPOSTA AUTOMÁTICA (Trigger no Banco)
// ================================================================

/*
-- Criar função que chama IA quando nova mensagem chega
CREATE OR REPLACE FUNCTION auto_respond_with_ai()
RETURNS TRIGGER AS $$
BEGIN
  -- Se mensagem veio do cliente (não de mim)
  IF NOT NEW.from_me THEN
    -- Chamar API de IA (via pg_net ou similar)
    -- Por enquanto, apenas log
    RAISE NOTICE '🤖 Nova mensagem para IA responder: %', NEW.content;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_respond_ai ON whatsapp_messages;
CREATE TRIGGER trigger_auto_respond_ai
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_respond_with_ai();
*/

export async function GET() {
  return NextResponse.json({
    message: 'Este é um endpoint de exemplo para integração com IA',
    usage: 'POST /api/whatsapp/ai-response com { remoteJid: "..." }'
  })
}
