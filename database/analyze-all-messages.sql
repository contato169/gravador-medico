-- ================================================================
-- ANÁLISE: Identificar padrões para corrigir from_me
-- ================================================================

-- Ver todas as mensagens dessa conversa para identificar padrões manualmente
SELECT 
  ROW_NUMBER() OVER (ORDER BY timestamp ASC) as num,
  LEFT(content, 60) as mensagem,
  from_me as from_me_atual,
  TO_CHAR(timestamp, 'DD/MM HH24:MI:SS') as quando,
  message_type as tipo
FROM whatsapp_messages
WHERE remote_jid = '5521988960217@s.whatsapp.net'
ORDER BY timestamp ASC;

-- ================================================================
-- IMPORTANTE: 
-- Analise o resultado acima e identifique manualmente:
-- - Quais mensagens são CLARAMENTE suas (respostas elaboradas, automação)
-- - Quais são CLARAMENTE do cliente (perguntas, "oi", "tem alguem ai", etc)
-- 
-- Depois rodamos um UPDATE baseado no conteúdo específico
-- ================================================================
