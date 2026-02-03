-- =====================================================
-- MIGRAÇÃO FINAL: ads_audiences
-- =====================================================
-- Remove TODAS as constraints e insere os públicos
-- =====================================================

-- 1. REMOVER TODAS as constraints de check
ALTER TABLE ads_audiences DROP CONSTRAINT IF EXISTS ads_audiences_funnel_stage_check;
ALTER TABLE ads_audiences DROP CONSTRAINT IF EXISTS ads_audiences_source_type_check;
ALTER TABLE ads_audiences DROP CONSTRAINT IF EXISTS ads_audiences_audience_type_check;
ALTER TABLE ads_audiences DROP CONSTRAINT IF EXISTS ads_audiences_type_check;

-- 2. Deletar públicos antigos [GDM] se existirem
DELETE FROM ads_audiences WHERE meta_audience_id LIKE '12023886%';

-- 3. Inserir os 9 públicos [GDM]
INSERT INTO ads_audiences 
  (meta_audience_id, template_id, name, audience_type, source_type, funnel_stage, retention_days, is_essential, is_active)
VALUES
  ('120238861678480657', 'all-visitors-180d', '[GDM] [M] WEB - Visitantes 180d', 'CUSTOM', 'WEBSITE', 'MEDIO', 180, true, true),
  ('120238861680500657', 'visitors-30d', '[GDM] [F] WEB - Visitantes Recentes 30d', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, true),
  ('120238861684050657', 'visitors-7d', '[GDM] [F] WEB - Visitantes Ultra Recentes 7d', 'CUSTOM', 'WEBSITE', 'FUNDO', 7, true, true),
  ('120238861686910657', 'checkout-abandoners-30d', '[GDM] [F] WEB - Abandonou Checkout', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, true),
  ('120238861688810657', 'add-to-cart-30d', '[GDM] [F] WEB - Adicionou ao Carrinho', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, true),
  ('120238861690370657', 'purchasers-180d', '[GDM] [F] WEB - Compradores', 'CUSTOM', 'WEBSITE', 'FUNDO', 180, true, true),
  ('120238861691810657', 'purchasers-30d', '[GDM] [F] WEB - Compradores Recentes', 'CUSTOM', 'WEBSITE', 'FUNDO', 30, true, true),
  ('120238861431160657', 'page-engagement-365d', '[GDM] [M] ENG - Engajamento com a Página FB 365d', 'CUSTOM', 'ENGAGEMENT', 'MEDIO', 365, true, true),
  ('120238861434800657', 'ig-engagement-365d', '[GDM] [M] ENG - Engajamento no Instagram 365d', 'CUSTOM', 'ENGAGEMENT', 'MEDIO', 365, true, true);

-- 4. Verificar resultado
SELECT name, source_type, funnel_stage, is_essential FROM ads_audiences WHERE is_essential = true;
