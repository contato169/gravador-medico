-- ================================================================
-- FIX DEFINITIVO: Corrigir from_me baseado no conteúdo
-- ================================================================

-- Mensagens típicas de CLIENTES (perguntas, saudações curtas)
-- Vamos marcar como from_me = FALSE (do cliente)
UPDATE whatsapp_messages
SET from_me = false
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me = true
  AND (
    -- Saudações curtas do cliente
    content IN ('oi', 'Oi', 'oi ', 'helcio', 'Helcio', 'Ola', 'Olá', 'ola')
    -- Perguntas típicas de clientes
    OR content LIKE '%tem alguem%'
    OR content LIKE '%Teste robo%'
    OR content LIKE '%teste%'
    OR content LIKE 'dasdsad%'
    OR content LIKE 'utuyuy%'
    -- Mensagens muito curtas (geralmente são do cliente)
    OR (LENGTH(content) <= 3 AND content ~ '^[oO][iI]?$')
  );

-- Ver resultado
SELECT 
  'Mensagens do cliente (from_me=false)' as tipo,
  COUNT(*) as total
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me = false;

SELECT 
  'Mensagens minhas/automação (from_me=true)' as tipo,
  COUNT(*) as total
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me = true;

-- Ver últimas 30 com a correção
SELECT 
  LEFT(content, 40) as content,
  CASE WHEN from_me THEN '🟢 VOCÊ' ELSE '👤 CLIENTE' END as quem,
  TO_CHAR(timestamp, 'DD/MM HH24:MI') as quando
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 30;
