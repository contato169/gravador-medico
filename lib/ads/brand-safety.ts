// lib/ads/brand-safety.ts
// ✅ Controles de Brand Safety (Meta API v24.0)

/**
 * Configura Brand Safety para a conta de anúncios
 * - Filtra conteúdo sensível
 * - Exclui categorias problemáticas
 * - Aplica block lists de publishers
 */
export async function configureBrandSafety(params: {
  accountId: string;
  accessToken: string;
  blockLists?: string[];
  disableComments?: boolean;
  excludeCategories?: ('news' | 'politics' | 'gaming' | 'mature' | 'debated_social_issues')[];
}) {
  try {
    console.log('🛡️ [Brand Safety] Configurando proteções...');

    const response = await fetch(
      `https://graph.facebook.com/v24.0/act_${params.accountId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_safety_content_filter_levels: [
            'FACEBOOK_STANDARD',
            'AN_STANDARD'
          ],
          third_party_publisher_block_lists: params.blockLists || [],
          disable_comments: params.disableComments || false,
          excluded_categories: params.excludeCategories || [],
          access_token: params.accessToken
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro ao configurar Brand Safety');
    }

    const data = await response.json();
    console.log('✅ [Brand Safety] Proteções configuradas com sucesso');
    
    return data;
    
  } catch (error: any) {
    console.error('❌ [Brand Safety] Erro:', error.message);
    throw error;
  }
}

/**
 * Categorias que podem ser excluídas
 */
export const EXCLUDED_CATEGORIES = {
  NEWS: 'news',
  POLITICS: 'politics',
  GAMING: 'gaming',
  MATURE: 'mature',
  DEBATED_SOCIAL_ISSUES: 'debated_social_issues'
} as const;

export type ExcludedCategory = typeof EXCLUDED_CATEGORIES[keyof typeof EXCLUDED_CATEGORIES];

/**
 * Configuração padrão recomendada para Brand Safety
 */
export const DEFAULT_BRAND_SAFETY_CONFIG = {
  disableComments: false,
  excludeCategories: [
    EXCLUDED_CATEGORIES.NEWS,
    EXCLUDED_CATEGORIES.POLITICS,
    EXCLUDED_CATEGORIES.DEBATED_SOCIAL_ISSUES
  ] as ExcludedCategory[],
  blockLists: []
};

/**
 * Aplica configurações de Brand Safety padrão
 */
export async function applyDefaultBrandSafety(
  accountId: string,
  accessToken: string
) {
  return configureBrandSafety({
    accountId,
    accessToken,
    ...DEFAULT_BRAND_SAFETY_CONFIG
  });
}

/**
 * Obtém status atual do Brand Safety
 */
export async function getBrandSafetyStatus(
  accountId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/act_${accountId}?fields=brand_safety_content_filter_levels,excluded_categories&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Erro ao obter status de Brand Safety');
    }

    const data = await response.json();
    console.log('🛡️ [Brand Safety] Status atual:', data);
    
    return {
      filterLevels: data.brand_safety_content_filter_levels || [],
      excludedCategories: data.excluded_categories || [],
      isConfigured: data.brand_safety_content_filter_levels?.length > 0
    };
    
  } catch (error: any) {
    console.error('❌ [Brand Safety] Erro ao obter status:', error.message);
    return {
      filterLevels: [],
      excludedCategories: [],
      isConfigured: false
    };
  }
}
