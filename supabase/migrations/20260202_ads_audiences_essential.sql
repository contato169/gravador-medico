-- =====================================================
-- MIGRATION: ADS_AUDIENCES - Sistema de Públicos Meta
-- =====================================================
-- Cria/atualiza tabela para armazenar públicos do Meta Ads
-- com suporte a templates essenciais e lookalikes
-- =====================================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS ads_audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificadores
  meta_audience_id TEXT NOT NULL UNIQUE,
  template_id TEXT, -- ID do template usado (ex: 'purchasers-180d')
  name TEXT NOT NULL,
  
  -- Tipo e classificação
  audience_type TEXT NOT NULL DEFAULT 'CUSTOM', -- 'CUSTOM' ou 'LOOKALIKE'
  source_type TEXT, -- 'WEBSITE', 'ENGAGEMENT', 'VIDEO', 'INSTAGRAM', etc
  funnel_stage TEXT, -- 'TOPO', 'MEIO', 'FUNDO'
  
  -- Configurações
  retention_days INTEGER,
  lookalike_ratio DECIMAL(4,3), -- Ex: 0.01 = 1%, 0.03 = 3%
  source_audience_id TEXT, -- Para lookalikes, ID do público base
  
  -- Flags
  is_essential BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  use_for_exclusion BOOLEAN DEFAULT false, -- Usar para excluir de campanhas
  recommended_for TEXT[], -- Array: ['TRAFFIC', 'CONVERSION', 'REMARKETING', 'ACQUISITION']
  
  -- Saúde e métricas
  approximate_size INTEGER,
  health_status TEXT, -- 'READY', 'FILLING', 'ERROR', 'DELETED'
  last_health_check TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas novas se não existirem (para tabelas existentes)
DO $$ 
BEGIN
  -- template_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'template_id') THEN
    ALTER TABLE ads_audiences ADD COLUMN template_id TEXT;
  END IF;
  
  -- is_essential
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'is_essential') THEN
    ALTER TABLE ads_audiences ADD COLUMN is_essential BOOLEAN DEFAULT false;
  END IF;
  
  -- use_for_exclusion
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'use_for_exclusion') THEN
    ALTER TABLE ads_audiences ADD COLUMN use_for_exclusion BOOLEAN DEFAULT false;
  END IF;
  
  -- recommended_for
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'recommended_for') THEN
    ALTER TABLE ads_audiences ADD COLUMN recommended_for TEXT[];
  END IF;
  
  -- health_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'health_status') THEN
    ALTER TABLE ads_audiences ADD COLUMN health_status TEXT;
  END IF;
  
  -- last_health_check
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'last_health_check') THEN
    ALTER TABLE ads_audiences ADD COLUMN last_health_check TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- source_audience_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'source_audience_id') THEN
    ALTER TABLE ads_audiences ADD COLUMN source_audience_id TEXT;
  END IF;
  
  -- lookalike_ratio
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads_audiences' AND column_name = 'lookalike_ratio') THEN
    ALTER TABLE ads_audiences ADD COLUMN lookalike_ratio DECIMAL(4,3);
  END IF;
END $$;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ads_audiences_template ON ads_audiences(template_id);
CREATE INDEX IF NOT EXISTS idx_ads_audiences_type ON ads_audiences(audience_type);
CREATE INDEX IF NOT EXISTS idx_ads_audiences_funnel ON ads_audiences(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_ads_audiences_essential ON ads_audiences(is_essential) WHERE is_essential = true;
CREATE INDEX IF NOT EXISTS idx_ads_audiences_exclusion ON ads_audiences(use_for_exclusion) WHERE use_for_exclusion = true;
CREATE INDEX IF NOT EXISTS idx_ads_audiences_active ON ads_audiences(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ads_audiences_health ON ads_audiences(health_status);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ads_audiences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ads_audiences_updated_at ON ads_audiences;
CREATE TRIGGER trigger_ads_audiences_updated_at
  BEFORE UPDATE ON ads_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_audiences_updated_at();

-- 5. RLS (Row Level Security) - Opcional
-- ALTER TABLE ads_audiences ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admins can do everything" ON ads_audiences FOR ALL TO authenticated USING (true);

-- 6. Comentários para documentação
COMMENT ON TABLE ads_audiences IS 'Públicos do Meta Ads (Custom Audiences e Lookalikes)';
COMMENT ON COLUMN ads_audiences.template_id IS 'ID do template usado (ex: purchasers-180d, lal-purchasers-1pct)';
COMMENT ON COLUMN ads_audiences.funnel_stage IS 'Estágio do funil: TOPO (aquisição), MEIO (engajamento), FUNDO (conversão)';
COMMENT ON COLUMN ads_audiences.use_for_exclusion IS 'Se true, usar para excluir de campanhas de aquisição';
COMMENT ON COLUMN ads_audiences.recommended_for IS 'Array de objetivos recomendados: TRAFFIC, CONVERSION, REMARKETING, ACQUISITION';
COMMENT ON COLUMN ads_audiences.health_status IS 'Status de saúde: READY, FILLING, ERROR, DELETED';

-- =====================================================
-- DADOS INICIAIS (Opcional - para referência)
-- =====================================================

-- Exemplo de como inserir um público manualmente:
-- INSERT INTO ads_audiences (
--   meta_audience_id,
--   template_id,
--   name,
--   audience_type,
--   source_type,
--   funnel_stage,
--   retention_days,
--   is_essential,
--   use_for_exclusion,
--   recommended_for
-- ) VALUES (
--   '123456789',
--   'purchasers-180d',
--   'Compradores (180 dias)',
--   'CUSTOM',
--   'WEBSITE',
--   'FUNDO',
--   180,
--   true,
--   true,
--   ARRAY['CONVERSION']::TEXT[]
-- );

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ads_audiences'
ORDER BY ordinal_position;
