'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings,
  Bell,
  Mail,
  MessageCircle,
  Shield,
  Database,
  Palette,
  Globe,
  Building2,
  Link,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  Zap,
  Moon,
  Clock,
  CreditCard
} from 'lucide-react'
import PageContainer from '../components/PageContainer'

interface SettingToggle {
  id: string
  label: string
  description: string
  icon: React.ElementType
  enabled: boolean
  category: string
}

interface SettingInput {
  id: string
  label: string
  description: string
  icon: React.ElementType
  value: string
  type: 'text' | 'url' | 'email' | 'password'
  placeholder: string
  category: string
}

// Toggle Switch estilizado
function Toggle({ 
  enabled, 
  onChange 
}: { 
  enabled: boolean
  onChange: (value: boolean) => void 
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative w-12 h-6 rounded-full
        transition-all duration-300 ease-out
        ${enabled 
          ? 'bg-[#22c55e] shadow-lg shadow-[#22c55e]/30' 
          : 'bg-zinc-700'
        }
      `}
    >
      <motion.div
        initial={false}
        animate={{ 
          x: enabled ? 24 : 2,
          scale: enabled ? 1 : 0.9,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`
          absolute top-1 w-4 h-4 rounded-full
          ${enabled ? 'bg-white' : 'bg-zinc-400'}
          shadow-md
        `}
      />
    </button>
  )
}

// Card de Categoria
function CategoryCard({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string
  icon: React.ElementType
  children: React.ReactNode 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#22c55e]" />
        </div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
      </div>
      <div className="p-6 space-y-6">
        {children}
      </div>
    </motion.div>
  )
}

// Item de Toggle
function ToggleItem({ 
  setting, 
  onToggle 
}: { 
  setting: SettingToggle
  onToggle: (id: string, value: boolean) => void 
}) {
  const Icon = setting.icon

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${setting.enabled 
            ? 'bg-[#22c55e]/10 text-[#22c55e]' 
            : 'bg-zinc-800 text-zinc-500'
          }
          transition-colors duration-200
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{setting.label}</p>
          <p className="text-xs text-zinc-500">{setting.description}</p>
        </div>
      </div>
      <Toggle 
        enabled={setting.enabled} 
        onChange={(value) => onToggle(setting.id, value)} 
      />
    </div>
  )
}

// Item de Input
function InputItem({ 
  setting, 
  onChange 
}: { 
  setting: SettingInput
  onChange: (id: string, value: string) => void 
}) {
  const Icon = setting.icon

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-500" />
        <label className="text-sm font-medium text-white">{setting.label}</label>
      </div>
      <p className="text-xs text-zinc-500 mb-2">{setting.description}</p>
      <input
        type={setting.type}
        value={setting.value}
        onChange={(e) => onChange(setting.id, e.target.value)}
        placeholder={setting.placeholder}
        className="
          w-full px-4 py-3
          bg-black 
          border border-white/10
          rounded-xl
          text-white placeholder:text-zinc-600
          focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20
          transition-all duration-200
          font-mono text-sm
        "
      />
    </div>
  )
}

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Toggles
  const [toggles, setToggles] = useState<SettingToggle[]>([
    {
      id: 'sale_notifications',
      label: 'Notificações de Venda',
      description: 'Receba alertas quando uma nova venda for concluída',
      icon: Bell,
      enabled: true,
      category: 'notifications',
    },
    {
      id: 'email_notifications',
      label: 'Notificações por E-mail',
      description: 'Enviar resumo diário por e-mail',
      icon: Mail,
      enabled: true,
      category: 'notifications',
    },
    {
      id: 'whatsapp_auto',
      label: 'Disparos Automáticos WhatsApp',
      description: 'Enviar mensagens automáticas de boas-vindas e confirmação',
      icon: MessageCircle,
      enabled: true,
      category: 'notifications',
    },
    {
      id: 'maintenance_mode',
      label: 'Modo Manutenção',
      description: 'Desativa o checkout e exibe mensagem de manutenção',
      icon: AlertTriangle,
      enabled: false,
      category: 'system',
    },
    {
      id: 'debug_mode',
      label: 'Modo Debug',
      description: 'Ativa logs detalhados para diagnóstico',
      icon: Database,
      enabled: false,
      category: 'system',
    },
    {
      id: 'dark_mode_force',
      label: 'Forçar Tema Escuro',
      description: 'Ignora preferência do sistema do usuário',
      icon: Moon,
      enabled: true,
      category: 'appearance',
    },
    {
      id: 'auto_backup',
      label: 'Backup Automático',
      description: 'Realiza backup diário às 3:00 AM',
      icon: Clock,
      enabled: true,
      category: 'system',
    },
    {
      id: 'fraud_detection',
      label: 'Detecção de Fraude',
      description: 'Ativa análise de risco em transações',
      icon: Shield,
      enabled: true,
      category: 'security',
    },
    {
      id: 'recaptcha',
      label: 'reCAPTCHA no Checkout',
      description: 'Proteção contra bots no formulário de pagamento',
      icon: Shield,
      enabled: true,
      category: 'security',
    },
    {
      id: 'cascade_payments',
      label: 'Pagamento em Cascata',
      description: 'Tenta gateways alternativos se o principal falhar',
      icon: CreditCard,
      enabled: true,
      category: 'payments',
    },
    {
      id: 'pix_enabled',
      label: 'PIX Habilitado',
      description: 'Permite pagamentos via PIX',
      icon: Zap,
      enabled: true,
      category: 'payments',
    },
  ])

  // Inputs
  const [inputs, setInputs] = useState<SettingInput[]>([
    {
      id: 'company_name',
      label: 'Nome da Empresa',
      description: 'Exibido em e-mails e no checkout',
      icon: Building2,
      value: 'Gravador Médico',
      type: 'text',
      placeholder: 'Nome da empresa',
      category: 'general',
    },
    {
      id: 'website_url',
      label: 'URL do Site',
      description: 'Domínio principal do produto',
      icon: Globe,
      value: 'https://gravadormedico.com',
      type: 'url',
      placeholder: 'https://',
      category: 'general',
    },
    {
      id: 'support_email',
      label: 'E-mail de Suporte',
      description: 'E-mail para recebimento de tickets',
      icon: Mail,
      value: 'suporte@gravadormedico.com',
      type: 'email',
      placeholder: 'suporte@empresa.com',
      category: 'general',
    },
    {
      id: 'webhook_url',
      label: 'URL do Webhook',
      description: 'Endpoint para notificações externas',
      icon: Link,
      value: 'https://api.gravadormedico.com/webhooks',
      type: 'url',
      placeholder: 'https://api.exemplo.com/webhook',
      category: 'integrations',
    },
    {
      id: 'api_secret',
      label: 'API Secret',
      description: 'Chave secreta para autenticação de APIs',
      icon: Key,
      value: '••••••••••••••••',
      type: 'password',
      placeholder: 'Sua chave secreta',
      category: 'integrations',
    },
  ])

  const handleToggle = (id: string, value: boolean) => {
    setToggles(prev => prev.map(t => 
      t.id === id ? { ...t, enabled: value } : t
    ))
    setHasChanges(true)
  }

  const handleInputChange = (id: string, value: string) => {
    setInputs(prev => prev.map(i => 
      i.id === id ? { ...i, value } : i
    ))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simula salvamento
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    setHasChanges(false)
  }

  // Agrupa toggles por categoria
  const notificationToggles = toggles.filter(t => t.category === 'notifications')
  const systemToggles = toggles.filter(t => t.category === 'system')
  const securityToggles = toggles.filter(t => t.category === 'security')
  const paymentToggles = toggles.filter(t => t.category === 'payments')
  const generalInputs = inputs.filter(i => i.category === 'general')
  const integrationInputs = inputs.filter(i => i.category === 'integrations')

  // Botão de Salvar
  const ActionButton = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleSave}
      disabled={isSaving || !hasChanges}
      className={`
        flex items-center gap-2
        px-4 py-2.5
        font-medium text-sm
        rounded-xl
        transition-all duration-200
        ${hasChanges 
          ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg shadow-[#22c55e]/20' 
          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
        }
      `}
    >
      {isSaving ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Salvando...
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          Salvar Alterações
        </>
      )}
    </motion.button>
  )

  return (
    <PageContainer
      title="Configurações"
      subtitle="Gerencie as preferências e ajustes do sistema"
      action={ActionButton}
    >
      {/* ===== INDICADOR DE ALTERAÇÕES ===== */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            mb-6 p-4 rounded-xl
            bg-yellow-500/10 border border-yellow-500/20
            flex items-center gap-3
          "
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            Você tem alterações não salvas
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== CONFIGURAÇÕES GERAIS ===== */}
        <CategoryCard title="Configurações Gerais" icon={Settings}>
          <div className="space-y-6">
            {generalInputs.map(input => (
              <InputItem 
                key={input.id} 
                setting={input} 
                onChange={handleInputChange} 
              />
            ))}
          </div>
        </CategoryCard>

        {/* ===== NOTIFICAÇÕES ===== */}
        <CategoryCard title="Notificações" icon={Bell}>
          <div className="space-y-6">
            {notificationToggles.map(toggle => (
              <ToggleItem 
                key={toggle.id} 
                setting={toggle} 
                onToggle={handleToggle} 
              />
            ))}
          </div>
        </CategoryCard>

        {/* ===== PAGAMENTOS ===== */}
        <CategoryCard title="Pagamentos" icon={CreditCard}>
          <div className="space-y-6">
            {paymentToggles.map(toggle => (
              <ToggleItem 
                key={toggle.id} 
                setting={toggle} 
                onToggle={handleToggle} 
              />
            ))}
          </div>
        </CategoryCard>

        {/* ===== SEGURANÇA ===== */}
        <CategoryCard title="Segurança" icon={Shield}>
          <div className="space-y-6">
            {securityToggles.map(toggle => (
              <ToggleItem 
                key={toggle.id} 
                setting={toggle} 
                onToggle={handleToggle} 
              />
            ))}
          </div>
        </CategoryCard>

        {/* ===== SISTEMA ===== */}
        <CategoryCard title="Sistema" icon={Database}>
          <div className="space-y-6">
            {systemToggles.map(toggle => (
              <ToggleItem 
                key={toggle.id} 
                setting={toggle} 
                onToggle={handleToggle} 
              />
            ))}
          </div>
        </CategoryCard>

        {/* ===== INTEGRAÇÕES ===== */}
        <CategoryCard title="Integrações" icon={Link}>
          <div className="space-y-6">
            {integrationInputs.map(input => (
              <InputItem 
                key={input.id} 
                setting={input} 
                onChange={handleInputChange} 
              />
            ))}
          </div>
        </CategoryCard>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
        <span>Versão do Sistema: 2.0.0-nexus</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          Painel Nexus • Black Piano Premium
        </span>
      </div>
    </PageContainer>
  )
}
