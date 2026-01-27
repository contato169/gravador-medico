-- ========================================
-- FIX: Tabela webhook_logs para MP Enterprise
-- ========================================
-- Execute este script no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/egsmraszqnmosmtjuzhx/sql
-- ========================================

-- Verificar estrutura atual
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'webhook_logs'
ORDER BY ordinal_position;

-- ========================================
-- ADICIONAR COLUNAS FALTANTES
-- ========================================

-- Coluna raw_payload (JSONB para armazenar payload completo)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'raw_payload'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN raw_payload JSONB;
        RAISE NOTICE '✅ Coluna raw_payload adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna raw_payload já existe';
    END IF;
END $$;

-- Coluna provider (mercadopago, appmax, etc)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'provider'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN provider TEXT;
        RAISE NOTICE '✅ Coluna provider adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna provider já existe';
    END IF;
END $$;

-- Coluna event_id (ID do pagamento/evento)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'event_id'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN event_id TEXT;
        RAISE NOTICE '✅ Coluna event_id adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna event_id já existe';
    END IF;
END $$;

-- Coluna topic (tipo do evento: payment.created, payment.updated)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'topic'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN topic TEXT;
        RAISE NOTICE '✅ Coluna topic adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna topic já existe';
    END IF;
END $$;

-- Coluna processed (se foi processado com sucesso)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'processed'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN processed BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Coluna processed adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna processed já existe';
    END IF;
END $$;

-- Coluna processed_at (quando foi processado)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN processed_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Coluna processed_at adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna processed_at já existe';
    END IF;
END $$;

-- Coluna retry_count (tentativas de reprocessamento)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN retry_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Coluna retry_count adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna retry_count já existe';
    END IF;
END $$;

-- Coluna last_error (último erro ocorrido)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'last_error'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN last_error TEXT;
        RAISE NOTICE '✅ Coluna last_error adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna last_error já existe';
    END IF;
END $$;

-- Coluna processing_time_ms (tempo de processamento)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'processing_time_ms'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN processing_time_ms INTEGER;
        RAISE NOTICE '✅ Coluna processing_time_ms adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna processing_time_ms já existe';
    END IF;
END $$;

-- Coluna created_at (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhook_logs' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.webhook_logs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Coluna created_at adicionada';
    ELSE
        RAISE NOTICE '✓ Coluna created_at já existe';
    END IF;
END $$;

-- ========================================
-- CRIAR ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON public.webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON public.webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'webhook_logs'
ORDER BY ordinal_position;
