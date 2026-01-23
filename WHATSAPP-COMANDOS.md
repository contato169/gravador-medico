# 🛠️ Comandos Úteis - WhatsApp Inbox

## 📦 Instalação

```bash
# Não é necessário instalar pacotes adicionais!
# Tudo usa dependências já existentes:
# - @supabase/supabase-js ✅
# - date-fns ✅
# - lucide-react ✅
```

---

## 🗄️ Banco de Dados

### Executar SQL no Supabase

1. Acesse: [https://app.supabase.com](https://app.supabase.com)
2. Abra seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `database/10-whatsapp-inbox.sql`
5. Clique em **Run**

### Verificar instalação

```sql
-- Ver tabelas criadas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'whatsapp%';

-- Ver estatísticas
SELECT 
  (SELECT COUNT(*) FROM whatsapp_contacts) as contatos,
  (SELECT COUNT(*) FROM whatsapp_messages) as mensagens,
  (SELECT SUM(unread_count) FROM whatsapp_contacts) as nao_lidas;
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# .env.local
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE_NAME=nome-da-instancia
```

### Testar configuração

```bash
# Testar conexão com Evolution API
curl -H "apikey: SUA_API_KEY" \
  https://sua-evolution-api.com/instance/connectionState/INSTANCIA
```

---

## 🔄 Sincronização

### Opção 1: Script Node.js

```bash
# Sincronizar todas as conversas
npm run sync:whatsapp

# Ou diretamente:
node scripts/sync-whatsapp-history.js
```

### Opção 2: API Route

```bash
# Via cURL
curl -X POST http://localhost:3000/api/whatsapp/sync \
  -H "Content-Type: application/json" \
  -d '{"action": "sync-all", "messagesLimit": 100}'

# Via JavaScript (browser console ou Postman)
fetch('http://localhost:3000/api/whatsapp/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'sync-all', messagesLimit: 100 })
})
```

### Sincronizar conversa específica

```bash
curl -X POST http://localhost:3000/api/whatsapp/sync \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sync-conversation",
    "remoteJid": "552199999999@s.whatsapp.net",
    "messagesLimit": 200
  }'
```

---

## 🟢 Presença e Privacidade

### Digitando / Gravando

```bash
curl -X POST http://localhost:3000/api/whatsapp/presence \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5521999999999",
    "presence": "composing",
    "delay": 1200
  }'

curl -X POST http://localhost:3000/api/whatsapp/presence \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5521999999999",
    "presence": "recording",
    "delay": 1200
  }'
```

### Always Online

```bash
curl -X POST http://localhost:3000/api/whatsapp/settings/always-online \
  -H "Content-Type: application/json" \
  -d '{ "alwaysOnline": true }'
```

### Presença global da instância

```bash
curl -X POST http://localhost:3000/api/whatsapp/instance-presence \
  -H "Content-Type: application/json" \
  -d '{ "presence": "available" }'
```

### Privacidade (visto por último, foto, status)

```bash
curl -X POST http://localhost:3000/api/whatsapp/privacy \
  -H "Content-Type: application/json" \
  -d '{
    "last_seen": "all",
    "online": "all",
    "profile_photo": "all",
    "status": "all",
    "readreceipts": "all"
  }'
```

---

## 🌐 Webhook

### Testar webhook localmente (ngrok)

```bash
# 1. Instalar ngrok
brew install ngrok

# 2. Expor porta local
ngrok http 3000

# 3. Copiar URL (ex: https://abc123.ngrok.io)

# 4. Configurar na Evolution API:
# URL: https://abc123.ngrok.io/api/webhooks/whatsapp
# Evento: messages.upsert

# 5. Enviar mensagem de teste no WhatsApp
# 6. Ver logs no terminal do Next.js
```

### Testar webhook manualmente

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "teste",
    "data": {
      "key": {
        "remoteJid": "552199999999@s.whatsapp.net",
        "fromMe": false,
        "id": "teste123"
      },
      "message": {
        "conversation": "Olá, teste!"
      },
      "messageType": "conversation",
      "messageTimestamp": 1704067200,
      "pushName": "Cliente Teste"
    }
  }'
```

---

## 🧪 Testes

### Consultar banco direto (SQL)

```sql
-- Ver últimas conversas
SELECT * FROM whatsapp_conversations 
ORDER BY last_message_timestamp DESC 
LIMIT 10;

-- Ver mensagens de um contato
SELECT content, from_me, timestamp 
FROM whatsapp_messages 
WHERE remote_jid = '552199999999@s.whatsapp.net'
ORDER BY timestamp ASC;

-- Ver mensagens não lidas
SELECT remote_jid, unread_count 
FROM whatsapp_contacts 
WHERE unread_count > 0;
```

### Limpar dados de teste

```sql
-- CUIDADO! Isso apaga tudo
DELETE FROM whatsapp_messages;
DELETE FROM whatsapp_contacts;

-- Ou apenas de um contato
DELETE FROM whatsapp_messages WHERE remote_jid = '552199999999@s.whatsapp.net';
DELETE FROM whatsapp_contacts WHERE remote_jid = '552199999999@s.whatsapp.net';
```

---

## 🚀 Deploy

### Vercel

```bash
# 1. Fazer commit
git add .
git commit -m "feat: adicionar WhatsApp Inbox"
git push

# 2. Adicionar variáveis de ambiente no Vercel:
# Settings > Environment Variables
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE_NAME=...

# 3. Configurar webhook na Evolution API:
# https://seu-dominio.vercel.app/api/webhooks/whatsapp
```

### Railway / Render

```bash
# Mesmos passos do Vercel
# + Garantir que SUPABASE_SERVICE_ROLE_KEY está configurado
```

---

## 🐛 Debug

### Ver logs do webhook

```bash
# No terminal onde rodou `npm run dev`
# Toda mensagem recebida mostrará:
# 📥 Webhook recebido: { event, remoteJid, ... }
# ✅ Mensagem salva: uuid
```

### Ver logs do Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Database** > **Logs**
3. Filtre por `whatsapp`

### Habilitar Realtime no Supabase

1. Acesse **Database** > **Replication**
2. Encontre a tabela `whatsapp_messages`
3. Clique em **Enable**

---

## 📊 Monitoramento

### Consultar estatísticas

```bash
# Via TypeScript
import { getWhatsAppStats } from '@/lib/whatsapp-db'
const stats = await getWhatsAppStats()
console.log(stats)

# Via SQL
SELECT 
  COUNT(*) FILTER (WHERE last_message_timestamp > NOW() - INTERVAL '24 hours') as ultimas_24h,
  COUNT(*) FILTER (WHERE unread_count > 0) as com_nao_lidas,
  COUNT(*) as total
FROM whatsapp_contacts;
```

---

## 🤖 Integração com IA

### Testar endpoint de IA

```bash
curl -X POST http://localhost:3000/api/whatsapp/ai-response \
  -H "Content-Type: application/json" \
  -d '{"remoteJid": "552199999999@s.whatsapp.net"}'
```

### Configurar OpenAI

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

---

## 🎨 Personalização

### Adicionar ao menu principal

```tsx
// app/dashboard/layout.tsx ou sidebar
<Link 
  href="/dashboard/whatsapp"
  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg"
>
  <MessageSquare className="w-5 h-5" />
  <span>WhatsApp Inbox</span>
  {unreadCount > 0 && (
    <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full">
      {unreadCount}
    </span>
  )}
</Link>
```

### Adicionar card de stats no dashboard

```tsx
// app/dashboard/page.tsx
import WhatsAppStatsCard from '@/components/whatsapp/WhatsAppStatsCard'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <WhatsAppStatsCard />
      {/* outros cards */}
    </div>
  )
}
```

---

## 📱 Atalhos

```bash
# Desenvolvimento
npm run dev                 # Iniciar servidor local

# Sincronização
npm run sync:whatsapp      # Importar histórico

# Build
npm run build              # Build de produção
npm run start              # Rodar build
```

---

## 📚 Documentação Completa

- `docs/whatsapp-inbox-setup.md` - Guia completo
- `WHATSAPP-SETUP-RAPIDO.md` - Setup em 3 passos
- `WHATSAPP-ARQUITETURA.md` - Diagrama da arquitetura
- `WHATSAPP-RESUMO.md` - Resumo executivo

---

✨ **Pronto para usar!**
