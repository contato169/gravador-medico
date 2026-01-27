# 🔍 ANÁLISE COMPLETA - DASHBOARD DE VENDAS

**Data:** 27/01/2026  
**Status:** ✅ CORREÇÕES IMPLEMENTADAS

---

## 📊 RESUMO EXECUTIVO

### ✅ PROBLEMAS IDENTIFICADOS E CORRIGIDOS

| # | Problema | Status | Solução Implementada |
|---|----------|--------|----------------------|
| 1 | Webhook MP não salvava em `sales` | ✅ CORRIGIDO | `app/api/webhooks/mercadopago-v3/route.ts` atualizado |
| 2 | Campo `payment_gateway` não era preenchido | ✅ CORRIGIDO | Adicionado `payment_gateway: 'mercadopago'` |
| 3 | Views SQL podem não existir | ✅ SCRIPT CRIADO | `database/FIX-DASHBOARD-COMPLETO.sql` |
| 4 | Função RPC `get_analytics_period` ausente | ✅ SCRIPT CRIADO | Incluído no script SQL |
| 5 | Sem botão de sync para MP | ✅ CORRIGIDO | `SyncMercadoPagoButton` criado |

---

## �️ CORREÇÕES IMPLEMENTADAS

### 1. Webhook Mercado Pago (`app/api/webhooks/mercadopago-v3/route.ts`)

**Antes:** Webhook só buscava na tabela `orders` e não criava registro em `sales`.

**Depois:** 
- Busca detalhes do pagamento na API do MP
- Cria/atualiza customer
- **Cria registro em `sales` com `payment_gateway: 'mercadopago'`**
- Atualiza `checkout_attempts` relacionados
- Cria URL de redirecionamento

### 2. API de Sincronização MP (`app/api/admin/sync-mercadopago/route.ts`)

Nova API para sincronizar vendas históricas do Mercado Pago:

```
POST /api/admin/sync-mercadopago
Body: { days?: number } // Default: 30 dias
```

### 3. Botão de Sync no Dashboard (`components/dashboard/SyncMercadoPagoButton.tsx`)

Novo botão ao lado do "Sync AppMax" para sincronizar vendas do Mercado Pago.

### 4. Script SQL Completo (`database/FIX-DASHBOARD-COMPLETO.sql`)

Script que:
- Adiciona colunas faltantes (`mercadopago_payment_id`, `payment_gateway`, etc.)
- Cria função `get_analytics_period()`
- Cria views `sales_by_gateway`, `payment_gateway_performance`, `cascata_analysis`
- Cria função `get_gateway_stats()`
- Cria índices para performance

---

## 📋 PASSOS PARA ATIVAR AS CORREÇÕES

### Passo 1: Executar Script SQL no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo de: `database/FIX-DASHBOARD-COMPLETO.sql`
4. Verifique se todas as views foram criadas

### Passo 2: Configurar Variável de Ambiente

Certifique-se de que `MERCADOPAGO_ACCESS_TOKEN` está configurado no `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
```

### Passo 3: Deploy das Alterações

```bash
git add .
git commit -m "fix: sincronização dashboard vendas MP + AppMax"
git push
```

### Passo 4: Sincronizar Dados Históricos

No dashboard `/admin/dashboard`:
1. Clique no botão **"Sync MP"** para sincronizar vendas do Mercado Pago
2. Clique no botão **"Sync AppMax"** para garantir dados do AppMax
3. Clique em **"Atualizar"** para recarregar o dashboard

---

## 🧪 COMO TESTAR

### 1. Dashboard Principal (`/admin/dashboard`)

- **BigNumbers** deve mostrar receita total (MP + AppMax)
- **GatewayStatsCard** deve mostrar estatísticas separadas por gateway
- **Gráfico** deve incluir dados de ambos os gateways

### 2. Página de Vendas (`/admin/sales`)

- Lista todas as vendas com coluna `payment_gateway`
- Filtro por gateway funcionando

### 3. Testar Webhook MP

Envie um pagamento de teste pelo Mercado Pago e verifique:
- Registro criado em `sales` com `payment_gateway: 'mercadopago'`
- Dashboard atualizado com a nova venda

---

## 📁 ARQUIVOS MODIFICADOS/CRIADOS

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `app/api/webhooks/mercadopago-v3/route.ts` | MODIFICADO | Salva em `sales` com `payment_gateway` |
| `app/api/admin/sync-mercadopago/route.ts` | CRIADO | API de sincronização histórica |
| `components/dashboard/SyncMercadoPagoButton.tsx` | CRIADO | Botão de sync no dashboard |
| `app/admin/dashboard/page.tsx` | MODIFICADO | Adicionado botão Sync MP |
| `database/FIX-DASHBOARD-COMPLETO.sql` | CRIADO | Script SQL completo |
| `ANALISE-COMPLETA-DASHBOARD-VENDAS.md` | CRIADO | Esta documentação |

---

## 🎯 RESULTADO ESPERADO

Após aplicar todas as correções:

1. ✅ Vendas do **Mercado Pago** aparecem no dashboard
2. ✅ Vendas do **AppMax** continuam aparecendo
3. ✅ **Gateway Stats** mostra métricas separadas (MP vs AppMax)
4. ✅ **Cascata Analysis** mostra resgate de vendas recusadas
5. ✅ **Gráfico** inclui receita de ambos os gateways
6. ✅ **Página de vendas** lista todas com identificação do gateway
