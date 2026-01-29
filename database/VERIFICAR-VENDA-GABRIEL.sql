-- =============================================
-- 🔍 VERIFICAR VENDA DO GABRIEL E PROVISIONING
-- =============================================
-- Execute no Supabase SQL Editor
-- =============================================

-- 1️⃣ BUSCAR VENDAS DO GABRIEL
SELECT 
    id,
    customer_name,
    customer_email,
    total_amount,
    order_status,
    payment_gateway,
    mercadopago_payment_id,
    appmax_order_id,
    created_at
FROM sales 
WHERE customer_email ILIKE '%gabriel%' 
   OR customer_name ILIKE '%gabriel%'
ORDER BY created_at DESC
LIMIT 10;

-- 2️⃣ VER FILA DE PROVISIONAMENTO
SELECT 
    pq.id as queue_id,
    pq.sale_id,
    pq.status as queue_status,
    pq.retry_count,
    pq.last_error,
    pq.completed_at,
    pq.created_at as queue_created_at
FROM provisioning_queue pq
ORDER BY pq.created_at DESC
LIMIT 20;

-- 3️⃣ VER LOGS DE INTEGRAÇÃO (criação de usuário/email)
SELECT 
    id,
    order_id,
    action,
    status,
    recipient_email,
    user_id,
    error_message,
    created_at
FROM integration_logs
WHERE recipient_email ILIKE '%gabriel%'
   OR order_id IN (
       SELECT id::text FROM sales 
       WHERE customer_email ILIKE '%gabriel%'
   )
ORDER BY created_at DESC
LIMIT 20;

-- 4️⃣ VER TODOS OS LOGS RECENTES DE INTEGRAÇÃO
SELECT 
    id,
    order_id,
    action,
    status,
    recipient_email,
    error_message,
    duration_ms,
    created_at
FROM integration_logs
ORDER BY created_at DESC
LIMIT 30;

-- 5️⃣ VER ITENS NA FILA QUE FALHARAM
SELECT 
    pq.*,
    s.customer_email,
    s.customer_name,
    s.order_status
FROM provisioning_queue pq
LEFT JOIN sales s ON pq.sale_id = s.id
WHERE pq.status IN ('pending', 'failed', 'processing')
ORDER BY pq.created_at DESC
LIMIT 20;

-- 6️⃣ VERIFICAR ESTRUTURA DA PROVISIONING_QUEUE
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'provisioning_queue'
ORDER BY ordinal_position;
