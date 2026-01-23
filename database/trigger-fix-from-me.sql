-- ================================================================
-- TRIGGER: Corrigir from_me automaticamente usando raw_payload
-- ================================================================
-- Este trigger garante que o from_me seja sempre correto,
-- mesmo que o webhook salve errado.
-- ================================================================

-- Função que corrige o from_me
CREATE OR REPLACE FUNCTION fix_from_me_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Se raw_payload.key.fromMe existe, usar esse valor
  IF NEW.raw_payload IS NOT NULL 
     AND NEW.raw_payload->'key' IS NOT NULL 
     AND NEW.raw_payload->'key'->'fromMe' IS NOT NULL THEN
    
    -- Extrair o valor correto do payload
    NEW.from_me := (NEW.raw_payload->'key'->>'fromMe')::boolean;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger se existir
DROP TRIGGER IF EXISTS trigger_fix_from_me ON whatsapp_messages;

-- Criar trigger que roda ANTES do INSERT
CREATE TRIGGER trigger_fix_from_me
  BEFORE INSERT OR UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION fix_from_me_on_insert();

-- Verificar se foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_fix_from_me';
