-- ================================================================
-- FIX DEFINITIVO: Corrigir raw_payload.key.fromMe
-- ================================================================

-- 1. Ver quantas mensagens têm conflito (coluna vs payload)
SELECT 
  COUNT(*) as total_conflitos
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me != COALESCE((raw_payload->'key'->>'fromMe')::boolean, from_me);

-- 2. ATUALIZAR raw_payload para refletir o from_me correto
UPDATE whatsapp_messages
SET raw_payload = jsonb_set(
  COALESCE(raw_payload, '{}'::jsonb),
  '{key,fromMe}',
  to_jsonb(from_me),
  true
)
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND raw_payload IS NOT NULL
  AND (raw_payload->'key'->>'fromMe')::boolean IS DISTINCT FROM from_me;

-- 3. Verificar resultado
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN from_me = true THEN 1 END) as from_me_true,
  COUNT(CASE WHEN from_me = false THEN 1 END) as from_me_false,
  COUNT(CASE WHEN (raw_payload->'key'->>'fromMe')::boolean = true THEN 1 END) as payload_true,
  COUNT(CASE WHEN (raw_payload->'key'->>'fromMe')::boolean = false THEN 1 END) as payload_false,
  COUNT(CASE WHEN from_me = (raw_payload->'key'->>'fromMe')::boolean THEN 1 END) as consistentes
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net';

-- 4. Ver últimas 10 para confirmar
SELECT 
  LEFT(content, 40) as content,
  from_me as coluna_from_me,
  (raw_payload->'key'->>'fromMe')::boolean as payload_from_me,
  CASE 
    WHEN from_me = (raw_payload->'key'->>'fromMe')::boolean THEN '✅'
    ELSE '❌'
  END as consistente
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 10;
