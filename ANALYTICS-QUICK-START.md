# 🚀 QUICK START - Executar em 5 Minutos

## 📋 Passo a Passo Rápido

### 1. Abra o SQL Editor do Supabase
```
https://supabase.com/dashboard/project/SEU_PROJETO/sql
```

### 2. Execute ESTE SQL (Copie e Cole Tudo)

```sql
-- ==========================================
-- 📊 ANALYTICS AVANÇADO - QUICK SETUP
-- ==========================================

-- 1️⃣ VIEW: MARKETING ATTRIBUTION
CREATE OR REPLACE VIEW public.marketing_attribution AS
WITH completed_sales AS (
    SELECT 
        customer_email,
        total_amount,
        created_at,
        payment_method
    FROM public.checkout_attempts
    WHERE status IN ('paid', 'approved', 'completed')
),
traffic_sources AS (
    SELECT 
        id as visit_id,
        session_id,
        user_agent,
        COALESCE(
            utm_source, 
            CASE 
                WHEN referrer_domain LIKE '%google%' THEN 'google-organic'
                WHEN referrer_domain LIKE '%facebook%' OR referrer_domain LIKE '%instagram%' THEN 'social-organic'
                WHEN referrer_domain LIKE '%youtube%' THEN 'youtube'
                WHEN referrer_domain LIKE '%linkedin%' THEN 'linkedin'
                WHEN referrer_domain IS NULL THEN 'direct'
                ELSE referrer_domain 
            END
        ) as source,
        COALESCE(utm_medium, 'organic') as medium,
        COALESCE(utm_campaign, 'none') as campaign,
        created_at
    FROM public.analytics_visits
    WHERE created_at >= NOW() - INTERVAL '90 days'
)
SELECT 
    ts.source,
    ts.medium,
    ts.campaign,
    COUNT(DISTINCT ts.visit_id) as visitors,
    COUNT(DISTINCT ts.session_id) as sessions,
    COUNT(DISTINCT cs.customer_email) as sales_count,
    COALESCE(SUM(cs.total_amount), 0) as total_revenue,
    CASE 
        WHEN COUNT(DISTINCT ts.session_id) > 0 
        THEN ROUND((COUNT(DISTINCT cs.customer_email)::numeric / COUNT(DISTINCT ts.session_id)::numeric) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    CASE 
        WHEN COUNT(DISTINCT cs.customer_email) > 0 
        THEN ROUND(COALESCE(SUM(cs.total_amount), 0) / COUNT(DISTINCT cs.customer_email), 2)
        ELSE 0 
    END as average_order_value,
    MODE() WITHIN GROUP (ORDER BY 
        CASE 
            WHEN ts.user_agent LIKE '%Mobile%' OR ts.user_agent LIKE '%Android%' THEN 'mobile'
            WHEN ts.user_agent LIKE '%Tablet%' OR ts.user_agent LIKE '%iPad%' THEN 'tablet'
            ELSE 'desktop'
        END
    ) as primary_device
FROM 
    traffic_sources ts
    LEFT JOIN completed_sales cs ON 
        cs.created_at BETWEEN ts.created_at AND (ts.created_at + INTERVAL '24 hours')
GROUP BY 
    ts.source, ts.medium, ts.campaign
ORDER BY 
    total_revenue DESC, conversion_rate DESC;

-- 2️⃣ VIEW: FUNIL DE CONVERSÃO
CREATE OR REPLACE VIEW public.analytics_funnel AS
SELECT
    (SELECT COUNT(DISTINCT session_id) 
     FROM public.analytics_visits 
     WHERE created_at > NOW() - INTERVAL '30 days') as step_visitors,
    
    (SELECT COUNT(DISTINCT session_id) 
     FROM public.analytics_visits 
     WHERE (page_path LIKE '%checkout%' OR page_path LIKE '%pricing%' OR page_path LIKE '%plano%')
     AND created_at > NOW() - INTERVAL '30 days') as step_interested,
    
    (SELECT COUNT(*) 
     FROM public.checkout_attempts 
     WHERE created_at > NOW() - INTERVAL '30 days') as step_checkout_started,
    
    (SELECT COUNT(*) 
     FROM public.checkout_attempts 
     WHERE status IN ('paid', 'approved', 'completed')
     AND created_at > NOW() - INTERVAL '30 days') as step_purchased;

-- 3️⃣ VIEW: HEALTH METRICS (KPIs com Delta)
CREATE OR REPLACE VIEW public.analytics_health AS
WITH current_period AS (
    SELECT
        COUNT(DISTINCT av.session_id) as unique_visitors,
        COUNT(DISTINCT ca.id) FILTER (WHERE ca.status IN ('paid', 'approved', 'completed')) as sales,
        COALESCE(SUM(ca.total_amount) FILTER (WHERE ca.status IN ('paid', 'approved', 'completed')), 0) as revenue,
        COALESCE(AVG(ca.total_amount) FILTER (WHERE ca.status IN ('paid', 'approved', 'completed')), 0) as aov,
        COALESCE(AVG(EXTRACT(EPOCH FROM (av.last_seen - av.created_at))), 0) as avg_time_on_site
    FROM public.analytics_visits av
    LEFT JOIN public.checkout_attempts ca ON ca.created_at BETWEEN av.created_at AND av.created_at + INTERVAL '24 hours'
    WHERE av.created_at >= NOW() - INTERVAL '30 days'
),
previous_period AS (
    SELECT
        COUNT(DISTINCT av.session_id) as unique_visitors,
        COUNT(DISTINCT ca.id) FILTER (WHERE ca.status IN ('paid', 'approved', 'completed')) as sales,
        COALESCE(SUM(ca.total_amount) FILTER (WHERE ca.status IN ('paid', 'approved', 'completed')), 0) as revenue,
        COALESCE(AVG(ca.total_amount) FILTER (WHERE ca.status IN ('paid', 'approved', 'completed')), 0) as aov,
        COALESCE(AVG(EXTRACT(EPOCH FROM (av.last_seen - av.created_at))), 0) as avg_time_on_site
    FROM public.analytics_visits av
    LEFT JOIN public.checkout_attempts ca ON ca.created_at BETWEEN av.created_at AND av.created_at + INTERVAL '24 hours'
    WHERE av.created_at >= NOW() - INTERVAL '60 days' AND av.created_at < NOW() - INTERVAL '30 days'
)
SELECT
    cp.unique_visitors,
    cp.sales,
    cp.revenue,
    ROUND(cp.aov, 2) as average_order_value,
    ROUND(cp.avg_time_on_site, 0) as avg_time_seconds,
    CASE 
        WHEN cp.unique_visitors > 0 
        THEN ROUND((cp.sales::numeric / cp.unique_visitors::numeric) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    CASE 
        WHEN pp.unique_visitors > 0 
        THEN ROUND(((cp.unique_visitors::numeric - pp.unique_visitors::numeric) / pp.unique_visitors::numeric) * 100, 1)
        ELSE 0 
    END as visitors_change,
    CASE 
        WHEN pp.revenue > 0 
        THEN ROUND(((cp.revenue - pp.revenue) / pp.revenue) * 100, 1)
        ELSE 0 
    END as revenue_change,
    CASE 
        WHEN pp.aov > 0 
        THEN ROUND(((cp.aov - pp.aov) / pp.aov) * 100, 1)
        ELSE 0 
    END as aov_change,
    CASE 
        WHEN pp.avg_time_on_site > 0 
        THEN ROUND(((cp.avg_time_on_site - pp.avg_time_on_site) / pp.avg_time_on_site) * 100, 1)
        ELSE 0 
    END as time_change
FROM current_period cp, previous_period pp;

-- 4️⃣ VIEW: VISITANTES ONLINE
CREATE OR REPLACE VIEW public.analytics_visitors_online AS
SELECT 
    COUNT(DISTINCT session_id) as online_count,
    COUNT(DISTINCT CASE WHEN user_agent LIKE '%Mobile%' THEN session_id END) as mobile_count,
    COUNT(DISTINCT CASE WHEN user_agent NOT LIKE '%Mobile%' THEN session_id END) as desktop_count
FROM public.analytics_visits
WHERE last_seen >= NOW() - INTERVAL '5 minutes'
AND is_online = true;

-- 5️⃣ ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at ON public.analytics_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_session_id ON public.analytics_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_utm_source ON public.analytics_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_last_seen ON public.analytics_visits(last_seen) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_checkout_attempts_created_status ON public.checkout_attempts(created_at DESC, status);

-- ✅ PRONTO! Agora teste:
SELECT 'Analytics Views criadas com sucesso!' as status;
```

### 3. Verifique se Funcionou

Execute estes comandos de teste:

```sql
-- Teste 1: Ver estrutura da atribuição
SELECT * FROM marketing_attribution LIMIT 3;

-- Teste 2: Ver KPIs de saúde
SELECT * FROM analytics_health;

-- Teste 3: Ver funil
SELECT * FROM analytics_funnel;

-- Teste 4: Ver visitantes online
SELECT * FROM analytics_visitors_online;
```

**✅ Se todas as queries retornarem sem erro = Sucesso!**

(É normal estarem vazias se ainda não há dados)

---

## 🧪 (OPCIONAL) Popular com Dados de Teste

Se quiser ver o dashboard funcionando imediatamente, execute:

```sql
-- DADOS DE TESTE (30 visitantes simulados)
INSERT INTO public.analytics_visits (session_id, page_path, last_seen, is_online, user_agent, device_type, referrer_domain, utm_source, utm_medium, utm_campaign, created_at) VALUES
  ('session_ga_1', '/pricing', NOW() - INTERVAL '1 day', false, 'Mozilla/5.0 (Windows NT 10.0)', 'desktop', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '1 day'),
  ('session_ga_2', '/checkout', NOW() - INTERVAL '2 days', false, 'Mozilla/5.0 (Windows NT 10.0)', 'desktop', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '2 days'),
  ('session_ig_1', '/pricing', NOW() - INTERVAL '1 day', false, 'Mozilla/5.0 (iPhone)', 'mobile', 'instagram.com', 'instagram', 'social', 'story-ads', NOW() - INTERVAL '1 day'),
  ('session_ig_2', '/checkout', NOW() - INTERVAL '2 days', false, 'Mozilla/5.0 (iPhone)', 'mobile', 'instagram.com', 'instagram', 'social', 'story-ads', NOW() - INTERVAL '2 days'),
  ('session_online_1', '/pricing', NOW() - INTERVAL '1 minute', true, 'Mozilla/5.0 (Windows NT 10.0)', 'desktop', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '5 minutes'),
  ('session_online_2', '/checkout', NOW() - INTERVAL '2 minutes', true, 'Mozilla/5.0 (iPhone)', 'mobile', 'instagram.com', 'instagram', 'social', 'story-ads', NOW() - INTERVAL '3 minutes');

-- Verificar
SELECT utm_source, COUNT(*) as visitantes FROM analytics_visits GROUP BY utm_source;
SELECT * FROM analytics_visitors_online;
```

---

## 🎯 Próximo Passo: Ativar no Layout

**Arquivo:** `app/layout.tsx` (raiz do site público)

```tsx
'use client'

import { useAnalytics } from '@/lib/useAnalytics'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useAnalytics() // ✅ Uma linha!
  
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

---

## 📊 Acessar Dashboard

```
https://seusite.com/admin/analytics
```

ou localmente:

```
http://localhost:3000/admin/analytics
```

---

## ✅ Checklist de Validação

- [ ] SQL executado sem erros
- [ ] 4 views criadas (attribution, funnel, health, online)
- [ ] Índices criados
- [ ] (Opcional) Dados de teste inseridos
- [ ] Hook ativado no layout
- [ ] Dashboard acessível em `/admin/analytics`
- [ ] Contador "Visitantes Online" funcionando

---

## 🐛 Se Der Erro

### Erro: "relation analytics_visits does not exist"

**Causa:** Tabela base não existe.

**Solução:** Execute primeiro o `supabase-analytics-schema.sql` completo.

---

### Erro: "permission denied for view"

**Causa:** RLS (Row Level Security) ativo.

**Solução:**
```sql
-- Desativar RLS nas views (são read-only)
ALTER VIEW marketing_attribution OWNER TO postgres;
ALTER VIEW analytics_health OWNER TO postgres;
ALTER VIEW analytics_funnel OWNER TO postgres;
ALTER VIEW analytics_visitors_online OWNER TO postgres;
```

---

### Erro: "MODE() WITHIN GROUP not supported"

**Causa:** Postgres < 14.

**Solução:** Remova a parte de `primary_device` da view ou atualize o Postgres.

---

## 🎉 Pronto!

**Tempo total:** < 5 minutos  
**Resultado:** Analytics profissional nível Google Analytics 4  

Agora você pode:
- ✅ Ver de onde vem o dinheiro
- ✅ Identificar canais que convertem melhor
- ✅ Ver onde o funil trava
- ✅ Monitorar visitantes online em tempo real

**Próximo passo:** Adicionar UTMs nas campanhas e começar a rastrear!

```
https://seusite.com/?utm_source=instagram&utm_campaign=lancamento
```

---

**Criado para:** Gravador Médico  
**Data:** 21/01/2026  
**Versão:** Quick Start v1.0
