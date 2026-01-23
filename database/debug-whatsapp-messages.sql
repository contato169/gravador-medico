-- ================================================================
-- DEBUG: Verificar mensagens do WhatsApp
-- ================================================================

-- 1. Ver últimas 20 mensagens com detalhes
SELECT 
  id,
  message_id,
  remote_jid,
  content,
  message_type,
  from_me,
  timestamp,
  status,
  created_at
FROM whatsapp_messages
ORDER BY timestamp DESC
LIMIT 20;

-- 2. Contar mensagens por from_me
SELECT 
  from_me,
  COUNT(*) as total,
  COUNT(CASE WHEN message_type = 'text' THEN 1 END) as texto,
  COUNT(CASE WHEN message_type = 'image' THEN 1 END) as imagens,
  COUNT(CASE WHEN message_type = 'audio' THEN 1 END) as audios
FROM whatsapp_messages
GROUP BY from_me
ORDER BY from_me DESC;

-- 3. Ver últimas 10 mensagens ENVIADAS (from_me = true)
SELECT 
  id,
  content,
  message_type,
  from_me,
  timestamp
FROM whatsapp_messages
WHERE from_me = true
ORDER BY timestamp DESC
LIMIT 10;

-- 4. Ver últimas 10 mensagens RECEBIDAS (from_me = false)
SELECT 
  id,
  content,
  message_type,
  from_me,
  timestamp
FROM whatsapp_messages
WHERE from_me = false
ORDER BY timestamp DESC
LIMIT 10;

-- 5. Verificar mensagens com from_me NULL ou inválido
SELECT 
  COUNT(*) as total_invalidas,
  COUNT(CASE WHEN from_me IS NULL THEN 1 END) as nulas,
  COUNT(CASE WHEN from_me IS NOT NULL THEN 1 END) as validas
FROM whatsapp_messages;

-- 6. Ver distribuição de mensagens por remote_jid
SELECT 
  remote_jid,
  COUNT(*) as total_mensagens,
  COUNT(CASE WHEN from_me = true THEN 1 END) as enviadas,
  COUNT(CASE WHEN from_me = false THEN 1 END) as recebidas,
  MAX(timestamp) as ultima_mensagem
FROM whatsapp_messages
GROUP BY remote_jid
ORDER BY ultima_mensagem DESC
LIMIT 10;

-- 7. Ver tipo de dados da coluna from_me
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'whatsapp_messages'
  AND column_name = 'from_me';
