-- =====================================================
-- MIGRAÇÃO COMPLETA: ads_audiences
-- =====================================================
-- Este SQL cria a tabela ads_audiences com todas as 
-- colunas necessárias para o sistema funcionar
-- =====================================================

-- 1. Criar a tabela ads_audiences (se não existir)
CREATE TABLE IF NOT EXISTS ads_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_audience_id TEXT UNIQUE,
  template_id TEXT,
  name TEXT NOT NULL,
  audience_type TEXT DEFAULT 'CUSTOM',
  source_type TEXT,
  funnel_stage TEXT,
  retention_days INTEGER,
  is_essential BOOLEAN DEFAULT false,
  use_for_exclusion BOOLEAN DEFAULT false,
  recommended_for TEXT[],
  approximate_size INTEGER DEFAULT 0,
  delivery_status TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  lookalike_origin_id TEXT,
  lookalike_percentage INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar colunas que possam estar faltando (se tabela já existia)
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS meta_audience_id TEXT;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'CUSTOM';
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS funnel_stage TEXT;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS retention_days INTEGER;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS is_essential BOOLEAN DEFAULT false;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS use_for_exclusion BOOLEAN DEFAULT false;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS recommended_for TEXT[];
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS approximate_size INTEGER DEFAULT 0;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS delivery_status TEXT;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS lookalike_origin_id TEXT;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS lookalike_percentage INTEGER;
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ads_audiences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Criar índice único para meta_audience_id (se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_audiences_meta_id 
ON ads_audiences(meta_audience_id) WHERE meta_audience_id IS NOT NULL;

-- 4. Criar índice para funnel_stage
CREATE INDEX IF NOT EXISTS idx_ads_audiences_funnel 
ON ads_audiences(funnel_stage);

-- 5. Migrar dados da tabela meta_audiences (SE EXISTIR)
-- Isso copia os 9 públicos que você já inseriu
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meta_audiences') THEN
    INSERT INTO ads_audiences (
      meta_audience_id,
      template_id,
      name,
      audience_type,
      source_type,
      funnel_stage,
      retention_days,
      is_essential,
      recommended_for,
      approximate_size,
      is_active
    )
    SELECT 
      audience_id,
      template_id,
      name,
      type,
      type,
      funnel_stage,
      retention_days,
      is_essential,
      recommended_for,
      COALESCE(approximate_size, 0),
      true
    FROM meta_audiences
    WHERE audience_id NOT IN (
      SELECT meta_audience_id FROM ads_audiences WHERE meta_audience_id IS NOT NULL
    );
    
    RAISE NOTICE 'Dados migrados de meta_audiences para ads_audiences';
  END IF;
END $$;

-- 6. Inserir os 9 públicos [GDM] diretamente (caso não existam)
INSERT INTO ads_audiences 
  (meta_audience_id, template_id, name, audience_type, source_type, funnel_stage, retention_days, is_essential, recommended_for, is_active)
VALUES
  ('120238861678480657', 'all-visitors-180d', '[GDM] [M] WEB - Visitantes 180d', 'CUSTOM', 'WEBSITE', 'MEDIO', 180, true, ARRAY['REMARKETING'], true),
  ('120238861680500657', 'visitors-30d', '[GDM] [F] WEB - Visitantes Recentes 30d', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, ARRAY['REMARKETING'], true),
  ('120238861684050657', 'visitors-7d', '[GDM] [F] WEB - Visitantes Ultra Recentes 7d', 'CUSTOM', 'WEBSITE', 'FUNDO', 7, true, ARRAY['CONVERSAO'], true),
  ('120238861686910657', 'checkout-abandoners-30d', '[GDM] [F] WEB - Abandonou Checkout', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, ARRAY['CONVERSAO'], true),
  ('120238861688810657', 'add-to-cart-30d', '[GDM] [F] WEB - Adicionou ao Carrinho', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, ARRAY['CONVERSAO'], true),
  ('120238861690370657', 'purchasers-180d', '[GDM] [F] WEB - Compradores', 'CUSTOM', 'WEBSITE', 'FUNDO', 180, true, ARRAY['EXCLUSAO'], true),
  ('120238861691810657', 'purchasers-30d', '[GDM] [F] WEB - Compradores Recentes', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, ARRAY['EXCLUSAO'], true),
  ('120238861431160657', 'page-engagement-365d', '[GDM] [M] ENG - Engajamento com a Página FB 365d', 'CUSTOM', 'ENGAGEMENT', 'MEDIO', 365, true, ARRAY['REMARKETING'], true),
  ('120238861434800657', 'ig-engagement-365d', '[GDM] [M] ENG - Engajamento no Instagram 365d', 'CUSTOM', 'ENGAGEMENT', 'MEDIO', 365, true, ARRAY['REMARKETING'], true)
ON CONFLICT (meta_audience_id) DO UPDATE SET
  name = EXCLUDED.name,
  template_id = EXCLUDED.template_id,
  source_type = EXCLUDED.source_type,
  funnel_stage = EXCLUDED.funnel_stage,
  retention_days = EXCLUDED.retention_days,
  is_essential = EXCLUDED.is_essential,
  recommended_for = EXCLUDED.recommended_for;

-- 7. Verificar resultado
SELECT 
  meta_audience_id,
  name,
  source_type,
  funnel_stage,
  approximate_size,
  delivery_status,
  is_essential
FROM ads_audiences
WHERE meta_audience_id LIKE '12023886%'
ORDER BY funnel_stage, name;
