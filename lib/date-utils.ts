/**
 * 📅 UTILITÁRIOS DE DATA - Resolução de Fuso Horário
 * 
 * Corrige o problema de "0 vendas" vs "4 vendas" causado por
 * desalinhamento entre UTC do banco e hora local do browser
 */

/**
 * Converte uma data local para o range UTC completo do dia
 * 
 * @example
 * Input: Date("2026-01-21") em São Paulo (GMT-3)
 * Output: {
 *   start: "2026-01-21T00:00:00.000Z" (21:00 do dia anterior em SP),
 *   end: "2026-01-21T23:59:59.999Z" (20:59:59 do dia atual em SP)
 * }
 */
export function getUTCDayRange(date: Date | string) {
  const d = new Date(date)
  
  // Força o início do dia em UTC (00:00:00.000)
  const start = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    0, 0, 0, 0
  ))
  
  // Força o fim do dia em UTC (23:59:59.999)
  const end = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    23, 59, 59, 999
  ))
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

/**
 * Converte data local para range que pega TODO o dia em qualquer fuso
 * (Mais permissivo que getUTCDayRange, pega até +/- 1 dia)
 * 
 * Use quando precisar garantir que NÃO vai perder dados
 */
export function getLocalDayRange(date: Date | string) {
  const d = new Date(date)
  
  // Pega desde 24h antes em UTC até 24h depois
  const start = new Date(d)
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - 1) // -1 dia para pegar fuso -12
  
  const end = new Date(d)
  end.setUTCHours(23, 59, 59, 999)
  end.setUTCDate(end.getUTCDate() + 1) // +1 dia para pegar fuso +12
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

/**
 * Formata data para exibição "há X tempo"
 * 
 * @example
 * formatRelativeTime(new Date()) => "agora"
 * formatRelativeTime(2 horas atrás) => "há 2 horas"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 10) return 'agora'
  if (diffSec < 60) return `há ${diffSec}s`
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffHour < 24) return `há ${diffHour}h`
  if (diffDay === 1) return 'ontem'
  if (diffDay < 7) return `há ${diffDay} dias`
  if (diffDay < 30) return `há ${Math.floor(diffDay / 7)} semanas`
  if (diffDay < 365) return `há ${Math.floor(diffDay / 30)} meses`
  return `há ${Math.floor(diffDay / 365)} anos`
}

/**
 * Formata data brasileira
 */
export function formatBRDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formata data + hora brasileira
 */
export function formatBRDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Valida se uma data está no range (com tolerância)
 */
export function isDateInRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean {
  const d = new Date(date).getTime()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  
  return d >= start && d <= end
}
