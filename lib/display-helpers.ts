// =====================================================
// HELPERS DE EXIBIÇÃO
// =====================================================
// Funções utilitárias para melhorar a UX de nomes vazios
// =====================================================

/**
 * Lista de valores inválidos que não devem ser exibidos como nome
 */
const INVALID_NAMES = [
  'Cliente MP',
  'Cliente Appmax',
  'unknown',
  'collection_id',
  'Sem nome',
  'N/A',
  'null',
  'undefined',
]

/**
 * Verifica se um nome é válido para exibição
 */
export function isValidDisplayName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') return false
  
  const trimmedName = name.trim()
  if (trimmedName.length === 0) return false
  
  // Verificar se está na lista de nomes inválidos (case-insensitive)
  const lowerName = trimmedName.toLowerCase()
  return !INVALID_NAMES.some(invalid => lowerName === invalid.toLowerCase())
}

/**
 * Extrai o primeiro nome do email (parte antes do @)
 * e capitaliza a primeira letra
 * 
 * @example
 * getNameFromEmail('joao.silva@gmail.com') // 'Joao'
 * getNameFromEmail('MARIA@hotmail.com') // 'Maria'
 */
export function getNameFromEmail(email: string): string {
  if (!email || typeof email !== 'string') return 'Usuário'
  
  try {
    // Pegar a parte antes do @
    const username = email.split('@')[0]
    
    // Remover pontos, underscores, números do final
    const cleanName = username
      .split(/[._-]/)[0] // Pega só a primeira parte antes de . _ -
      .replace(/[0-9]/g, '') // Remove números
      .trim()
    
    if (cleanName.length === 0) return 'Usuário'
    
    // Capitalizar primeira letra, resto minúsculo
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
  } catch {
    return 'Usuário'
  }
}

/**
 * Retorna o nome de exibição ideal para um usuário
 * 
 * REGRA: Sempre usa customer_name do checkout (campo obrigatório)
 * Só extrai do email se realmente não existir nome válido
 * 
 * @param name Nome do usuário (customer_name do checkout)
 * @param email Email do usuário (usado como fallback extremo)
 * @param fallback Valor padrão se tudo falhar (default: 'Cliente')
 * @returns { displayName, isGenerated }
 */
export function getDisplayName(
  name: string | null | undefined,
  email: string,
  fallback: string = 'Cliente'
): {
  displayName: string
  isGenerated: boolean
} {
  // Se temos um nome válido do checkout, SEMPRE usar ele
  if (isValidDisplayName(name)) {
    return {
      displayName: name!.trim(),
      isGenerated: false,
    }
  }
  
  // Caso contrário, tentar extrair do email (apenas para casos extremos)
  if (email) {
    return {
      displayName: getNameFromEmail(email),
      isGenerated: true,
    }
  }
  
  // Último caso: fallback
  return {
    displayName: fallback,
    isGenerated: true,
  }
}

/**
 * Formata CPF/CNPJ para exibição
 * 
 * @example
 * formatCpfCnpj('12345678900') // '123.456.789-00'
 * formatCpfCnpj('12345678000190') // '12.345.678/0001-90'
 */
export function formatCpfCnpj(value: string | null | undefined): string {
  if (!value) return '—'
  
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    // CPF: 123.456.789-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (cleaned.length === 14) {
    // CNPJ: 12.345.678/0001-90
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  
  return value // Retorna original se não for CPF nem CNPJ
}

/**
 * Formata telefone para exibição
 * 
 * @example
 * formatPhone('11999887766') // '(11) 99988-7766'
 * formatPhone('1133334444') // '(11) 3333-4444'
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '—'
  
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    // Celular: (11) 99988-7766
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    // Fixo: (11) 3333-4444
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return value // Retorna original se não for formato conhecido
}
