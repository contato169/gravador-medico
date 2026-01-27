-- ========================================
-- FIX COMPLETO: Dashboard de Vendas
-- ========================================
-- Execute este script no Supabase SQL Editor
-- Garante que todas as estruturas necessárias existam
-- Data: 27/01/2026
-- ========================================

-- =====================================================
-- 0. VERIFICAR E ADICIONAR COLUNAS FALTANTES
-- =====================================================

-- Adicionar coluna mercadopago_payment_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'mercadopago_payment_id'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN mercadopago_payment_id TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_sales_mercadopago_payment_id ON public.sales(mercadopago_payment_id);
        RAISE NOTICE '✅ Coluna mercadopago_payment_id adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna mercadopago_payment_id já existe';
    END IF;
END $$;

-- Adicionar coluna payment_gateway se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'payment_gateway'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN payment_gateway TEXT;
        CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway ON public.sales(payment_gateway);
        RAISE NOTICE '✅ Coluna payment_gateway adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna payment_gateway já existe';
    END IF;
END $$;

-- Adicionar coluna order_status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'order_status'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN order_status TEXT DEFAULT 'pending';
        CREATE INDEX IF NOT EXISTS idx_sales_order_status ON public.sales(order_status);
        RAISE NOTICE '✅ Coluna order_status adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna order_status já existe';
    END IF;
END $$;

-- Adicionar coluna fallback_used se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'fallback_used'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN fallback_used BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Coluna fallback_used adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna fallback_used já existe';
    END IF;
END $$;

-- Adicionar coluna external_reference se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'external_reference'
    ) THEN
        ALTER TABLE public.sales ADD COLUMN external_reference TEXT;
        CREATE INDEX IF NOT EXISTS idx_sales_external_reference ON public.sales(external_reference);
        RAISE NOTICE '✅ Coluna external_reference adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna external_reference já existe';
    END IF;
END $$;

-- =====================================================
-- 1. FUNÇÃO RPC: get_analytics_period
-- =====================================================
-- Busca métricas principais do dashboard por período
-- ATUALIZADO: Inclui vendas pendentes separadamente

CREATE OR REPLACE FUNCTION public.get_analytics_period(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    unique_visitors BIGINT,
    total_sales BIGINT,
    pending_sales BIGINT,
    paid_sales BIGINT,
    total_revenue NUMERIC,
    conversion_rate NUMERIC,
    average_order_value NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH period_visits AS (
        SELECT
            COUNT(DISTINCT session_id) as unique_visitors
        FROM public.analytics_visits
        WHERE created_at BETWEEN start_date AND end_date
    ),
    period_sales AS (
        -- Busca TODAS as vendas da tabela sales (inclui MP + AppMax)
        SELECT
            COUNT(*) as total_sales,
            COUNT(*) FILTER (WHERE order_status IN ('pending', 'pending_payment', 'processing')) as pending_sales,
            COUNT(*) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active', 'approved')) as paid_sales,
            COALESCE(SUM(total_amount) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as paid_revenue,
            COALESCE(SUM(total_amount), 0) as total_revenue
        FROM public.sales
        WHERE created_at BETWEEN start_date AND end_date
    )
    SELECT
        pv.unique_visitors,
        ps.total_sales,
        ps.pending_sales,
        ps.paid_sales,
        ps.paid_revenue as total_revenue,
        CASE 
            WHEN pv.unique_visitors > 0 
            THEN ROUND((ps.paid_sales::numeric / pv.unique_visitors::numeric) * 100, 2)
            ELSE 0 
        END as conversion_rate,
        CASE 
            WHEN ps.paid_sales > 0 
            THEN ROUND(ps.paid_revenue / ps.paid_sales, 2)
            ELSE 0 
        END as average_order_value
    FROM period_visits pv, period_sales ps;
END;
$$;

COMMENT ON FUNCTION public.get_analytics_period IS 'Busca métricas principais do dashboard por período (MP + AppMax)';

-- =====================================================
-- 2. VIEW: sales_by_gateway
-- =====================================================
-- Métricas agregadas por gateway (MP vs AppMax)

DROP VIEW IF EXISTS public.sales_by_gateway CASCADE;

CREATE VIEW public.sales_by_gateway AS
SELECT 
    COALESCE(s.payment_gateway, 'unknown') as payment_gateway,
    COUNT(*) as total_sales,
    COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')) as successful_sales,
    COALESCE(SUM(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as total_revenue,
    COALESCE(AVG(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as avg_ticket,
    ROUND(
        COALESCE(
            COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved'))::numeric / 
            NULLIF(COUNT(*)::numeric, 0) * 100,
            0
        ),
        2
    ) as approval_rate,
    COUNT(*) FILTER (WHERE s.fallback_used = true) as fallback_count,
    COALESCE(SUM(s.total_amount) FILTER (WHERE s.fallback_used = true), 0) as fallback_revenue
FROM public.sales s
GROUP BY COALESCE(s.payment_gateway, 'unknown');

COMMENT ON VIEW public.sales_by_gateway IS 'Métricas agregadas por gateway de pagamento (MP + AppMax)';

-- =====================================================
-- 3. VIEW: payment_gateway_performance
-- =====================================================
-- Performance diária por gateway

DROP VIEW IF EXISTS public.payment_gateway_performance CASCADE;

CREATE VIEW public.payment_gateway_performance AS
SELECT 
    COALESCE(s.payment_gateway, 'unknown') as payment_gateway,
    DATE(s.created_at) as sale_date,
    COUNT(*) as attempts,
    COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')) as approvals,
    COUNT(*) FILTER (WHERE s.order_status IN ('failed', 'refused', 'rejected')) as rejections,
    COALESCE(SUM(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as revenue,
    COALESCE(AVG(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as avg_ticket,
    ROUND(
        COALESCE(
            COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved'))::numeric / 
            NULLIF(COUNT(*)::numeric, 0) * 100,
            0
        ), 
        2
    ) as approval_rate
FROM public.sales s
GROUP BY COALESCE(s.payment_gateway, 'unknown'), DATE(s.created_at)
ORDER BY sale_date DESC, payment_gateway;

COMMENT ON VIEW public.payment_gateway_performance IS 'Performance diária de cada gateway de pagamento';

-- =====================================================
-- 4. VIEW: cascata_analysis
-- =====================================================
-- Análise do sistema de cascata MP → AppMax

DROP VIEW IF EXISTS public.cascata_analysis CASCADE;

CREATE VIEW public.cascata_analysis AS
WITH mp_attempts AS (
    SELECT 
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active', 'approved')) as approved,
        COUNT(*) FILTER (WHERE order_status IN ('failed', 'refused', 'rejected')) as rejected,
        COALESCE(SUM(total_amount) FILTER (WHERE order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as revenue
    FROM public.sales
    WHERE payment_gateway = 'mercadopago'
),
fallback_rescues AS (
    SELECT 
        COUNT(*) as rescued_count,
        COALESCE(SUM(total_amount), 0) as rescued_revenue
    FROM public.sales
    WHERE payment_gateway = 'appmax'
    AND fallback_used = true
    AND order_status IN ('paid', 'provisioning', 'active', 'approved')
),
appmax_direct AS (
    SELECT 
        COUNT(*) as direct_count,
        COALESCE(SUM(total_amount), 0) as direct_revenue
    FROM public.sales
    WHERE payment_gateway = 'appmax'
    AND (fallback_used = false OR fallback_used IS NULL)
    AND order_status IN ('paid', 'provisioning', 'active', 'approved')
)
SELECT
    COALESCE(mp.total_attempts, 0) as mp_total,
    COALESCE(mp.approved, 0) as mp_approved,
    COALESCE(mp.rejected, 0) as mp_rejected,
    COALESCE(mp.revenue, 0) as mp_revenue,
    ROUND(COALESCE((mp.approved::numeric / NULLIF(mp.total_attempts::numeric, 0)) * 100, 0), 2) as mp_approval_rate,
    
    COALESCE(fr.rescued_count, 0) as rescued_count,
    COALESCE(fr.rescued_revenue, 0) as rescued_revenue,
    ROUND(COALESCE((fr.rescued_count::numeric / NULLIF(mp.rejected::numeric, 0)) * 100, 0), 2) as rescue_rate,
    
    COALESCE(ad.direct_count, 0) as appmax_direct,
    COALESCE(ad.direct_revenue, 0) as appmax_direct_revenue,
    
    (COALESCE(mp.approved, 0) + COALESCE(fr.rescued_count, 0) + COALESCE(ad.direct_count, 0)) as total_sales,
    (COALESCE(mp.revenue, 0) + COALESCE(fr.rescued_revenue, 0) + COALESCE(ad.direct_revenue, 0)) as total_revenue
FROM mp_attempts mp
CROSS JOIN fallback_rescues fr
CROSS JOIN appmax_direct ad;

COMMENT ON VIEW public.cascata_analysis IS 'Análise completa do sistema de cascata MP → AppMax';

-- =====================================================
-- 5. FUNÇÃO RPC: get_gateway_stats
-- =====================================================
-- Função para buscar stats por gateway com filtro de data

DROP FUNCTION IF EXISTS public.get_gateway_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

CREATE FUNCTION public.get_gateway_stats(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    gateway TEXT,
    total_sales BIGINT,
    successful_sales BIGINT,
    total_revenue NUMERIC,
    avg_ticket NUMERIC,
    approval_rate NUMERIC,
    fallback_count BIGINT,
    fallback_revenue NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.payment_gateway, 'unknown') as gateway,
        COUNT(*) as total_sales,
        COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')) as successful_sales,
        COALESCE(SUM(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as total_revenue,
        COALESCE(AVG(s.total_amount) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as avg_ticket,
        ROUND(
            COALESCE(
                COUNT(*) FILTER (WHERE s.order_status IN ('paid', 'provisioning', 'active', 'approved'))::numeric / 
                NULLIF(COUNT(*)::numeric, 0) * 100,
                0
            ),
            2
        ) as approval_rate,
        COUNT(*) FILTER (WHERE s.fallback_used = true) as fallback_count,
        COALESCE(SUM(s.total_amount) FILTER (WHERE s.fallback_used = true AND s.order_status IN ('paid', 'provisioning', 'active', 'approved')), 0) as fallback_revenue
    FROM public.sales s
    WHERE s.created_at BETWEEN start_date AND end_date
    GROUP BY COALESCE(s.payment_gateway, 'unknown');
END;
$$;

COMMENT ON FUNCTION public.get_gateway_stats IS 'Busca estatísticas por gateway com filtro de período';

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway ON public.sales(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_sales_order_status ON public.sales(order_status);
CREATE INDEX IF NOT EXISTS idx_sales_customer_email ON public.sales(customer_email);

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    view_count INT;
    function_count INT;
    sales_count INT;
    mp_count INT;
    appmax_count INT;
BEGIN
    -- Contar views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('sales_by_gateway', 'payment_gateway_performance', 'cascata_analysis');
    
    -- Contar funções
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('get_gateway_stats', 'get_analytics_period');
    
    -- Contar vendas
    SELECT COUNT(*) INTO sales_count FROM public.sales;
    SELECT COUNT(*) INTO mp_count FROM public.sales WHERE payment_gateway = 'mercadopago';
    SELECT COUNT(*) INTO appmax_count FROM public.sales WHERE payment_gateway = 'appmax';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ VERIFICAÇÃO COMPLETA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Views criadas: %/3', view_count;
    RAISE NOTICE 'Funções criadas: %/2', function_count;
    RAISE NOTICE '';
    RAISE NOTICE '📊 DADOS ATUAIS:';
    RAISE NOTICE 'Total vendas: %', sales_count;
    RAISE NOTICE 'Vendas Mercado Pago: %', mp_count;
    RAISE NOTICE 'Vendas AppMax: %', appmax_count;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 8. TESTE DAS VIEWS
-- =====================================================

SELECT '📊 Teste: sales_by_gateway' as teste;
SELECT * FROM sales_by_gateway;

SELECT '📊 Teste: cascata_analysis' as teste;
SELECT * FROM cascata_analysis;

SELECT '📊 Teste: get_analytics_period (últimos 30 dias)' as teste;
SELECT * FROM get_analytics_period(NOW() - INTERVAL '30 days', NOW());

SELECT '📊 Teste: get_gateway_stats (últimos 30 dias)' as teste;
SELECT * FROM get_gateway_stats(NOW() - INTERVAL '30 days', NOW());
