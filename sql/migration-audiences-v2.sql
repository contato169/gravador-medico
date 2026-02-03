-- =====================================================
-- MIGRAÇÃO: Adicionar colunas para sistema de públicos
-- =====================================================
-- Execute este SQL no Supabase para adicionar suporte
-- a Lookalikes, sincronização e funnel stages
-- =====================================================

-- 1. Adicionar colunas para Lookalikes
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS lookalike_origin_id TEXT,
ADD COLUMN IF NOT EXISTS lookalike_percentage INTEGER,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 2. Adicionar coluna funnel_stage se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ads_audiences' AND column_name = 'funnel_stage'
  ) THEN
    ALTER TABLE ads_audiences ADD COLUMN funnel_stage TEXT;
  END IF;
END $$;

-- 3. Adicionar constraint para funnel_stage
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'ads_audiences' AND constraint_name = 'ads_audiences_funnel_stage_check'
  ) THEN
    ALTER TABLE ads_audiences 
    ADD CONSTRAINT ads_audiences_funnel_stage_check 
    CHECK (funnel_stage IN ('TOPO', 'MEDIO', 'FUNDO') OR funnel_stage IS NULL);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Atualizar públicos existentes com funnel_stage
UPDATE ads_audiences
SET funnel_stage = CASE
  WHEN template_id LIKE '%visitors-7d%' OR template_id LIKE '%visitors-30d%' THEN 'FUNDO'
  WHEN template_id LIKE '%purchasers%' OR template_id LIKE '%checkout%' OR template_id LIKE '%cart%' THEN 'FUNDO'
  WHEN template_id LIKE '%180d%' OR template_id LIKE '%engagement%' THEN 'MEDIO'
  WHEN template_id LIKE '%lal%' OR audience_type = 'LOOKALIKE' THEN 'TOPO'
  ELSE 'MEDIO'
END
WHERE funnel_stage IS NULL;

-- 5. Adicionar índice para sincronização
CREATE INDEX IF NOT EXISTS idx_ads_audiences_last_synced 
ON ads_audiences(last_synced_at);

-- 6. Adicionar índice para funnel_stage
CREATE INDEX IF NOT EXISTS idx_ads_audiences_funnel_stage 
ON ads_audiences(funnel_stage);

-- 7. Comentários nas colunas
COMMENT ON COLUMN ads_audiences.lookalike_origin_id IS 'ID do público base usado para criar o Lookalike';
COMMENT ON COLUMN ads_audiences.lookalike_percentage IS 'Percentual do Lookalike (1-10)';
COMMENT ON COLUMN ads_audiences.last_synced_at IS 'Última vez que o tamanho foi sincronizado com a Meta';
COMMENT ON COLUMN ads_audiences.funnel_stage IS 'Estágio do funil: TOPO (prospecção), MEDIO (engajamento), FUNDO (conversão)';

-- =====================================================
-- Verificação
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ads_audiences'
ORDER BY ordinal_position;
