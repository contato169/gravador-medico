# 🔧 CORREÇÕES CRÍTICAS NO CHECKOUT

## 📋 Problemas Corrigidos

### ❌ ERRO 1: Falha ao Salvar Carrinho Abandonado (Supabase 400/406)

**Sintoma:**
- Console mostrava: `Failed to load resource: 400` e `406` na rota `abandoned_carts`
- Erro: `Could not find the 'customer_phone' column of 'abandoned_carts' in the schema cache`

**Causa:**
- Schema da tabela no Supabase estava desatualizado ou faltando colunas
- Código tentava inserir/atualizar campos que não existiam
- Erro bloqueava o fluxo do checkout

**Solução Implementada:**

1. **Código mais robusto** (`lib/abandonedCart.ts`):
   ```typescript
   // ✅ Envia APENAS campos com valor (não envia undefined/null)
   const cartData: any = { session_id, status }
   if (data.customer_name) cartData.customer_name = data.customer_name
   if (data.customer_email) cartData.customer_email = data.customer_email
   // ... etc
   ```

2. **Não bloqueia o checkout**:
   - Se salvar carrinho falhar, apenas loga o erro
   - Checkout continua normalmente
   - Retorna ID existente em caso de erro de UPDATE

3. **Logs detalhados**:
   ```typescript
   console.error('❌ Erro ao atualizar carrinho abandonado:', error)
   console.error('📦 Dados que tentamos enviar:', cartData)
   ```

4. **Script SQL de correção** (`database/FIX-ABANDONED-CARTS-SCHEMA.sql`):
   - Garante que todas as colunas necessárias existem
   - Cria índices para performance
   - Atualiza políticas RLS para permitir INSERT/UPDATE anônimo

**Como aplicar o fix no banco:**
```bash
# Execute o script SQL no Supabase SQL Editor:
# database/FIX-ABANDONED-CARTS-SCHEMA.sql
```

---

### ❌ ERRO 2: Mercado Pago Não Processa e Não Gera Log (402)

**Sintoma:**
- Token do MP era gerado: `✅ Token gerado: 56d7f07a...`
- Mas venda não aparecia no painel do Mercado Pago
- Apenas AppMax recebia (fallback)
- API retornava erro 402

**Causa:**
- Erro acontecia ANTES do MP processar
- Logs insuficientes para debug
- Não sabíamos o payload exato enviado
- Não sabíamos a resposta exata do MP

**Solução Implementada:**

1. **Logs DETALHADOS do Payload** (`app/api/checkout/enterprise/route.ts`):
   ```typescript
   console.log('📦 PAYLOAD ENVIADO PARA MERCADO PAGO:', JSON.stringify({
     transaction_amount: mpPayload.transaction_amount,
     payment_method_id: mpPayload.payment_method_id,
     installments: mpPayload.installments,
     payer_email: mpPayload.payer.email,
     payer_cpf: mpPayload.payer.identification.number,
     external_reference: mpPayload.external_reference,
     has_token: !!mpPayload.token
   }, null, 2))
   ```

2. **Logs DETALHADOS da Resposta**:
   ```typescript
   console.log(`📊 RESPOSTA DO MERCADO PAGO (${mpResponseTime}ms):`, JSON.stringify({
     status: mpResult.status,
     status_detail: mpResult.status_detail,
     payment_id: mpResult.id,
     http_status: mpResponse.status,
     message: mpResult.message,
     cause: mpResult.cause
   }, null, 2))
   ```

3. **Logs de Erro Completos**:
   ```typescript
   if (!mpResponse.ok || mpResult.status !== 'approved') {
     console.error('❌ MERCADO PAGO RETORNOU ERRO OU RECUSA:')
     console.error('HTTP Status:', mpResponse.status)
     console.error('Response completa:', JSON.stringify(mpResult, null, 2))
   }
   ```

4. **Captura de Erros de Rede**:
   ```typescript
   console.error('❌ ERRO DE REDE/FETCH NO MERCADO PAGO:')
   console.error('Nome do erro:', fetchError.name)
   console.error('Mensagem:', fetchError.message)
   console.error('Stack:', fetchError.stack)
   ```

5. **Log quando Fallback é acionado**:
   ```typescript
   console.log('🔄 FALLBACK ACIONADO - Mercado Pago falhou ou recusou')
   console.log('📦 Dados AppMax recebidos:', {...})
   ```

---

## 🧪 Como Testar

### 1. Verificar Correção do Carrinho Abandonado:

1. Abra o checkout: `https://seu-site.com/checkout`
2. Abra Console do navegador (F12)
3. Preencha alguns dados (nome, email)
4. Veja os logs:
   ```
   💾 Atualizando carrinho existente: UUID
   ✅ Carrinho atualizado: UUID
   ```
5. **Não deve** aparecer erro 400/406

### 2. Verificar Logs do Mercado Pago:

1. Faça uma compra de teste no checkout
2. No **terminal do servidor** (onde roda `npm run dev`), veja:

   ```bash
   🏢 [ENTERPRISE] Iniciando checkout...
   📦 Dados recebidos no checkout: {
     "amount": 36,
     "payment_method": "credit_card",
     "has_mpToken": true,
     ...
   }
   
   💳 [1/2] Tentando Mercado Pago...
   🔐 Token MP recebido: 56d7f07a012e4454...
   📦 PAYLOAD ENVIADO PARA MERCADO PAGO: {
     "transaction_amount": 36,
     "payment_method_id": "credit_card",
     "installments": 1,
     "payer_email": "teste@email.com",
     "payer_cpf": "12345678900",
     ...
   }
   
   📊 RESPOSTA DO MERCADO PAGO (234ms): {
     "status": "approved",  # ou "rejected"
     "status_detail": "accredited",  # ou código de erro
     "payment_id": "123456789",
     "http_status": 201
   }
   ```

3. **Se der erro**, verá logs completos:
   ```bash
   ❌ MERCADO PAGO RETORNOU ERRO OU RECUSA:
   HTTP Status: 400
   Response completa: {
     "message": "invalid parameter",
     "cause": [{
       "code": "...",
       "description": "..."
     }]
   }
   ```

### 3. Verificar se MP está sendo chamado:

Com os novos logs, você saberá exatamente:
- ✅ Se o token está sendo gerado
- ✅ Qual valor está sendo enviado
- ✅ Se o MP está respondendo
- ✅ Por que o MP está recusando (se aplicável)
- ✅ Quando o fallback para AppMax é acionado

---

## 🎯 Próximos Passos

1. **Execute o script SQL**:
   - Abra Supabase Dashboard
   - SQL Editor
   - Cole o conteúdo de `database/FIX-ABANDONED-CARTS-SCHEMA.sql`
   - Execute

2. **Faça deploy do código**:
   - Código já está no GitHub (push feito)
   - Se estiver na Vercel, aguarde deploy automático
   - Ou force rebuild: `vercel --prod`

3. **Teste com compra real**:
   - Use cartão de teste do MP
   - Acompanhe logs no terminal
   - Verifique se aparece no painel do MP

4. **Compartilhe os logs**:
   - Se ainda der erro, copie os logs completos do terminal
   - Eles mostrarão exatamente o que o MP está retornando

---

## 📝 Informações Técnicas

### Arquivos Modificados:

1. `lib/abandonedCart.ts`
   - Função `saveAbandonedCart()` mais robusta
   - Logs detalhados
   - Não bloqueia checkout em caso de erro

2. `app/api/checkout/enterprise/route.ts`
   - Logs completos do payload MP
   - Logs completos da resposta MP
   - Captura detalhada de erros
   - Log quando fallback é acionado

3. `database/FIX-ABANDONED-CARTS-SCHEMA.sql` (NOVO)
   - Script para corrigir schema do Supabase
   - Garante todas as colunas existem
   - Atualiza políticas RLS

### Formato dos Logs (para facilitar debug):

```typescript
// Formato JSON indentado (fácil leitura)
console.log('📦 DADOS:', JSON.stringify(objeto, null, 2))

// Separação visual
console.error('❌ ERRO CRÍTICO:')
console.error('HTTP Status:', status)
console.error('Response:', JSON.stringify(response, null, 2))
```

---

## ✅ Resultado Esperado

Após as correções:

1. **Carrinho abandonado não causa erro 400/406**
   - Salva sem problemas
   - Ou falha silenciosamente (não bloqueia)

2. **Logs completos do Mercado Pago**
   - Vemos payload enviado
   - Vemos resposta recebida
   - Vemos erro exato se houver
   - Sabemos quando/por que AppMax é acionado

3. **Debug facilitado**
   - Copie/cole logs para análise
   - Identifique problema rapidamente
   - Ajuste configuração se necessário

---

## 🔍 Possíveis Causas de Erro no MP (agora visíveis nos logs):

Com os logs implementados, você poderá identificar:

1. **Erro de credenciais**
   - HTTP 401: Token inválido
   - Solução: Verificar `MERCADOPAGO_ACCESS_TOKEN`

2. **Erro de valor**
   - `amount must be greater than 0`
   - Solução: Verificar conversão de valor

3. **Erro de dados inválidos**
   - `invalid parameter: payer.identification.number`
   - Solução: Verificar formato CPF/CNPJ

4. **Erro de token**
   - `invalid parameter: token`
   - Solução: Token expirado ou inválido

5. **Erro de rede/timeout**
   - `AbortError` ou `ECONNREFUSED`
   - Solução: Verificar conectividade

Todos esses erros agora aparecem nos logs! 🎉
