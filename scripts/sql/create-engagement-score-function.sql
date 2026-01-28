-- ============================================
-- FUNÇÃO RPC: calculate_engagement_score
-- Calcula o score de engajamento de clientes
-- baseado em dados reais de GA4, Meta Pixel e visitas
-- ============================================

-- Dropar função existente se houver
DROP FUNCTION IF EXISTS calculate_engagement_score(TEXT);
DROP FUNCTION IF EXISTS calculate_customer_engagement_score(TEXT);

-- Criar função para calcular score individual
CREATE OR REPLACE FUNCTION calculate_customer_engagement_score(p_email TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_paid_orders INTEGER := 0;
    v_total_orders INTEGER := 0;
    v_ltv NUMERIC := 0;
    v_days_since_last_purchase INTEGER := 999;
    v_total_visits INTEGER := 0;
    v_unique_pages INTEGER := 0;
    v_checkout_visits INTEGER := 0;
    v_has_utm BOOLEAN := FALSE;
    v_has_fbclid BOOLEAN := FALSE;
    v_has_gclid BOOLEAN := FALSE;
    v_first_purchase DATE;
    v_active_days INTEGER := 0;
BEGIN
    -- ============================================
    -- 1. DADOS DE VENDAS (máx 40 pontos)
    -- ============================================
    SELECT 
        COUNT(*) FILTER (WHERE status IN ('paid', 'approved')),
        COUNT(*),
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('paid', 'approved')), 0),
        COALESCE(
            EXTRACT(DAY FROM NOW() - MAX(created_at) FILTER (WHERE status IN ('paid', 'approved'))),
            999
        ),
        MIN(created_at)::DATE
    INTO v_paid_orders, v_total_orders, v_ltv, v_days_since_last_purchase, v_first_purchase
    FROM sales
    WHERE customer_email = p_email;

    -- Pontos por compras pagas (max 20)
    v_score := v_score + LEAST(v_paid_orders * 10, 20);
    
    -- Pontos por LTV (max 10)
    IF v_ltv >= 500 THEN v_score := v_score + 10;
    ELSIF v_ltv >= 200 THEN v_score := v_score + 7;
    ELSIF v_ltv >= 100 THEN v_score := v_score + 5;
    ELSIF v_ltv >= 50 THEN v_score := v_score + 3;
    ELSIF v_ltv > 0 THEN v_score := v_score + 1;
    END IF;
    
    -- Pontos por recência (max 10)
    IF v_days_since_last_purchase <= 7 THEN v_score := v_score + 10;
    ELSIF v_days_since_last_purchase <= 14 THEN v_score := v_score + 8;
    ELSIF v_days_since_last_purchase <= 30 THEN v_score := v_score + 5;
    ELSIF v_days_since_last_purchase <= 60 THEN v_score := v_score + 2;
    END IF;

    -- ============================================
    -- 2. DADOS DE ANALYTICS/VISITAS (máx 30 pontos)
    -- ============================================
    -- Buscar visitas pelo email (se tiver user_id) ou pelo IP das vendas
    WITH customer_ips AS (
        SELECT DISTINCT ip_address 
        FROM sales 
        WHERE customer_email = p_email AND ip_address IS NOT NULL
    ),
    customer_visits AS (
        SELECT 
            COUNT(*) as total_visits,
            COUNT(DISTINCT page_path) as unique_pages,
            COUNT(*) FILTER (WHERE page_path LIKE '%checkout%' OR page_path LIKE '%pagamento%') as checkout_visits,
            COUNT(DISTINCT DATE(created_at)) as visit_days,
            BOOL_OR(utm_source IS NOT NULL) as has_utm,
            BOOL_OR(fbclid IS NOT NULL OR fbc IS NOT NULL OR fbp IS NOT NULL) as has_fbclid,
            BOOL_OR(gclid IS NOT NULL) as has_gclid
        FROM analytics_visits
        WHERE 
            ip_address IN (SELECT ip_address FROM customer_ips)
            OR session_id IN (
                SELECT DISTINCT session_id FROM analytics_visits 
                WHERE ip_address IN (SELECT ip_address FROM customer_ips)
            )
    )
    SELECT 
        COALESCE(total_visits, 0),
        COALESCE(unique_pages, 0),
        COALESCE(checkout_visits, 0),
        COALESCE(visit_days, 0),
        COALESCE(has_utm, FALSE),
        COALESCE(has_fbclid, FALSE),
        COALESCE(has_gclid, FALSE)
    INTO v_total_visits, v_unique_pages, v_checkout_visits, v_active_days, v_has_utm, v_has_fbclid, v_has_gclid
    FROM customer_visits;

    -- Pontos por total de visitas (max 10)
    IF v_total_visits >= 20 THEN v_score := v_score + 10;
    ELSIF v_total_visits >= 10 THEN v_score := v_score + 7;
    ELSIF v_total_visits >= 5 THEN v_score := v_score + 5;
    ELSIF v_total_visits >= 2 THEN v_score := v_score + 3;
    ELSIF v_total_visits >= 1 THEN v_score := v_score + 1;
    END IF;
    
    -- Pontos por páginas únicas visitadas (max 10)
    IF v_unique_pages >= 10 THEN v_score := v_score + 10;
    ELSIF v_unique_pages >= 5 THEN v_score := v_score + 7;
    ELSIF v_unique_pages >= 3 THEN v_score := v_score + 5;
    ELSIF v_unique_pages >= 2 THEN v_score := v_score + 3;
    ELSIF v_unique_pages >= 1 THEN v_score := v_score + 1;
    END IF;
    
    -- Pontos por visitas ao checkout (max 5)
    IF v_checkout_visits >= 3 THEN v_score := v_score + 5;
    ELSIF v_checkout_visits >= 2 THEN v_score := v_score + 3;
    ELSIF v_checkout_visits >= 1 THEN v_score := v_score + 2;
    END IF;
    
    -- Pontos por dias ativos (max 5)
    IF v_active_days >= 5 THEN v_score := v_score + 5;
    ELSIF v_active_days >= 3 THEN v_score := v_score + 3;
    ELSIF v_active_days >= 2 THEN v_score := v_score + 2;
    END IF;

    -- ============================================
    -- 3. DADOS DE TRACKING/ATRIBUIÇÃO (máx 20 pontos)
    -- ============================================
    -- Pontos por origem de tráfego rastreada
    IF v_has_fbclid THEN v_score := v_score + 7; END IF;  -- Meta Pixel
    IF v_has_gclid THEN v_score := v_score + 7; END IF;   -- Google Ads
    IF v_has_utm THEN v_score := v_score + 6; END IF;     -- UTM tracking

    -- ============================================
    -- 4. DADOS DE INTERAÇÃO COM WHATSAPP (máx 10 pontos)
    -- ============================================
    -- Verificar se há mensagens do cliente no WhatsApp
    DECLARE
        v_whatsapp_messages INTEGER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_whatsapp_messages
        FROM whatsapp_messages wm
        WHERE 
            from_me = FALSE
            AND (
                -- Buscar por telefone do cliente
                wm.remote_jid LIKE '%' || (
                    SELECT REPLACE(REPLACE(REPLACE(customer_phone, '(', ''), ')', ''), '-', '')
                    FROM sales WHERE customer_email = p_email LIMIT 1
                ) || '%'
            );
        
        IF v_whatsapp_messages >= 5 THEN v_score := v_score + 10;
        ELSIF v_whatsapp_messages >= 3 THEN v_score := v_score + 7;
        ELSIF v_whatsapp_messages >= 1 THEN v_score := v_score + 5;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Ignora erros de WhatsApp
        NULL;
    END;

    -- Garantir que o score está entre 0 e 100
    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ATUALIZAR A VIEW customer_intelligence
-- para usar o novo cálculo de score
-- ============================================

-- Primeiro, vamos criar uma função para recalcular todos os scores
CREATE OR REPLACE FUNCTION refresh_customer_engagement_scores()
RETURNS void AS $$
BEGIN
    -- Esta função pode ser chamada periodicamente para atualizar os scores
    -- Por enquanto, o score é calculado on-the-fly na view
    RAISE NOTICE 'Engagement scores refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Criar view atualizada com o novo score
-- ============================================
CREATE OR REPLACE VIEW customer_intelligence_v2 AS
WITH customer_sales AS (
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
),
customer_visits AS (
    SELECT 
        s.customer_email,
        COUNT(DISTINCT av.id) as visit_count,
        COUNT(DISTINCT av.page_path) as unique_pages,
        COUNT(DISTINCT DATE(av.created_at)) as active_days
    FROM sales s
    LEFT JOIN analytics_visits av ON av.ip_address = s.ip_address
    WHERE s.ip_address IS NOT NULL
    GROUP BY s.customer_email
)
SELECT 
    cs.email,
    cs.name,
    cs.phone,
    cs.cpf,
    cs.total_orders,
    cs.paid_orders,
    cs.ltv,
    CASE WHEN cs.paid_orders > 0 THEN cs.ltv / cs.paid_orders ELSE 0 END as aov,
    cs.first_purchase,
    cs.last_purchase,
    EXTRACT(DAY FROM NOW() - cs.last_purchase)::INTEGER as days_since_last_purchase,
    COALESCE(cv.active_days, 1) as active_days,
    -- Segmentação
    CASE 
        WHEN cs.paid_orders >= 3 AND cs.ltv >= 100 THEN 'VIP'
        WHEN cs.paid_orders = 0 AND EXTRACT(DAY FROM NOW() - cs.last_purchase) > 30 THEN 'Churn Risk'
        WHEN EXTRACT(DAY FROM NOW() - cs.first_purchase) <= 30 THEN 'New'
        WHEN EXTRACT(DAY FROM NOW() - cs.last_purchase) > 60 THEN 'Dormant'
        ELSE 'Regular'
    END as segment,
    -- Score calculado pela função
    calculate_customer_engagement_score(cs.email) as engagement_score,
    cs.acquisition_source
FROM customer_sales cs
LEFT JOIN customer_visits cv ON cv.customer_email = cs.email;

-- ============================================
-- GRANT permissions
-- ============================================
GRANT EXECUTE ON FUNCTION calculate_customer_engagement_score(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_customer_engagement_score(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refresh_customer_engagement_scores() TO service_role;
GRANT SELECT ON customer_intelligence_v2 TO authenticated;
GRANT SELECT ON customer_intelligence_v2 TO service_role;

-- ============================================
-- Teste da função
-- ============================================
-- SELECT calculate_customer_engagement_score('bernadetebottene@gmail.com');
-- SELECT * FROM customer_intelligence_v2 WHERE paid_orders > 0 ORDER BY engagement_score DESC;
