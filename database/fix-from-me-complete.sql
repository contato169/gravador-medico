-- ================================================================
-- FIX COMPLETO: Corrigir ALL from_me baseado no raw_payload
-- ================================================================
-- Este script analisa o raw_payload e corrige o from_me na coluna

-- 1. Ver situação atual
SELECT 
  from_me,
  COUNT(*) as total,
  COUNT(CASE WHEN raw_payload IS NOT NULL THEN 1 END) as com_payload,
  COUNT(CASE WHEN raw_payload IS NULL THEN 1 END) as sem_payload
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
GROUP BY from_me;

-- 2. CORREÇÃO BASEADA NO RAW_PAYLOAD
-- Se o raw_payload tem key.fromMe, usar esse valor
UPDATE whatsapp_messages
SET from_me = CASE
  -- Se raw_payload tem key.fromMe = true
  WHEN raw_payload->'key'->>'fromMe' = 'true' THEN true
  WHEN raw_payload->'key'->>'fromMe' = '1' THEN true
  -- Se raw_payload tem key.fromMe = false
  WHEN raw_payload->'key'->>'fromMe' = 'false' THEN false
  WHEN raw_payload->'key'->>'fromMe' = '0' THEN false
  -- Manter valor atual se não tiver no payload
  ELSE from_me
END
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND raw_payload IS NOT NULL
  AND raw_payload->'key'->>'fromMe' IS NOT NULL;

-- 3. Ver resultado
SELECT 
  from_me,
  COUNT(*) as total
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
GROUP BY from_me
ORDER BY from_me DESC;

-- 4. Ver últimas 20 para confirmar
SELECT 
  id,
  LEFT(content, 40) as content,
  from_me,
  raw_payload->'key'->>'fromMe' as raw_from_me,
  timestamp
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 20;
