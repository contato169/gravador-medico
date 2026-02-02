'use client'

import { useEffect, useRef, useState } from 'react'
import { Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Props do componente
interface CardPaymentBrickProps {
  amount: number
  email: string
  cpf: string
  customerName: string
  customerPhone: string
  documentType: 'CPF' | 'CNPJ'
  companyName?: string
  orderBumps?: { product_id: string; quantity: number }[]
  discount?: number
  couponCode?: string | null
  sessionId?: string
  idempotencyKey: string
  onSuccess: (result: { orderId: string; status: string }) => void
  onError: (error: string) => void
  onReady?: () => void
}

// Declaração global para o window.MercadoPago
declare global {
  interface Window {
    MercadoPago: any
  }
}

export default function CardPaymentBrick({
  amount,
  email,
  cpf,
  customerName,
  customerPhone,
  documentType,
  companyName,
  orderBumps = [],
  discount,
  couponCode,
  sessionId,
  idempotencyKey,
  onSuccess,
  onError,
  onReady,
}: CardPaymentBrickProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // 🔥 REFERÊNCIAS CRÍTICAS para controle do ciclo de vida
  const brickController = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  
  // Refs para os dados atuais (evita re-renders)
  const dataRef = useRef({
    amount,
    email,
    cpf,
    customerName,
    customerPhone,
    documentType,
    companyName,
    orderBumps,
    discount,
    couponCode,
    sessionId,
    idempotencyKey,
  })
  
  // Atualiza os dados ref
  useEffect(() => {
    dataRef.current = {
      amount,
      email,
      cpf,
      customerName,
      customerPhone,
      documentType,
      companyName,
      orderBumps,
      discount,
      couponCode,
      sessionId,
      idempotencyKey,
    }
  }, [amount, email, cpf, customerName, customerPhone, documentType, companyName, orderBumps, discount, couponCode, sessionId, idempotencyKey])

  // 🔥 useEffect PRINCIPAL - Criação e destruição do Brick
  useEffect(() => {
    mountedRef.current = true
    
    // 1. PREVENÇÃO DE DUPLICIDADE: Se já existe um controller ativo, não recrie
    if (brickController.current) {
      console.log('⚠️ Brick já existe, ignorando recriação')
      return
    }

    const loadScriptAndRenderBrick = async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim()
        
        if (!publicKey) {
          throw new Error('Chave pública do Mercado Pago não configurada')
        }

        console.log('🔐 Carregando Mercado Pago SDK...')

        // Carregar script do MP se não existir
        if (!window.MercadoPago) {
          await new Promise<void>((resolve, reject) => {
            // Verifica se script já existe
            if (document.querySelector('script[src*="sdk.mercadopago.com"]')) {
              // Aguarda o script carregar
              const checkMP = setInterval(() => {
                if (window.MercadoPago) {
                  clearInterval(checkMP)
                  resolve()
                }
              }, 100)
              setTimeout(() => {
                clearInterval(checkMP)
                reject(new Error('Timeout ao carregar SDK'))
              }, 10000)
              return
            }

            const script = document.createElement('script')
            script.src = 'https://sdk.mercadopago.com/js/v2'
            script.async = true
            script.onload = () => {
              console.log('✅ Script MP carregado')
              resolve()
            }
            script.onerror = () => reject(new Error('Falha ao carregar script MP'))
            document.head.appendChild(script)
          })
        }

        // Verificar se componente ainda está montado
        if (!mountedRef.current) return

        console.log('🏗️ Criando instância MercadoPago...')
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
        
        // Verificar se componente ainda está montado
        if (!mountedRef.current) return

        const bricksBuilder = mp.bricks()

        // Configurações do Brick
        const settings = {
          initialization: {
            amount: dataRef.current.amount,
            payer: {
              email: dataRef.current.email,
              identification: {
                type: dataRef.current.documentType,
                number: dataRef.current.cpf.replace(/\D/g, '')
              }
            }
          },
          customization: {
            visual: {
              style: {
                theme: 'flat', // Visual mais plano e moderno
                customVariables: {
                  baseColor: '#10B981',
                  formBackgroundColor: '#f9fafb',
                  inputBackgroundColor: '#ffffff',
                  borderRadiusMedium: '8px',
                  borderRadiusLarge: '12px',
                }
              },
              hideFormTitle: true,
              hidePaymentButton: false,
            },
            paymentMethods: {
              maxInstallments: 12,
              minInstallments: 1,
            }
          },
          callbacks: {
            onReady: () => {
              console.log('✅ Card Payment Brick pronto!')
              if (mountedRef.current) {
                setIsLoading(false)
                onReady?.()
              }
            },
            onError: (err: any) => {
              console.error('❌ Erro no Brick:', err)
              if (mountedRef.current) {
                setError(err?.message || 'Erro no formulário de pagamento')
              }
            },
            onSubmit: async (formData: any) => {
              console.log('📤 Submit recebido:', {
                hasToken: !!formData?.token,
                paymentMethodId: formData?.payment_method_id,
                installments: formData?.installments
              })

              if (!formData?.token) {
                setError('Token não gerado. Verifique os dados do cartão.')
                onError('Token não gerado')
                return
              }

              if (!mountedRef.current) return
              
              setIsProcessing(true)
              setError(null)

              try {
                const data = dataRef.current
                const payload = {
                  customer: {
                    name: data.customerName,
                    email: data.email,
                    phone: data.customerPhone,
                    cpf: data.cpf.replace(/\D/g, ''),
                    documentType: data.documentType,
                    companyName: data.documentType === 'CNPJ' ? data.companyName : undefined,
                  },
                  amount: data.amount,
                  payment_method: 'credit_card',
                  mpToken: formData.token,
                  installments: formData.installments || 1,
                  payment_method_id: formData.payment_method_id,
                  issuer_id: formData.issuer_id || '',
                  orderBumps: data.orderBumps,
                  discount: data.discount,
                  coupon_code: data.couponCode,
                  session_id: data.sessionId,
                  idempotencyKey: data.idempotencyKey,
                }

                console.log('💳 Enviando pagamento...')

                const response = await fetch('/api/checkout/enterprise', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': data.idempotencyKey
                  },
                  body: JSON.stringify(payload)
                })

                const result = await response.json()

                if (!response.ok) {
                  throw new Error(result.error || 'Erro ao processar pagamento')
                }

                if (result.success) {
                  console.log('✅ Pagamento aprovado!', result)
                  onSuccess({
                    orderId: result.orderId,
                    status: result.status
                  })
                  router.push(`/obrigado?order=${result.orderId}&status=approved`)
                } else {
                  throw new Error(result.error || 'Pagamento não aprovado')
                }

              } catch (err: any) {
                console.error('❌ Erro no pagamento:', err)
                const errorMsg = err?.message || 'Erro ao processar pagamento'
                if (mountedRef.current) {
                  setError(errorMsg)
                }
                onError(errorMsg)
              } finally {
                if (mountedRef.current) {
                  setIsProcessing(false)
                }
              }
            }
          }
        }

        // Verificar se componente ainda está montado antes de criar
        if (!mountedRef.current) return

        console.log('🧱 Criando Card Payment Brick...')
        
        // 2. ARMAZENA A INSTÂNCIA CRIADA NA REFERÊNCIA
        const controller = await bricksBuilder.create(
          'cardPayment',
          'cardPaymentBrick_container',
          settings
        )
        
        brickController.current = controller
        console.log('✅ Brick criado e armazenado no ref')

      } catch (err: any) {
        console.error('❌ Erro ao criar Brick:', err)
        if (mountedRef.current) {
          setError(err?.message || 'Erro ao carregar formulário de pagamento')
          setIsLoading(false)
        }
      }
    }

    loadScriptAndRenderBrick()

    // 3. CLEANUP CRUCIAL: Desmonta o brick ao sair para evitar erro de removeChild
    return () => {
      console.log('🧹 Cleanup: Desmontando Brick...')
      mountedRef.current = false
      
      if (brickController.current) {
        try {
          brickController.current.unmount()
          console.log('✅ Brick desmontado com sucesso')
        } catch (err) {
          console.warn('⚠️ Erro ao desmontar brick:', err)
        }
        brickController.current = null
      }
    }
  }, []) // Array de dependências VAZIO - só executa uma vez

  // Estado de erro crítico
  if (error && !isProcessing) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro no pagamento</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setError(null)
            setIsLoading(true)
            // Força recriação limpando o ref
            brickController.current = null
            window.location.reload()
          }}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header de segurança */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Lock className="w-4 h-4 text-green-600" />
        <span>Pagamento seguro processado pelo Mercado Pago</span>
      </div>

      {/* Loading enquanto carrega */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <span className="ml-3 text-gray-600">Carregando formulário seguro...</span>
        </div>
      )}

      {/* Container do Brick - ID FIXO */}
      <div 
        id="cardPaymentBrick_container" 
        ref={containerRef}
        className={isProcessing ? 'opacity-50 pointer-events-none' : ''}
        style={{ minHeight: isLoading ? 0 : 'auto' }}
      />

      {/* Processando */}
      {isProcessing && (
        <div className="flex items-center justify-center py-4 bg-brand-50 rounded-xl">
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          <span className="ml-3 text-brand-700 font-medium">Processando pagamento...</span>
        </div>
      )}

      {/* Badge de segurança */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
        <Lock className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-400">Seus dados estão protegidos com criptografia</span>
        <CheckCircle2 className="w-3 h-3 text-green-500" />
      </div>
    </div>
  )
}
