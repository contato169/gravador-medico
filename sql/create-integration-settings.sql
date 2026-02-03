-- =====================================================
-- CRIAR TABELA integration_settings
-- Para salvar configurações de ativos Meta (Ad Account, Page, Pixel, etc)
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL DEFAULT 'meta_default',
  
  -- Meta Ads Configuration
  meta_ad_account_id TEXT,
  meta_ad_account_name TEXT,
  meta_page_id TEXT,
  meta_page_name TEXT,
  meta_pixel_id TEXT,
  meta_pixel_name TEXT,
  meta_instagram_id TEXT,
  meta_instagram_name TEXT,
  instagram_actor_id TEXT,
  instagram_actor_name TEXT,
  meta_business_id TEXT,
  
  -- Flags
  is_default BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_integration_settings_user_id ON integration_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_setting_key ON integration_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_integration_settings_is_default ON integration_settings(is_default);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_integration_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_integration_settings_timestamp ON integration_settings;
CREATE TRIGGER update_integration_settings_timestamp
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_settings_timestamp();

-- RLS (Row Level Security)
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Política para service role (acesso total)
DROP POLICY IF EXISTS "Service role has full access" ON integration_settings;
CREATE POLICY "Service role has full access" ON integration_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentário na tabela
COMMENT ON TABLE integration_settings IS 'Configurações de integração com Meta Ads, incluindo Ad Account, Page, Pixel e Instagram';
