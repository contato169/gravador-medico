# 🎯 Sistema de Gerenciamento Automático de Públicos Meta Ads

## ✅ Implementado

Este sistema permite criar e gerenciar automaticamente Custom Audiences e Lookalikes no Meta Ads.

---

## 📁 Arquivos Criados

### Backend

1. **`lib/meta/audience-templates.ts`**
   - Templates de públicos essenciais pré-configurados
   - Configurações de Lookalikes
   - Funções auxiliares para filtrar e preparar templates

2. **`app/api/meta/audiences/create-essentials/route.ts`**
   - `POST`: Cria automaticamente todos os públicos essenciais
   - `GET`: Retorna status dos públicos essenciais

3. **`app/api/meta/audiences/health-check/route.ts`**
   - `GET`: Verifica saúde de todos os públicos
   - `POST`: Verifica saúde de públicos específicos

### Frontend

4. **`app/admin/ads/publicos/page.tsx`**
   - Painel visual de gerenciamento de públicos
   - Botão "Criar Essenciais" para automação
   - Filtros por funil e tipo
   - Health check em tempo real

### Database

5. **`supabase/migrations/20260202_ads_audiences_essential.sql`**
   - Migration SQL para tabela `ads_audiences`
   - Suporte a templates, health status, e mais

---

## 🎯 Públicos Essenciais Criados

### Fundo de Funil (Remarketing)
| Público | Tipo | Retenção |
|---------|------|----------|
| Visitantes do Site | WEBSITE | 180 dias |
| Visitantes Recentes | WEBSITE | 30 dias |
| Visitantes Ultra Recentes | WEBSITE | 7 dias |
| Abandonou Checkout | WEBSITE | 30 dias |
| Adicionou ao Carrinho | WEBSITE | 30 dias |
| Compradores (exclusão) | WEBSITE | 180 dias |
| Compradores Recentes (exclusão) | WEBSITE | 30 dias |

### Meio de Funil (Engajamento)
| Público | Tipo | Retenção |
|---------|------|----------|
| Engajamento FB Page | ENGAGEMENT | 365 dias |
| Engajamento Instagram | ENGAGEMENT | 365 dias |
| Assistiu 75%+ Vídeos | VIDEO | 365 dias |

### Topo de Funil (Aquisição - Lookalikes)
| Público | Base | Porcentagem |
|---------|------|-------------|
| LAL Compradores 1% | Compradores 180d | 1% |
| LAL Compradores 3% | Compradores 180d | 3% |
| LAL Compradores 5% | Compradores 180d | 5% |
| LAL Checkout 1% | Checkout Abandoners | 1% |
| LAL Engajamento IG 1% | Engajamento IG | 1% |

---

## 🚀 Como Usar

### 1. Executar Migration SQL
```sql
-- No Supabase SQL Editor, execute:
-- supabase/migrations/20260202_ads_audiences_essential.sql
```

### 2. Configurar Credenciais Meta
Certifique-se que as variáveis de ambiente estão configuradas:
```env
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=...
META_PIXEL_ID=...
META_PAGE_ID=...
META_INSTAGRAM_ID=...
```

### 3. Acessar o Painel
- Navegue para: `/admin/ads/publicos`
- Clique em "Criar Essenciais" para criar todos os públicos automaticamente

### 4. Monitorar Saúde
- Use o botão "Health Check" para verificar o tamanho e status dos públicos
- Públicos com menos de 1.000 pessoas são marcados como "pequenos"

---

## 📡 APIs Disponíveis

### Criar Públicos Essenciais
```bash
POST /api/meta/audiences/create-essentials
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "audiences_created": 8,
    "lookalikes_created": 3,
    "skipped": 2,
    "failed": 0
  }
}
```

### Health Check
```bash
GET /api/meta/audiences/health-check
```

**Response:**
```json
{
  "success": true,
  "health_checks": [...],
  "summary": {
    "total": 11,
    "healthy": 8,
    "unhealthy": 3
  }
}
```

### Listar Públicos
```bash
GET /api/meta/audiences
```

---

## 🔄 Fluxo de Criação

```
1. Usuário clica "Criar Essenciais"
          ↓
2. API verifica quais públicos já existem
          ↓
3. Cria Custom Audiences na Meta API
          ↓
4. Salva referências no banco local
          ↓
5. Verifica tamanho dos públicos
          ↓
6. Cria Lookalikes (se público base >= 1000)
          ↓
7. Retorna resumo ao usuário
```

---

## ⚠️ Observações Importantes

1. **Rate Limit**: O sistema aguarda 2 segundos entre cada criação para respeitar limites da Meta API

2. **Lookalikes**: Só são criados se o público base tiver pelo menos 1.000 pessoas

3. **Exclusões**: Públicos de compradores são marcados como "use_for_exclusion" para excluir de campanhas de aquisição

4. **Dependências**: 
   - Públicos de WEBSITE precisam de `META_PIXEL_ID`
   - Públicos de ENGAGEMENT (FB) precisam de `META_PAGE_ID`
   - Públicos de ENGAGEMENT (IG) precisam de `META_INSTAGRAM_ID`

---

## 🔗 Links Úteis

- [Meta Marketing API - Custom Audiences](https://developers.facebook.com/docs/marketing-api/audiences/reference/custom-audience/)
- [Meta Marketing API - Lookalike Audiences](https://developers.facebook.com/docs/marketing-api/audiences/reference/lookalike/)

---

*Criado em 02/02/2026*
