-- =====================================================
-- CORRIGIR VENDAS COM CUPONS (R$ 1.00)
-- =====================================================
-- Criado em: 26/01/2026
-- Descrição: Identifica e corrige vendas que usaram cupom
--            mas estão com valor incorreto (R$ 1.00)
-- =====================================================

-- 1. Verificar vendas com R$ 1.00 (possíveis vendas com cupom ADMGM 99%)
SELECT 
    id,
    appmax_order_id,
    customer_name,
    customer_email,
    total_amount,
    discount,
    coupon_code,
    coupon_discount,
    status,
    created_at,
    metadata
FROM public.sales
WHERE total_amount <= 1.50
AND status IN ('paid', 'approved', 'completed')
ORDER BY created_at DESC;

-- 2. Tentar extrair coupon_code do metadata se existir
UPDATE public.sales
SET 
    coupon_code = CASE 
        WHEN metadata->>'coupon_code' IS NOT NULL THEN metadata->>'coupon_code'
        WHEN metadata->>'coupon' IS NOT NULL THEN metadata->>'coupon'
        ELSE coupon_code
    END,
    coupon_discount = CASE 
        WHEN (metadata->>'coupon_discount')::numeric > 0 
            THEN (metadata->>'coupon_discount')::numeric
        WHEN (metadata->>'discount')::numeric > 0 
            THEN (metadata->>'discount')::numeric
        ELSE coupon_discount
    END
WHERE total_amount <= 1.50
AND status IN ('paid', 'approved', 'completed')
AND coupon_code IS NULL
AND metadata IS NOT NULL;

-- 3. Verificar se cupom ADMGM existe e criar se necessário
-- ADMGM = 99% de desconto
INSERT INTO public.coupons (code, type, value, min_order_value, usage_limit, description, is_active)
VALUES ('ADMGM', 'percent', 99, 0, NULL, 'Cupom especial ADMGM - 99% de desconto', true)
ON CONFLICT (code) DO NOTHING;

-- 4. Para vendas de R$ 1.00 que claramente usaram ADMGM (99%)
-- Assumindo que o produto custa R$ 97.00 (valor padrão do Gravador Médico)
UPDATE public.sales
SET 
    coupon_code = 'ADMGM',
    coupon_discount = 96.00,  -- 99% de 97 = 96.03
    discount = 96.00
WHERE total_amount BETWEEN 0.90 AND 1.10  -- R$ 1.00 +/- margem
AND status IN ('paid', 'approved', 'completed')
AND coupon_code IS NULL;

-- 5. Verificar resultado
SELECT 
    id,
    appmax_order_id,
    customer_name,
    total_amount,
    discount,
    coupon_code,
    coupon_discount,
    status,
    created_at
FROM public.sales
WHERE coupon_code = 'ADMGM'
ORDER BY created_at DESC;

-- 6. Sincronizar contadores após correção
SELECT * FROM sync_coupon_usage_counts();

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
-- 1. Execute o passo 1 primeiro para ver as vendas suspeitas
-- 2. Execute os passos 2, 3 e 4 para corrigir
-- 3. Execute o passo 5 para verificar
-- 4. Execute o passo 6 para sincronizar contadores
-- =====================================================
