-- =============================================
-- CORREÇÃO COMPLETA DA DASHBOARD
-- =============================================
-- Execute este script no Supabase SQL Editor
-- Corrige: analytics_visits, abandoned_carts, customer_sales_summary
-- =============================================

-- ========================================
-- FASE 1: CRIAR TABELAS FALTANTES
-- ========================================

-- 1️⃣ Tabela analytics_visits
CREATE TABLE IF NOT EXISTS public.analytics_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    page_path TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    country TEXT,
    city TEXT,
    is_online BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_analytics_visits_session ON public.analytics_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_created ON public.analytics_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_online ON public.analytics_visits(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_analytics_visits_last_seen ON public.analytics_visits(last_seen DESC);

-- RLS
ALTER TABLE public.analytics_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em analytics_visits" ON public.analytics_visits;
CREATE POLICY "Permitir tudo em analytics_visits" 
ON public.analytics_visits 
FOR ALL 
USING (true);

-- 2️⃣ Tabela abandoned_carts
CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'abandoned' CHECK (status IN ('abandoned', 'recovered', 'expired')),
    recovery_link TEXT,
    session_id TEXT,
    source TEXT DEFAULT 'website',
    utm_campaign TEXT,
    utm_medium TEXT,
    utm_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON public.abandoned_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON public.abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created ON public.abandoned_carts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session ON public.abandoned_carts(session_id);

-- RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em abandoned_carts" ON public.abandoned_carts;
CREATE POLICY "Permitir tudo em abandoned_carts" 
ON public.abandoned_carts 
FOR ALL 
USING (true);

-- ========================================
-- FASE 2: CRIAR VIEWS COM COALESCE
-- ========================================

-- 3️⃣ View customer_sales_summary (COM COALESCE para evitar undefined)
-- CALCULA as métricas a partir da tabela sales
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales') THEN
        DROP VIEW IF EXISTS public.customer_sales_summary CASCADE;
        EXECUTE '
        CREATE OR REPLACE VIEW public.customer_sales_summary AS
        SELECT 
            c.id,
            c.email,
            c.name,
            c.phone,
            COALESCE(COUNT(s.id), 0)::INTEGER as total_orders,
            COALESCE(SUM(CASE WHEN s.status IN (''approved'', ''paid'', ''completed'') THEN s.total_amount ELSE 0 END), 0)::NUMERIC as total_spent,
            COALESCE(AVG(CASE WHEN s.status IN (''approved'', ''paid'', ''completed'') THEN s.total_amount ELSE NULL END), 0)::NUMERIC as average_order_value,
            MAX(s.created_at) as last_purchase_at,
            MIN(s.created_at) as first_purchase_at,
            c.created_at,
            c.updated_at
        FROM public.customers c
        LEFT JOIN public.sales s ON c.email = s.customer_email
        GROUP BY c.id, c.email, c.name, c.phone, c.created_at, c.updated_at
        ORDER BY total_spent DESC NULLS LAST
        ';
        RAISE NOTICE 'View customer_sales_summary criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela customers ou sales não existe - pulando criação de customer_sales_summary';
    END IF;
END $$;

-- 4️⃣ View abandoned_carts_summary
DROP VIEW IF EXISTS public.abandoned_carts_summary CASCADE;
CREATE OR REPLACE VIEW public.abandoned_carts_summary AS
SELECT 
    status,
    COUNT(*)::INTEGER as total,
    COALESCE(SUM(total_amount), 0)::NUMERIC as total_value,
    COALESCE(AVG(total_amount), 0)::NUMERIC as avg_value
FROM public.abandoned_carts
GROUP BY status;

-- 5️⃣ View sales_by_day (vendas agrupadas por dia)
DROP VIEW IF EXISTS public.sales_by_day CASCADE;
CREATE OR REPLACE VIEW public.sales_by_day AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*)::INTEGER as total_sales,
    COALESCE(SUM(total_amount), 0)::NUMERIC as total_revenue,
    COALESCE(AVG(total_amount), 0)::NUMERIC as avg_order_value
FROM public.sales
WHERE status IN ('approved', 'paid', 'completed')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- ========================================
-- FASE 3: TRIGGERS PARA UPDATED_AT
-- ========================================

-- Função reutilizável
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para analytics_visits
DROP TRIGGER IF EXISTS update_analytics_visits_updated_at ON public.analytics_visits;
CREATE TRIGGER update_analytics_visits_updated_at 
    BEFORE UPDATE ON public.analytics_visits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para abandoned_carts
DROP TRIGGER IF EXISTS update_abandoned_carts_updated_at ON public.abandoned_carts;
CREATE TRIGGER update_abandoned_carts_updated_at 
    BEFORE UPDATE ON public.abandoned_carts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FASE 4: POPULAR DADOS DE TESTE
-- ========================================

-- Dados de teste para abandoned_carts (se estiver vazio)
INSERT INTO public.abandoned_carts (
    customer_email,
    customer_name,
    items,
    total_amount,
    status
)
SELECT 
    'teste' || generate_series || '@example.com',
    'Cliente Teste ' || generate_series,
    '[{"name": "Produto Teste", "price": 100}]'::jsonb,
    100.00,
    CASE WHEN generate_series % 3 = 0 THEN 'recovered' ELSE 'abandoned' END
FROM generate_series(1, 5)
ON CONFLICT DO NOTHING;

-- ========================================
-- FASE 5: VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se tudo foi criado
SELECT 
    'analytics_visits' as objeto,
    'TABLE' as tipo,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'analytics_visits'
    ) as existe
UNION ALL
SELECT 
    'abandoned_carts',
    'TABLE',
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'abandoned_carts'
    )
UNION ALL
SELECT 
    'customer_sales_summary',
    'VIEW',
    EXISTS(
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'customer_sales_summary'
    )
UNION ALL
SELECT 
    'abandoned_carts_summary',
    'VIEW',
    EXISTS(
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'abandoned_carts_summary'
    )
UNION ALL
SELECT 
    'sales_by_day',
    'VIEW',
    EXISTS(
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'sales_by_day'
    );

-- Contar registros
SELECT 
    'analytics_visits' as tabela,
    COUNT(*)::INTEGER as registros
FROM public.analytics_visits
UNION ALL
SELECT 
    'abandoned_carts',
    COUNT(*)::INTEGER
FROM public.abandoned_carts
UNION ALL
SELECT 
    'customers',
    COUNT(*)::INTEGER
FROM public.customers
UNION ALL
SELECT 
    'sales',
    COUNT(*)::INTEGER
FROM public.sales;
