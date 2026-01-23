-- ================================================================
-- FIX FINAL: Remover raw_payload de TODAS as mensagens
-- ================================================================

-- 1. Ver quantas mensagens têm payload
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN raw_payload IS NULL THEN 1 END) as sem_payload,
  COUNT(CASE WHEN raw_payload IS NOT NULL THEN 1 END) as com_payload
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net';

-- 2. REMOVER raw_payload de TODAS (inclusive as antigas)
UPDATE whatsapp_messages
SET raw_payload = NULL
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND raw_payload IS NOT NULL;

-- 3. Verificar resultado
SELECT 
  'Mensagens sem payload' as status,
  COUNT(*) as total
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND raw_payload IS NULL;

-- 4. Ver últimas 50 mensagens para confirmar que todas estão OK
SELECT 
  LEFT(content, 40) as content,
  from_me,
  TO_CHAR(timestamp, 'DD/MM HH24:MI') as quando,
  CASE WHEN raw_payload IS NULL THEN '✅' ELSE '❌' END as ok
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp ASC
LIMIT 50;
