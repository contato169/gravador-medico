-- =====================================================
-- MIGRAÇÃO: Corrigir colunas da tabela ads_audiences
-- =====================================================
-- Execute este SQL no Supabase para adicionar as colunas
-- que estão faltando para sincronização funcionar
-- =====================================================

-- 1. Adicionar coluna delivery_status
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS delivery_status TEXT;

-- 2. Adicionar coluna approximate_size (se não existir)
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS approximate_size INTEGER;

-- 3. Adicionar coluna source_type (se não existir)
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS source_type TEXT;

-- 4. Adicionar coluna is_active (se não existir)
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. Adicionar coluna is_essential (se não existir)
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS is_essential BOOLEAN DEFAULT false;

-- 6. Garantir que meta_audience_id existe
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS meta_audience_id TEXT;

-- 7. Garantir que audience_type existe
ALTER TABLE ads_audiences
ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'CUSTOM';

-- 8. Criar índice para meta_audience_id
CREATE INDEX IF NOT EXISTS idx_ads_audiences_meta_id 
ON ads_audiences(meta_audience_id);

-- =====================================================
-- Verificação final
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ads_audiences'
ORDER BY ordinal_position;
