// lib/ads/ad-rules.ts
// ✅ Regras automáticas de pausar/ativar anúncios (Meta API v24.0)

type EntityType = 'CAMPAIGN' | 'ADSET' | 'AD';
type MetricType = 'cost_per_action_type' | 'purchase_roas' | 'cpm' | 'ctr' | 'spend' | 'impressions' | 'results';
type OperatorType = 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL' | 'NOT_EQUAL';
type ActionType = 'PAUSE' | 'UNPAUSE' | 'CHANGE_BUDGET' | 'SEND_NOTIFICATION';
type ScheduleType = 'SEMI_HOURLY' | 'HOURLY' | 'DAILY' | 'CUSTOM';

interface RuleCondition {
  field: MetricType;
  operator: OperatorType;
  value: number;
  aggregation?: 'SUM' | 'AVG' | 'MAX' | 'MIN';
  time_preset?: 'TODAY' | 'LAST_3_DAYS' | 'LAST_7_DAYS' | 'LAST_14_DAYS' | 'LAST_30_DAYS' | 'LIFETIME';
}

interface CreateRuleParams {
  accountId: string;
  accessToken: string;
  name: string;
  entityType: EntityType;
  conditions: RuleCondition[];
  action: ActionType;
  schedule?: ScheduleType;
  budgetChangeAmount?: number; // Para ação CHANGE_BUDGET
  notificationEmail?: string;  // Para ação SEND_NOTIFICATION
}

/**
 * Cria uma regra automática na conta de anúncios
 */
export async function createAdRule(params: CreateRuleParams) {
  try {
    console.log('⚙️ [Ad Rules] Criando regra:', params.name);

    // Construir filtros da avaliação
    const filters = params.conditions.map(condition => ({
      field: condition.field,
      operator: condition.operator,
      value: condition.value
    }));

    // Construir especificação de execução
    let executionSpec: any = {
      execution_type: params.action
    };

    if (params.action === 'CHANGE_BUDGET' && params.budgetChangeAmount) {
      executionSpec.execution_options = [{
        field: 'daily_budget',
        operator: params.budgetChangeAmount > 0 ? 'INCREASE' : 'DECREASE',
        value: Math.abs(params.budgetChangeAmount)
      }];
    }

    const ruleData = {
      name: params.name,
      evaluation_spec: {
        evaluation_type: 'SCHEDULE',
        filters: filters,
        time_preset: params.conditions[0]?.time_preset || 'LAST_7_DAYS'
      },
      execution_spec: executionSpec,
      schedule_spec: {
        schedule_type: params.schedule || 'DAILY'
      },
      status: 'ENABLED',
      access_token: params.accessToken
    };

    const response = await fetch(
      `https://graph.facebook.com/v24.0/act_${params.accountId}/adrules_library`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [Ad Rules] Erro da API:', errorData);
      throw new Error(errorData.error?.message || 'Erro ao criar regra');
    }

    const data = await response.json();
    console.log('✅ [Ad Rules] Regra criada:', data.id);
    
    return data.id;
    
  } catch (error: any) {
    console.error('❌ [Ad Rules] Erro ao criar regra:', error.message);
    throw error;
  }
}

/**
 * Lista regras existentes na conta
 */
export async function listAdRules(
  accountId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/act_${accountId}/adrules_library?fields=id,name,status,evaluation_spec,execution_spec&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Erro ao listar regras');
    }

    const data = await response.json();
    console.log('📋 [Ad Rules]', data.data?.length || 0, 'regras encontradas');
    
    return data.data || [];
    
  } catch (error: any) {
    console.error('❌ [Ad Rules] Erro ao listar:', error.message);
    return [];
  }
}

/**
 * Deleta uma regra existente
 */
export async function deleteAdRule(
  ruleId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/${ruleId}?access_token=${accessToken}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Erro ao deletar regra');
    }

    console.log('🗑️ [Ad Rules] Regra deletada:', ruleId);
    return true;
    
  } catch (error: any) {
    console.error('❌ [Ad Rules] Erro ao deletar:', error.message);
    return false;
  }
}

// =====================================================
// REGRAS PRÉ-DEFINIDAS (MELHORES PRÁTICAS)
// =====================================================

/**
 * Cria conjunto de regras padrão recomendadas
 */
export async function createDefaultRules(
  accountId: string,
  accessToken: string,
  options?: {
    maxCPA?: number;      // Padrão: R$50
    minROAS?: number;     // Padrão: 1.5
    maxSpendNoConversion?: number; // Padrão: R$100
  }
) {
  const { 
    maxCPA = 5000,      // R$50 em centavos
    minROAS = 1.5,
    maxSpendNoConversion = 10000  // R$100 em centavos
  } = options || {};

  console.log('⚙️ [Ad Rules] Criando regras padrão...');

  const rules = [];

  try {
    // Regra 1: Pausar se CPA > R$50
    const rule1 = await createAdRule({
      accountId,
      accessToken,
      name: `[Auto] Pausar AdSet: CPA > R$${maxCPA / 100}`,
      entityType: 'ADSET',
      conditions: [{
        field: 'cost_per_action_type',
        operator: 'GREATER_THAN',
        value: maxCPA,
        time_preset: 'LAST_7_DAYS'
      }],
      action: 'PAUSE',
      schedule: 'DAILY'
    });
    rules.push({ name: 'CPA Alto', id: rule1 });

    // Regra 2: Pausar se ROAS < 1.5x
    const rule2 = await createAdRule({
      accountId,
      accessToken,
      name: `[Auto] Pausar AdSet: ROAS < ${minROAS}x`,
      entityType: 'ADSET',
      conditions: [{
        field: 'purchase_roas',
        operator: 'LESS_THAN',
        value: minROAS,
        time_preset: 'LAST_7_DAYS'
      }],
      action: 'PAUSE',
      schedule: 'DAILY'
    });
    rules.push({ name: 'ROAS Baixo', id: rule2 });

    // Regra 3: Pausar se gasto alto sem resultados
    const rule3 = await createAdRule({
      accountId,
      accessToken,
      name: `[Auto] Pausar AdSet: Gasto > R$${maxSpendNoConversion / 100} sem conversão`,
      entityType: 'ADSET',
      conditions: [
        {
          field: 'spend',
          operator: 'GREATER_THAN',
          value: maxSpendNoConversion,
          time_preset: 'LAST_3_DAYS'
        },
        {
          field: 'results',
          operator: 'LESS_THAN',
          value: 1,
          time_preset: 'LAST_3_DAYS'
        }
      ],
      action: 'PAUSE',
      schedule: 'DAILY'
    });
    rules.push({ name: 'Sem Conversão', id: rule3 });

    console.log('✅ [Ad Rules] Regras padrão criadas:', rules.length);
    
    return {
      success: true,
      rules
    };

  } catch (error: any) {
    console.error('❌ [Ad Rules] Erro ao criar regras padrão:', error.message);
    return {
      success: false,
      rules,
      error: error.message
    };
  }
}

// =====================================================
// REGRAS ESPECÍFICAS POR FUNIL
// =====================================================

/**
 * Regras específicas para TOPO de funil
 */
export async function createTopoRules(
  accountId: string,
  accessToken: string
) {
  return createAdRule({
    accountId,
    accessToken,
    name: '[Auto] TOPO: Pausar se CPM > R$50',
    entityType: 'ADSET',
    conditions: [{
      field: 'cpm',
      operator: 'GREATER_THAN',
      value: 5000, // R$50 em centavos
      time_preset: 'LAST_7_DAYS'
    }],
    action: 'PAUSE',
    schedule: 'DAILY'
  });
}

/**
 * Regras específicas para MEIO de funil
 */
export async function createMeioRules(
  accountId: string,
  accessToken: string
) {
  return createAdRule({
    accountId,
    accessToken,
    name: '[Auto] MEIO: Pausar se CTR < 1%',
    entityType: 'ADSET',
    conditions: [{
      field: 'ctr',
      operator: 'LESS_THAN',
      value: 1, // 1%
      time_preset: 'LAST_7_DAYS'
    }],
    action: 'PAUSE',
    schedule: 'DAILY'
  });
}

/**
 * Regras específicas para FUNDO de funil
 */
export async function createFundoRules(
  accountId: string,
  accessToken: string
) {
  return createAdRule({
    accountId,
    accessToken,
    name: '[Auto] FUNDO: Aumentar budget +20% se ROAS > 3x',
    entityType: 'ADSET',
    conditions: [{
      field: 'purchase_roas',
      operator: 'GREATER_THAN',
      value: 3, // ROAS 3x
      time_preset: 'LAST_3_DAYS'
    }],
    action: 'CHANGE_BUDGET',
    budgetChangeAmount: 20, // +20%
    schedule: 'DAILY'
  });
}
