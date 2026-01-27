-- ========================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ========================================
-- Copie TODO este conteúdo e cole no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/egsmraszqnmosmtjuzhx/sql/new
-- ========================================

-- 1. Atualizar função get_analytics_period para incluir vendas pendentes
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

-- 2. Verificar dados atuais
SELECT 'Vendas por Gateway:' as info;
SELECT 
    payment_gateway,
    order_status,
    COUNT(*) as quantidade,
    SUM(total_amount) as valor_total
FROM sales
GROUP BY payment_gateway, order_status
ORDER BY payment_gateway, order_status;

-- 3. Testar a função atualizada
SELECT 'Métricas do Dashboard:' as info;
SELECT * FROM get_analytics_period(NOW() - INTERVAL '30 days', NOW());

-- 4. (OPCIONAL) Se quiser atualizar vendas pendentes para "paid" manualmente
-- DESCOMENTE as linhas abaixo para executar

-- UPDATE sales 
-- SET order_status = 'paid', status = 'paid'
-- WHERE order_status = 'pending_payment' 
-- AND payment_gateway = 'mercadopago';

-- 5. Verificar resultado final
SELECT 'Verificação Final:' as info;
SELECT * FROM sales_by_gateway;
