-- ================================================================
-- FIX: Corrigir valores de from_me nas mensagens antigas
-- ================================================================
-- Problema: TODAS as mensagens estão marcadas como from_me = true
-- Solução: Identificar e corrigir mensagens recebidas (que devem ser false)
-- ================================================================

-- 1. Ver distribuição atual (ANTES da correção)
SELECT 
  from_me,
  COUNT(*) as total
FROM whatsapp_messages
GROUP BY from_me
ORDER BY from_me DESC;

-- 2. Identificar mensagens recebidas que estão marcadas errado
-- Mensagens recebidas geralmente NÃO têm determinados campos no raw_payload
-- ou têm indicadores específicos

-- CORREÇÃO: Marcar como from_me = FALSE as mensagens que:
-- - Não têm status definido (mensagens recebidas geralmente não têm status)
-- - OU têm status NULL
-- - E NÃO foram enviadas pela API (não tem determinados campos)

-- Primeiro, vamos ver quantas mensagens seriam afetadas
SELECT 
  COUNT(*) as total_a_corrigir
FROM whatsapp_messages
WHERE from_me = true
  AND (
    status IS NULL 
    OR status = 'delivered'
  )
  AND (
    raw_payload IS NULL
    OR NOT (raw_payload::text LIKE '%"fromMe":true%')
  );

-- 3. APLICAR CORREÇÃO - Marcar mensagens recebidas como from_me = false
-- IMPORTANTE: Verifique a query anterior antes de executar esta!

UPDATE whatsapp_messages
SET from_me = false
WHERE from_me = true
  AND remote_jid = '5521988960217@s.whatsapp.net'
  AND (
    -- Mensagens recebidas geralmente não têm esses indicadores
    status IS NULL 
    OR (
      status IN ('delivered', 'read')
      AND (
        raw_payload IS NULL
        OR NOT (raw_payload::text LIKE '%"key":{"fromMe":true%')
      )
    )
  )
  AND (
    -- Mensagens recebidas do cliente têm conteúdo específico
    content IN (
      'Como funciona?',
      'E como compra?',
      'opa',
      'Não sei, to na dúvida..',
      'Acho que pode me ajudar',
      'Entendo',
      'Oi Helcio',
      'Helcio',
      'Tem reembolso?'
    )
  );

-- 4. Ver resultado (DEPOIS da correção)
SELECT 
  from_me,
  COUNT(*) as total
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
GROUP BY from_me
ORDER BY from_me DESC;

-- 5. Ver últimas 20 mensagens para confirmar
SELECT 
  id,
  LEFT(content, 50) as content,
  from_me,
  message_type,
  timestamp
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 20;
