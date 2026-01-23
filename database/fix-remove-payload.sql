-- ================================================================
-- FIX ULTRA AGRESSIVO: Limpar e reconstruir raw_payload
-- ================================================================

-- 1. OPÇÃO 1: Remover completamente o raw_payload (mais seguro)
-- Isso fará o sistema usar apenas a coluna from_me
UPDATE whatsapp_messages
SET raw_payload = NULL
WHERE remote_jid = '5521988960217@s.whatsapp.net';

-- 2. Ver resultado - agora todas deveriam usar from_me da coluna
SELECT 
  LEFT(content, 40) as content,
  from_me,
  CASE WHEN raw_payload IS NULL THEN 'NULL (vai usar coluna)' ELSE 'TEM PAYLOAD' END as payload_status,
  timestamp
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 15;

-- 3. Ver distribuição final
SELECT 
  from_me,
  COUNT(*) as total,
  COUNT(CASE WHEN raw_payload IS NULL THEN 1 END) as sem_payload
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
GROUP BY from_me;
