-- =============================================
-- 🔍 VERIFICAR CONTAGEM DE REGISTROS
-- =============================================

SELECT 'sales' as tabela, COUNT(*) as total FROM public.sales
UNION ALL
SELECT 'webhook_logs', COUNT(*) FROM public.webhook_logs
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'abandoned_carts', COUNT(*) FROM public.abandoned_carts;

-- =============================================
-- 📊 VER TODAS AS 9 VENDAS
-- =============================================
SELECT 
  customer_name,
  customer_email,
  total_amount,
  status,
  payment_method,
  payment_gateway,
  created_at
FROM public.sales
ORDER BY created_at DESC;
