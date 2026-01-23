-- ================================================================
-- DIAGNÓSTICO COMPLETO: Ver TODAS as mensagens dessa conversa
-- ================================================================

-- 1. Ver TODAS as mensagens (não só 20)
SELECT 
  id,
  LEFT(content, 50) as content,
  from_me,
  message_type,
  timestamp,
  created_at
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp ASC  -- Do mais antigo para o mais novo
LIMIT 50;  -- Ver as primeiras 50

-- 2. Ver distribuição por data
SELECT 
  DATE(timestamp) as data,
  COUNT(*) as total,
  COUNT(CASE WHEN from_me = true THEN 1 END) as minhas,
  COUNT(CASE WHEN from_me = false THEN 1 END) as do_cliente
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
GROUP BY DATE(timestamp)
ORDER BY data DESC;

-- 3. Ver se tem mensagens NULL ou com problemas
SELECT 
  COUNT(*) as total_problemas
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND (
    content IS NULL 
    OR content = ''
    OR from_me IS NULL
    OR timestamp IS NULL
  );

-- 4. Ver últimas 30 mensagens com mais detalhes
SELECT 
  LEFT(id::text, 8) as id_short,
  LEFT(content, 40) as content,
  from_me,
  message_type,
  TO_CHAR(timestamp, 'DD/MM HH24:MI') as quando,
  CASE WHEN raw_payload IS NULL THEN '✅ NULL' ELSE '❌ TEM' END as payload
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 30;
