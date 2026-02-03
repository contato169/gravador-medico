-- =====================================================
-- TABELA: active_campaigns_cache
-- =====================================================
-- Cache de campanhas ativas para verificação de duplicatas
-- Armazena dados da Meta API por até 1 hora
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS active_campaigns_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL UNIQUE,
  ads_data JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida por account_id
CREATE INDEX IF NOT EXISTS idx_active_campaigns_account ON active_campaigns_cache(account_id);

-- Índice para busca por data de atualização
CREATE INDEX IF NOT EXISTS idx_active_campaigns_updated ON active_campaigns_cache(updated_at);

-- Comentários
COMMENT ON TABLE active_campaigns_cache IS 'Cache de anúncios ativos da Meta API para verificação de duplicatas';
COMMENT ON COLUMN active_campaigns_cache.account_id IS 'ID da conta de anúncios do Meta';
COMMENT ON COLUMN active_campaigns_cache.ads_data IS 'Array JSON com dados dos anúncios ativos';
COMMENT ON COLUMN active_campaigns_cache.updated_at IS 'Última atualização do cache';

-- =====================================================
-- Função para limpar caches antigos (> 24h)
-- =====================================================
CREATE OR REPLACE FUNCTION clean_old_campaign_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM active_campaigns_cache
  WHERE updated_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Exemplo de uso:
-- =====================================================
-- INSERT INTO active_campaigns_cache (account_id, ads_data)
-- VALUES (
--   '1559431300891081',
--   '[{"id": "123", "name": "Campanha 1", "primary_text": "Médico, economize 15h/semana..."}]'
-- );
--
-- SELECT ads_data FROM active_campaigns_cache WHERE account_id = '1559431300891081';
