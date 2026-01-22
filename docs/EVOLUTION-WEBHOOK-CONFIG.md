# 🔧 Configuração Evolution API - Webhook para Mensagens Enviadas

## ⚠️ PROBLEMA IDENTIFICADO:

O webhook `/api/webhooks/whatsapp` **NÃO está recebendo** as mensagens que você envia pelo dashboard.

### Evidências:
- ✅ API `/api/whatsapp/send` funciona (mensagem é enviada)
- ✅ Evolution retorna `fromMe: true`
- ❌ **NENHUM log do webhook** nos logs do Vercel após envio
- ❌ Mensagem não aparece no chat

## 🎯 Solução:

A Evolution API precisa estar configurada para enviar webhook de **TODAS** as mensagens, incluindo as enviadas pelo sistema.

### Verificar Configuração da Instância:

```bash
curl -X GET \
  'https://YOUR_EVOLUTION_URL/instance/fetchInstances' \
  -H 'apikey: YOUR_API_KEY'
```

Procure por:
```json
{
  "webhook": {
    "url": "https://www.gravadormedico.com.br/api/webhooks/whatsapp",
    "webhookByEvents": false,  // ← IMPORTANTE: deve ser false
    "webhookBase64": true,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "QRCODE_UPDATED",
      "CONNECTION_UPDATE"
    ]
  }
}
```

### Atualizar Configuração (se necessário):

```bash
curl -X POST \
  'https://YOUR_EVOLUTION_URL/webhook/set/YOUR_INSTANCE_NAME' \
  -H 'apikey: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://www.gravadormedico.com.br/api/webhooks/whatsapp",
    "webhookByEvents": false,
    "events": [
      "MESSAGES_UPSERT",
      "SEND_MESSAGE"
    ]
  }'
```

## 🔍 Teste:

Após configurar, envie uma mensagem e verifique se aparece nos logs do Vercel:

```
📥 Webhook recebido: { event: 'messages.upsert', fromMe: true, ... }
🔍 [DEBUG from_me] Valor recebido: true boolean
```

## 💡 Alternativa Temporária:

Se o webhook não funcionar para mensagens enviadas, podemos salvar diretamente na API de envio:

```typescript
// Em /api/whatsapp/send/route.ts
const savedMessage = await upsertWhatsAppMessage({
  message_id: response.key.id,
  remote_jid: remoteJid,
  content: message,
  message_type: 'text',
  from_me: true,  // ← Forçar true aqui
  timestamp: new Date().toISOString(),
  status: 'PENDING'
})
```
