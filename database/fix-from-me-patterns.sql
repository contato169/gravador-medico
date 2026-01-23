-- ================================================================
-- FIX DEFINITIVO: Corrigir from_me baseado em padrões identificados
-- ================================================================

-- ETAPA 1: Marcar mensagens do CLIENTE como from_me = FALSE
-- (mensagens curtas, testes, perguntas simples)
UPDATE whatsapp_messages
SET from_me = false
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me = true
  AND (
    -- Saudações curtas típicas do cliente
    content IN ('oi', 'Oi', 'ola', 'Ola', 'Olá', 'olá', 'Helcio', 'helcio', 'Helcio Mattos')
    
    -- Mensagens de teste/lixo do cliente
    OR content LIKE 'dasdsad%'
    OR content LIKE 'utuyuy%'
    OR content ~ '^[a-z]{6,}$'  -- strings aleatórias
    
    -- Perguntas típicas do cliente
    OR content LIKE '%tem alguem%'
    OR content LIKE '%O que recebo%'
    OR content LIKE '%como%compra%'
    OR content LIKE '%Qual seu nome%'
  OR content LIKE '%Qual seu nome?%'
    
    -- Mensagens muito curtas (1-3 caracteres) exceto as da automação
    OR (LENGTH(TRIM(content)) <= 3 AND content ~ '^[oO][iI]?[!]?$')
  );

-- ETAPA 2: Garantir que mensagens da AUTOMAÇÃO sejam from_me = TRUE
-- (mensagens longas, com emoji, começando com padrões específicos)
UPDATE whatsapp_messages
SET from_me = true
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me = false
  AND (
    -- Mensagens da automação/atendimento (começam com padrões específicos)
    content LIKE 'Olá! Bem-vindo%'
    OR content LIKE 'Olá! Sou a Gabriella%'
    OR content LIKE 'Oi Helcio!%'
    OR content LIKE 'Já começamos%'
    OR content LIKE 'Sim, claro!%'
    OR content LIKE 'Entendo que possa%'
    OR content LIKE 'Vou te explicar%'
  OR content LIKE 'Olá! Sou a Gabriella%'
  OR content LIKE '%Método Gravador Médico%'
  OR content LIKE '%Sou a sua assistente clínica virtual%'
  OR content LIKE '%sou do Gravador Médico%'
    
    -- Mensagens longas (mais de 50 caracteres = provavelmente resposta sua)
    OR LENGTH(content) > 50
  );

-- ================================================================
-- VERIFICAR RESULTADO
-- ================================================================

-- Ver estatísticas
SELECT 
  '👤 Mensagens do CLIENTE' as tipo,
  COUNT(*) as total
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me = false;

SELECT 
  '🟢 Mensagens MINHAS/AUTOMAÇÃO' as tipo,
  COUNT(*) as total
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
  AND from_me = true;

-- Ver últimas 50 mensagens após correção
SELECT 
  ROW_NUMBER() OVER (ORDER BY timestamp DESC) as num,
  LEFT(content, 50) as mensagem,
  CASE WHEN from_me THEN '🟢 VOCÊ' ELSE '👤 CLIENTE' END as quem,
  TO_CHAR(timestamp, 'DD/MM HH24:MI') as quando
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp DESC
LIMIT 50;
