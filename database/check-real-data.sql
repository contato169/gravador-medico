-- ================================================================
-- Verificar QUEM enviou cada mensagem de verdade
-- ================================================================

-- Ver as últimas 30 mensagens com contexto
SELECT 
  LEFT(id::text, 8) as id_short,
  LEFT(content, 50) as content,
  from_me,
  message_type,
  TO_CHAR(timestamp, 'DD/MM HH24:MI') as quando,
  -- Ver se tem participant (indica que é do cliente)
  CASE 
    WHEN raw_payload->'key'->>'participant' IS NOT NULL THEN '👤 CLIENTE'
    WHEN raw_payload->'key'->>'fromMe' = 'true' THEN '🟢 VOCÊ'
    WHEN raw_payload->'key'->>'fromMe' = 'false' THEN '👤 CLIENTE'
    ELSE '❓ INDEFINIDO'
  END as quem_enviou_real,
  raw_payload->'key'->>'fromMe' as raw_from_me,
  raw_payload->'key'->>'participant' as participant
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 30;
