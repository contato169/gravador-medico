-- =============================================
-- 🔍 DIAGNÓSTICO DE DADOS MERCADO PAGO
-- =============================================
-- Execute no Supabase SQL Editor
-- =============================================

-- 1️⃣ Verificar se as colunas necessárias existem
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('payment_gateway', 'mercadopago_payment_id', 'external_reference')
ORDER BY column_name;

-- 2️⃣ Ver todas as vendas por gateway
SELECT 
  payment_gateway,
  COUNT(*) as total_vendas,
  SUM(total_amount) as receita_total
FROM public.sales
GROUP BY payment_gateway;

-- 3️⃣ Ver últimas 10 vendas
SELECT 
  id,
  customer_name,
  customer_email,
  total_amount,
  status,
  payment_method,
  payment_gateway,
  mercadopago_payment_id,
  created_at
FROM public.sales
ORDER BY created_at DESC
LIMIT 10;

-- 4️⃣ Ver estrutura da tabela webhook_logs
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'webhook_logs'
ORDER BY ordinal_position;

-- 4.1️⃣ Ver últimos webhook_logs
SELECT *
FROM public.webhook_logs
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- 🔧 ADICIONAR COLUNAS FALTANTES (SE NECESSÁRIO)
-- =============================================

-- Adicionar coluna payment_gateway se não existir
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'appmax';

-- Adicionar coluna mercadopago_payment_id se não existir
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;

-- Adicionar coluna external_reference se não existir
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS external_reference TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_payment_gateway 
ON public.sales(payment_gateway);

CREATE INDEX IF NOT EXISTS idx_sales_mp_payment_id 
ON public.sales(mercadopago_payment_id);

-- =============================================
-- ✅ VERIFICAR NOVAMENTE
-- =============================================
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'sales' 
  AND column_name IN ('payment_gateway', 'mercadopago_payment_id', 'external_reference');
