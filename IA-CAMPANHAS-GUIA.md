# 🤖 Guia de Implementação - IA para Análise de Campanhas

## Visão Geral

Este guia explica como configurar e usar a IA para análise de campanhas de marketing no dashboard.

## O que foi implementado

### 1. **Biblioteca de IA** (`lib/ai-advisor.ts`)
- Integração com OpenAI GPT-4
- Análise automática de métricas de campanhas
- Chat interativo para perguntas sobre campanhas
- Fallback inteligente quando a API está indisponível

### 2. **API Route** (`app/api/ai/campaign-insights/route.ts`)
- `GET` - Retorna análise completa das campanhas
- `POST` - Chat interativo para perguntas
- Cache de 6 horas para economizar tokens

### 3. **Componente UI** (`components/dashboard/AICampaignAdvisor.tsx`)
- Health Score visual (gauge)
- Cards de insights por prioridade
- Lista de recomendações práticas
- Chat integrado para perguntas

---

## 📦 Instalação

### Passo 1: Instalar o pacote OpenAI

```bash
npm install openai
# ou
yarn add openai
# ou
pnpm add openai
```

### Passo 2: Configurar a chave da API

1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova API Key
3. Adicione no seu `.env.local`:

```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

### Passo 3: Verificar a instalação

Reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse a página de campanhas: `/admin/ads/campanhas`

---

## 🎯 Funcionalidades

### Análise Automática
- **Health Score**: Nota de 0-100 baseada em ROAS, CTR, CPC
- **Insights**: Alertas categorizados (sucesso, aviso, perigo, info)
- **Recomendações**: Ações práticas para melhorar performance

### Chat com IA
Você pode fazer perguntas como:
- "Qual campanha devo pausar?"
- "Como melhorar meu ROAS?"
- "Quais criativos estão performando melhor?"

### Benchmarks Utilizados
- CTR bom: > 1.5%
- CPC aceitável: < R$ 2.00
- ROAS saudável: > 3.0
- Taxa de conversão: > 2%

---

## 🔧 Personalização

### Alterar o modelo de IA

Em `lib/ai-advisor.ts`, linha ~130:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // Trocar para 'gpt-4o' para melhor qualidade
  // ...
});
```

### Ajustar benchmarks

Edite o `SYSTEM_PROMPT` em `lib/ai-advisor.ts`:

```typescript
const SYSTEM_PROMPT = `...
Benchmarks de referência (e-commerce Brasil):
- CTR bom: > 1.5%
- CPC aceitável: < R$ 2.00
...`;
```

### Alterar tempo de cache

Em `app/api/ai/campaign-insights/route.ts`:

```typescript
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
```

---

## 💰 Custos Estimados

Usando GPT-4o-mini (recomendado):
- ~$0.15 por milhão de tokens de input
- ~$0.60 por milhão de tokens de output
- **Estimativa**: ~$0.01-0.05 por análise completa

Com cache de 6 horas e uso moderado:
- **Custo mensal estimado**: $5-20

---

## 🚨 Troubleshooting

### Erro: "Cannot find module 'openai'"
```bash
npm install openai
```

### Erro: "Invalid API Key"
Verifique se a chave está correta no `.env.local`

### Erro: "Rate limit exceeded"
- Aumente o tempo de cache
- Ou faça upgrade do plano OpenAI

### Fallback ativado
Se a API falhar, o sistema usa análise básica sem IA.
Você verá insights genéricos baseados em regras fixas.

---

## 📍 Onde aparece no Dashboard

1. **Página de Campanhas** (`/admin/ads/campanhas`)
   - Logo após os cards de KPIs
   - Análise completa com chat

2. **Opcional**: Pode ser adicionado em outras páginas:

```tsx
import { AICampaignAdvisor } from '@/components/dashboard/AICampaignAdvisor';

// No seu componente:
<AICampaignAdvisor 
  period="last_7d"   // Período de análise
  showChat={true}     // Mostrar chat?
/>
```

---

## 🔮 Próximos Passos (Opcional)

1. **Adicionar mais fontes de dados**
   - Google Ads
   - TikTok Ads
   - Dados de CRM

2. **Relatórios automáticos**
   - Email semanal com insights
   - Alertas por WhatsApp

3. **Comparação histórica**
   - "Compare com semana passada"
   - Tendências de longo prazo

---

## Suporte

Se tiver dúvidas, verifique:
- Logs do servidor (terminal)
- Console do navegador (F12)
- Status da API OpenAI: https://status.openai.com/
