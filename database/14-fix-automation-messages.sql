-- ================================================================
-- FIX: Corrigir mensagens da automação (from_me = false → true)
-- ================================================================
-- Problema: Mensagens enviadas pelo sistema/automação estão com from_me=false
-- Solução: Detectar pelo padrão do message_id e atualizar
-- ================================================================

-- 1. Atualizar mensagens antigas da automação
-- Mensagens enviadas têm IDs que começam com caracteres específicos
UPDATE whatsapp_messages
SET from_me = true
WHERE from_me = false
  AND (
    -- Padrão típico de IDs de mensagens enviadas pela Evolution API
    message_id LIKE '3EB%'
    OR message_id LIKE '3A%'
    OR message_id LIKE 'BAE%'
    OR message_id LIKE '3AA%'
    -- Mensagens sem message_id mas com conteúdo longo típico de automação
    OR (message_id IS NULL AND length(content) > 100)
  );

-- 2. Verificar resultados
SELECT 
  'Mensagens atualizadas' as tipo,
  COUNT(*) as total
FROM whatsapp_messages
WHERE from_me = true;

SELECT 
  'Mensagens recebidas' as tipo,
  COUNT(*) as total
FROM whatsapp_messages
WHERE from_me = false;

-- 3. Criar função para detectar mensagens enviadas por padrão de ID
CREATE OR REPLACE FUNCTION is_sent_message_id(msg_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF msg_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Padrões conhecidos de IDs de mensagens enviadas
  RETURN (
    msg_id LIKE '3EB%'
    OR msg_id LIKE '3A%'
    OR msg_id LIKE 'BAE%'
    OR msg_id LIKE '3AA%'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Função do trigger (CRIAR ANTES DO TRIGGER!)
CREATE OR REPLACE FUNCTION auto_detect_from_me()
RETURNS TRIGGER AS $$
BEGIN
  -- Se from_me já foi definido explicitamente, manter
  IF NEW.from_me IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Detectar por padrão de ID
  IF is_sent_message_id(NEW.message_id) THEN
    NEW.from_me = true;
  ELSE
    NEW.from_me = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar se trigger já existe antes de criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_set_from_me_on_insert'
  ) THEN
    -- Trigger para detectar automaticamente mensagens enviadas
    CREATE TRIGGER auto_set_from_me_on_insert
    BEFORE INSERT ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_detect_from_me();
  END IF;
END $$;

-- 6. Adicionar comentários
COMMENT ON FUNCTION is_sent_message_id IS 'Detecta se um message_id é de mensagem enviada (vs recebida) baseado em padrões conhecidos';
COMMENT ON FUNCTION auto_detect_from_me IS 'Trigger function que define from_me automaticamente baseado no message_id';

-- 7. Estatísticas finais
SELECT 
  from_me,
  COUNT(*) as total,
  COUNT(DISTINCT remote_jid) as conversas_unicas,
  MIN(timestamp) as primeira_msg,
  MAX(timestamp) as ultima_msg
FROM whatsapp_messages
GROUP BY from_me
ORDER BY from_me DESC;
