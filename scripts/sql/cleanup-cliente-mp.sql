-- =============================================
-- 🧹 LIMPAR REGISTROS "CLIENTE MP" GENÉRICOS
-- =============================================
-- Remove vendas com dados genéricos do webhook MP
-- =============================================

DELETE FROM public.sales
WHERE customer_name = 'Cliente MP'
   OR customer_email = 'unknown@mercadopago.com'
   OR customer_email LIKE 'mp-%@pagamento.local';

-- Verificar resultado
SELECT 
  customer_name,
  customer_email,
  total_amount,
  status,
  payment_gateway
FROM public.sales
ORDER BY created_at DESC;
