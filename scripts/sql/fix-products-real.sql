-- =====================================================
-- 🧹 LIMPAR PRODUTOS FAKE E INSERIR APENAS OS REAIS
-- =====================================================

-- 1️⃣ REMOVER TODOS OS PRODUTOS FAKE/ANTIGOS
DELETE FROM products 
WHERE external_id NOT IN ('32991339', '32989468', '32989503', '32989520');

-- 2️⃣ INSERIR/ATUALIZAR OS 4 PRODUTOS REAIS
INSERT INTO products (
  external_id,
  name,
  description,
  price,
  image_url,
  category,
  plan_type,
  is_active,
  is_featured,
  checkout_url,
  created_at,
  updated_at
) VALUES 
-- PRODUTO PRINCIPAL
(
  '32991339',
  'Método Gravador Médico',
  'Acesso completo e vitalício ao Método Gravador Médico. Transcrição automática de consultas, prontuários inteligentes e muito mais.',
  36.00,
  'https://gravadormedico.com.br/images/produto-principal.png',
  'one_time',
  'lifetime',
  true,
  true,
  'https://gravadormedico1768482029857.carrinho.app/one-checkout/ocudf/32991339',
  now(),
  now()
),

-- ORDER BUMP 1
(
  '32989468',
  'Conteúdo Infinito para Instagram',
  'Templates e ideias infinitas para seu Instagram médico. 100+ templates prontos, calendário de conteúdo e scripts para Reels.',
  29.90,
  'https://gravadormedico.com.br/images/conteudo-instagram.png',
  'bump',
  'one_time',
  true,
  false,
  null,
  now(),
  now()
),

-- ORDER BUMP 2
(
  '32989503',
  'Implementação Assistida',
  'Suporte dedicado para configurar tudo para você. Configuração completa, suporte 1:1 e integração personalizada.',
  97.00,
  'https://gravadormedico.com.br/images/implementacao-assistida.png',
  'bump',
  'service',
  true,
  false,
  null,
  now(),
  now()
),

-- ORDER BUMP 3
(
  '32989520',
  'Análise Inteligente de Consultas',
  'IA avançada para análise de consultas e insights. Análise por IA, relatórios automáticos e insights de pacientes.',
  39.90,
  'https://gravadormedico.com.br/images/analise-inteligente.png',
  'bump',
  'one_time',
  true,
  false,
  null,
  now(),
  now()
)
ON CONFLICT (external_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  plan_type = EXCLUDED.plan_type,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  checkout_url = EXCLUDED.checkout_url,
  updated_at = now();

-- ✅ VERIFICAR RESULTADO
SELECT 
  external_id,
  name,
  price,
  category,
  is_active,
  is_featured
FROM products
ORDER BY is_featured DESC, price DESC;
