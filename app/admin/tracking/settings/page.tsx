/**
 * Configurações do Módulo Tracking
 * Página para gerenciar configurações gerais e integrações
 * URL: /admin/tracking/settings
 */

'use client';

import { useState } from 'react';
import { 
  Settings, 
  Save,
  Zap,
  Webhook,
  Bell,
  Shield,
  Globe,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TrackingSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookEndpoints, setWebhookEndpoints] = useState([
    { id: '1', url: 'https://api.example.com/webhook', events: ['purchase', 'lead'] }
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-400" />
            Configurações do Tracking
          </h1>
          <p className="text-zinc-400 mt-2">
            Gerencie integrações, webhooks e configurações gerais do módulo
          </p>
        </div>
        
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* API Key */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            API Key do Tracking
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Chave de API para integração externa com o sistema de tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api_key" className="text-zinc-300">Chave de API</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="api_key"
                type={showApiKey ? 'text' : 'password'}
                value="tk_live_8x9y2k4m6n8p0q2r4s6t8u0v2w4x6y8z"
                readOnly
                className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300 font-mono"
              />
              <Button
                variant="outline"
                onClick={() => setShowApiKey(!showApiKey)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700"
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Use esta chave para autenticar requisições à API de Tracking
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800">
            <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-red-400 hover:bg-zinc-700 hover:text-red-300">
              Gerar Nova Chave
            </Button>
            <p className="text-xs text-zinc-500 mt-2">
              ⚠️ Ao gerar uma nova chave, a antiga será invalidada
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Endpoints */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-purple-400" />
                Endpoints de Webhook
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Configure URLs para receber notificações de eventos
              </CardDescription>
            </div>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Endpoint
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhookEndpoints.map((endpoint) => (
            <Card key={endpoint.id} className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-mono text-zinc-300">{endpoint.url}</span>
                    </div>
                    <div className="flex gap-2">
                      {endpoint.events.map((event) => (
                        <span 
                          key={event}
                          className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-600/40"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-red-400 hover:bg-zinc-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Configurações Gerais */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Configurações Gerais
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Ajustes de comportamento e funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domínio Padrão */}
          <div>
            <Label htmlFor="default_domain" className="text-zinc-300">Domínio Padrão para Links</Label>
            <Input
              id="default_domain"
              placeholder="https://meusite.com"
              className="mt-2 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Domínio usado como base para links curtos (ex: meusite.com/r/codigo)
            </p>
          </div>

          {/* Timeout */}
          <div>
            <Label htmlFor="timeout" className="text-zinc-300">Timeout de Webhooks (ms)</Label>
            <Input
              id="timeout"
              type="number"
              defaultValue="5000"
              className="mt-2 bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Tempo máximo de espera para resposta de webhooks
            </p>
          </div>

          {/* Retenção de Logs */}
          <div>
            <Label htmlFor="log_retention" className="text-zinc-300">Retenção de Logs (dias)</Label>
            <Input
              id="log_retention"
              type="number"
              defaultValue="90"
              className="mt-2 bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Logs mais antigos que este período serão removidos automaticamente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            Notificações
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Configure alertas para eventos importantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <div>
              <p className="text-sm font-medium text-zinc-200">Notificar em caso de falha de webhook</p>
              <p className="text-xs text-zinc-500">Receba um alerta quando um webhook falhar</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <div>
              <p className="text-sm font-medium text-zinc-200">Notificar conversões importantes</p>
              <p className="text-xs text-zinc-500">Alerta quando uma venda de alto valor for atribuída</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <div>
              <p className="text-sm font-medium text-zinc-200">Relatório semanal de performance</p>
              <p className="text-xs text-zinc-500">Resumo semanal de cliques, conversões e ROI</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-700">
              <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Status da Integração */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Status das Integrações</CardTitle>
          <CardDescription className="text-zinc-400">
            Verifique o status de conexão com serviços externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Meta Pixel</p>
                <p className="text-xs text-zinc-500">Facebook Conversions API</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Conectado</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-600/30 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Webhooks</p>
                <p className="text-xs text-zinc-500">1 endpoint configurado</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Ativo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800">
          Cancelar
        </Button>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  );
}
