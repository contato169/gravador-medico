-- ============================================
-- FUNÇÃO: calculate_customer_engagement_score
-- Score de engajamento baseado em dados reais
-- 
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD:
-- https://supabase.com/dashboard/project/egsmraszqnmosmtjuzhx/sql/new
-- ============================================

-- Dropar função existente
DROP FUNCTION IF EXISTS calculate_customer_engagement_score(TEXT);

-- Criar função
CREATE OR REPLACE FUNCTION calculate_customer_engagement_score(p_email TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_paid_orders INTEGER := 0;
    v_ltv NUMERIC := 0;
    v_days_since_last INTEGER := 999;
    v_total_visits INTEGER := 0;
    v_unique_pages INTEGER := 0;
    v_has_utm BOOLEAN := FALSE;
    v_has_fb BOOLEAN := FALSE;
    v_phone TEXT;
    v_wa_count INTEGER := 0;
BEGIN
    -- 1. VENDAS (40 pts max)
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('paid', 'approved')),
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('paid', 'approved')), 0),
        COALESCE(EXTRACT(DAY FROM NOW() - MAX(created_at) FILTER (WHERE status IN ('paid', 'approved'))), 999)::INTEGER,
        MAX(customer_phone)
    INTO v_paid_orders, v_ltv, v_days_since_last, v_phone
    FROM sales WHERE customer_email = p_email;

    v_score := v_score + LEAST(v_paid_orders * 10, 20);
    
    IF v_ltv >= 500 THEN v_score := v_score + 10;
    ELSIF v_ltv >= 200 THEN v_score := v_score + 7;
    ELSIF v_ltv >= 100 THEN v_score := v_score + 5;
    ELSIF v_ltv >= 50 THEN v_score := v_score + 3;
    ELSIF v_ltv > 0 THEN v_score := v_score + 1;
    END IF;
    
    IF v_days_since_last <= 7 THEN v_score := v_score + 10;
    ELSIF v_days_since_last <= 14 THEN v_score := v_score + 8;
    ELSIF v_days_since_last <= 30 THEN v_score := v_score + 5;
    ELSIF v_days_since_last <= 60 THEN v_score := v_score + 2;
    END IF;

    -- 2. ANALYTICS (30 pts max)
    WITH ips AS (
        SELECT DISTINCT ip_address FROM sales 
        WHERE customer_email = p_email AND ip_address IS NOT NULL
    )
    SELECT 
        COUNT(*),
        COUNT(DISTINCT page_path),
        BOOL_OR(utm_source IS NOT NULL),
        BOOL_OR(fbclid IS NOT NULL OR fbc IS NOT NULL OR fbp IS NOT NULL)
    INTO v_total_visits, v_unique_pages, v_has_utm, v_has_fb
    FROM analytics_visits WHERE ip_address IN (SELECT ip_address FROM ips);

    IF v_total_visits >= 20 THEN v_score := v_score + 10;
    ELSIF v_total_visits >= 10 THEN v_score := v_score + 7;
    ELSIF v_total_visits >= 5 THEN v_score := v_score + 5;
    ELSIF v_total_visits >= 2 THEN v_score := v_score + 3;
    ELSIF v_total_visits >= 1 THEN v_score := v_score + 1;
    END IF;
    
    IF v_unique_pages >= 10 THEN v_score := v_score + 10;
    ELSIF v_unique_pages >= 5 THEN v_score := v_score + 7;
    ELSIF v_unique_pages >= 3 THEN v_score := v_score + 5;
    ELSIF v_unique_pages >= 2 THEN v_score := v_score + 3;
    END IF;

    -- 3. TRACKING (15 pts max)
    IF v_has_fb THEN v_score := v_score + 8; END IF;
    IF v_has_utm THEN v_score := v_score + 7; END IF;

    -- 4. WHATSAPP (15 pts max)
    IF v_phone IS NOT NULL AND LENGTH(v_phone) > 8 THEN
        SELECT COUNT(*) INTO v_wa_count
        FROM whatsapp_messages
        WHERE from_me = FALSE
        AND remote_jid LIKE '%' || REGEXP_REPLACE(v_phone, '[^0-9]', '', 'g') || '%';
        
        IF v_wa_count >= 5 THEN v_score := v_score + 15;
        ELSIF v_wa_count >= 3 THEN v_score := v_score + 10;
        ELSIF v_wa_count >= 1 THEN v_score := v_score + 5;
        END IF;
    END IF;

    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION calculate_customer_engagement_score(TEXT) TO authenticated, service_role, anon;

-- ============================================
-- ATUALIZAR VIEW customer_intelligence
-- para usar o novo cálculo
-- ============================================
DROP VIEW IF EXISTS customer_intelligence;

CREATE OR REPLACE VIEW customer_intelligence AS
WITH base AS (
    SELECT 
        customer_email as email,
        MAX(customer_name) as name,
        MAX(customer_phone) as phone,
        MAX(customer_cpf) as cpf,
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status IN ('paid', 'approved')) as paid_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('paid', 'approved')), 0) as ltv,
        MIN(created_at) as first_purchase,
        MAX(created_at) as last_purchase,
        MAX(utm_source) as acquisition_source
    FROM sales
    WHERE customer_email IS NOT NULL
    GROUP BY customer_email
)
SELECT 
    email,
    name,
    phone,
    cpf,
    total_orders,
    paid_orders,
    ltv,
    CASE WHEN paid_orders > 0 THEN ltv / paid_orders ELSE 0 END as aov,
    first_purchase,
    last_purchase,
    COALESCE(EXTRACT(DAY FROM NOW() - last_purchase), 0)::INTEGER as days_since_last_purchase,
    1 as active_days,
    CASE 
        WHEN paid_orders >= 3 AND ltv >= 100 THEN 'VIP'
        WHEN paid_orders = 0 AND EXTRACT(DAY FROM NOW() - last_purchase) > 30 THEN 'Churn Risk'
        WHEN EXTRACT(DAY FROM NOW() - first_purchase) <= 30 THEN 'New'
        WHEN EXTRACT(DAY FROM NOW() - last_purchase) > 60 THEN 'Dormant'
        ELSE 'Regular'
    END as segment,
    calculate_customer_engagement_score(email) as engagement_score,
    acquisition_source
FROM base;

-- Grant select on view
GRANT SELECT ON customer_intelligence TO authenticated, service_role, anon;

-- ============================================
-- TESTE
-- ============================================
SELECT email, name, engagement_score 
FROM customer_intelligence 
WHERE paid_orders > 0 
ORDER BY engagement_score DESC 
LIMIT 5;
