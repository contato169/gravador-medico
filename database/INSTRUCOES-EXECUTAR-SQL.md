# 🚀 INSTRUÇÕES: Executar Correção Final do Dashboard

## ⚠️ ATENÇÃO: EXECUTAR ANTES DO DEPLOY

Este arquivo contém as instruções para executar a correção SQL que cria todas as tabelas e views faltantes.

---

## 📋 Passo a Passo

### 1️⃣ Acessar o Supabase SQL Editor

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: **GRAVADOR MÉDICO**
3. No menu lateral esquerdo, clique em **SQL Editor**

---

### 2️⃣ Executar o Script de Correção

1. Abra o arquivo: `/database/CORRECAO-FINAL-DASHBOARD.sql`
2. **Copie TODO o conteúdo do arquivo** (246 linhas)
3. No SQL Editor do Supabase:
   - Clique em **"New Query"** (Nova Consulta)
   - Cole todo o conteúdo do arquivo
   - Clique em **"Run"** (Executar) ou pressione `Ctrl+Enter`

---

### 3️⃣ Verificar Execução

Após executar, você deve ver na parte inferior:

```
✅ Success! No rows returned
```

Ou mensagens como:

```
CREATE TABLE
CREATE INDEX
CREATE POLICY
CREATE VIEW
CREATE TRIGGER
INSERT 0 5
```

**Isso significa que tudo foi criado com sucesso!**

---

### 4️⃣ Confirmar Criação das Tabelas

Execute as queries de verificação (já estão no final do arquivo SQL):

```sql
-- Verificar se analytics_visits existe
SELECT COUNT(*) FROM analytics_visits;

-- Verificar se abandoned_carts existe
SELECT COUNT(*) FROM abandoned_carts;

-- Verificar se VIEW customer_sales_summary existe
SELECT * FROM customer_sales_summary LIMIT 5;

-- Verificar se VIEW sales_by_day existe
SELECT * FROM sales_by_day LIMIT 5;
```

**Resultados esperados:**
- `analytics_visits`: 0 registros (tabela vazia, mas existe)
- `abandoned_carts`: 5 registros (dados de teste inseridos)
- `customer_sales_summary`: Deve mostrar resumo de clientes
- `sales_by_day`: Deve mostrar vendas agrupadas por dia

---

## 🎯 O Que Este Script Cria?

### ✅ Tabelas
1. **`analytics_visits`**
   - Rastreia visitas de usuários ao site
   - Campos: session_id, page_path, user_agent, is_online, ip_address, country, city
   - **Resolve**: Erro 404 no AnalyticsTracker

2. **`abandoned_carts`**
   - Armazena carrinhos abandonados
   - Campos: customer_email, items (JSONB), total_amount, status, recovery_link
   - **Resolve**: Erro 404 PGRST205 no Dashboard

### ✅ Views (Consultas Materializadas)
1. **`customer_sales_summary`**
   - Resumo de vendas por cliente
   - **Usa COALESCE** para evitar erros de `undefined`
   - **Resolve**: Erro `.toFixed() is not a function`

2. **`abandoned_carts_summary`**
   - Resumo de carrinhos abandonados por status

3. **`sales_by_day`**
   - Vendas agrupadas por dia (útil para gráficos)

### ✅ Triggers
- **`update_analytics_visits_updated_at`**: Atualiza `updated_at` automaticamente
- **`update_abandoned_carts_updated_at`**: Atualiza `updated_at` automaticamente

### ✅ Políticas RLS (Row Level Security)
- Todas as tabelas têm políticas de segurança configuradas
- `analytics_visits`: Público pode ler/inserir/atualizar
- `abandoned_carts`: Público pode ler/inserir/atualizar

---

## 🔥 Após Executar o SQL

### Próximos passos:

1. ✅ **SQL executado** (você acabou de fazer)
2. ✅ **Código refatorado** (já feito - salesUtils.ts)
3. ✅ **Supabase client corrigido** (trim() adicionado)
4. 🚀 **FAZER DEPLOY** (próximo passo)

---

## 🚀 Deploy

Agora execute:

```bash
git add .
git commit -m "fix: Corrigir dashboard - criar tabelas faltantes + normalizar datas + fix realtime"
git push origin main
```

O Vercel vai fazer o deploy automático.

---

## 🎉 Resultado Esperado

Após o deploy, o Dashboard deve:

- ✅ Mostrar mesma quantidade de vendas que a página de Vendas
- ✅ Não ter mais erros 404 (analytics_visits, abandoned_carts)
- ✅ Não ter mais erros PGRST205 (tabelas não encontradas)
- ✅ Realtime/WebSocket funcionando sem erros WSS
- ✅ Filtros de data funcionando corretamente
- ✅ Fallback automático se filtro retornar vazio

---

## 🆘 Problemas?

Se algo der errado:

### Erro: "relation already exists"
Significa que a tabela já existe. **Isso é OK!** O script tem `IF NOT EXISTS`.

### Erro: "permission denied"
Você precisa estar logado como **owner** do projeto no Supabase.

### Erro: "syntax error"
Certifique-se de copiar **TODO** o conteúdo do arquivo SQL, não apenas parte dele.

---

## 📊 Checklist Final

Antes de fazer deploy, confirme:

- [ ] SQL executado no Supabase SQL Editor
- [ ] Tabelas `analytics_visits` e `abandoned_carts` criadas
- [ ] Views `customer_sales_summary` e `sales_by_day` criadas
- [ ] 5 registros de teste inseridos em `abandoned_carts`
- [ ] Queries de verificação retornaram resultados

**Tudo confirmado? Pode fazer o deploy! 🚀**
