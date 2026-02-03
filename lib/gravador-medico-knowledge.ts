/**
 * =====================================================
 * BASE DE CONHECIMENTO DO GRAVADOR MÉDICO
 * =====================================================
 * Fonte: Bíblia do Método - Fevereiro 2026
 * 
 * Este arquivo contém TODA a inteligência do produto,
 * permitindo que a IA gere prompts profissionais sem
 * que o usuário precise digitar informações.
 * =====================================================
 */

export const GRAVADOR_MEDICO_KNOWLEDGE = {
  // Produto
  nome: "Gravador Médico",
  empresa: "VIGA Inteligência de Negócios",
  
  // Proposta de Valor
  proposta_central: "Gere o prontuário da sua consulta sem digitar uma linha",
  transformacao_principal: "Médicos que ficam até 2-3h da manhã digitando prontuário → Prontuário pronto em 30 segundos automaticamente",
  
  // Público-Alvo
  publico: {
    primario: "Médicos e profissionais da saúde no Brasil",
    caracteristicas: [
      "Trabalha muitas horas por dia (8h às 18h ou mais)",
      "Chega exausto no fim do dia",
      "Leva trabalho para casa (digitação de prontuários)",
      "Já tentou outras soluções sem sucesso",
      "Usa iPhone",
      "Quer se conectar mais com o paciente durante a consulta"
    ],
    especialidades: [
      "Oftalmologia", "Ginecologia", "Cardiologia", "Psiquiatria",
      "Medicina de Família", "Fisioterapia", "Medicina Integrativa",
      "Dermatologia", "Neurologia", "Ortopedia", "Pediatria"
    ]
  },
  
  // Dor Principal
  dor: {
    principal: "Tempo perdido digitando prontuários + desconexão com o paciente",
    manifestacoes: [
      "Fica até 2-3 horas da manhã digitando",
      "Durante a consulta, olha para o computador ao invés do paciente",
      "Perde detalhes importantes da conversa",
      "Trabalho 'invisível' que consome horas após o expediente",
      "Cansaço extremo no fim do dia",
      "Sensação de que o trabalho nunca acaba"
    ],
    citacoes_reais: [
      "Você acha que minha vida é sair da clínica oito e pouco da noite e acabou? Eu fico até duas, três horas da manhã digitando prontuário, tentando lembrar das coisas.",
      "Chega essa hora eu já tô morta em pé.",
      "Eu não tenho tempo nem de olhar pro paciente direito."
    ]
  },
  
  // Benefícios
  beneficios: {
    velocidade: "Consulta de 30 min transcrita em 10 segundos",
    economia_tempo: "Economiza 15 horas por semana de digitação manual",
    conexao: "Olho no olho com o paciente durante toda a consulta",
    documentacao: "Documentação clínica completa e detalhada",
    flexibilidade: "Funciona offline, celular pode ficar na mesa",
    qualidade_vida: "Sai da clínica e não leva trabalho para casa"
  },
  
  // Prova Social
  prova_social: {
    usuarios_ativos: "Mais de 2.000 médicos usando",
    caso_sucesso: {
      medica: "Dra. Gabriela (ginecologista)",
      resultado: "Faturamento de R$ 29.000/mês → R$ 169.000/mês (483% em 6 meses)",
      problema_resolvido: "Ficava até 2-3h da manhã digitando prontuário"
    },
    depoimentos: [
      '"Eu não saberia fazer isso sozinha" - Dra. Patrícia, oftalmologista',
      '"É disparado a melhor ferramenta que existe" - Dr. Ricardo, cardiologista',
      '"Minha vida mudou completamente" - Dra. Marina, psiquiatra',
      '"Finalmente consigo olhar pro meu paciente" - Dr. Carlos, clínico geral'
    ]
  },
  
  // Como Funciona
  funcionamento: {
    simplicidade: "Um toque na tela bloqueada inicia a gravação",
    processo: "Gravar → Transcrever (10s) → IA gera prontuário → Copiar e colar",
    configuracao: "Menos de 5 minutos para configurar",
    compatibilidade: "iPhone, iPad, Mac (não funciona com Android)"
  },
  
  // Preço
  preco: {
    metodo: "R$ 36,00 pagamento único (ou 8x de R$ 5,40)",
    acesso: "Vitalício",
    app_voicepen: "R$ 24/mês (transcrição ILIMITADA)",
    garantia: "7 dias incondicional",
    comparacao_concorrente: "Plaud: R$ 1.800 inicial + R$ 120/mês com LIMITE de 2h/mês"
  },
  
  // Diferenciais
  diferenciais: [
    "Transcrição ILIMITADA (vs concorrentes com limite de horas)",
    "Personalização por especialidade médica",
    "Preço acessível (R$ 36 vs R$ 1.800 do Plaud)",
    "Não precisa de hardware adicional",
    "Funciona com o que o médico já tem (iPhone)",
    "Suporte via WhatsApp + implementação assistida",
    "Configuração em menos de 5 minutos",
    "Funciona offline durante a consulta"
  ],
  
  // Tom de Voz
  tom: {
    caracteristicas: [
      "Próximo e pessoal (não corporativo)",
      "Empático com a realidade do médico",
      "Técnico quando necessário, simples quando possível",
      "Parceiro, não vendedor"
    ],
    expressoes_tipicas: [
      "Olho no olho com o paciente",
      "Sem digitar uma linha",
      "Em segundos",
      "É disparado a melhor ferramenta",
      "Prontuário pronto automaticamente"
    ],
    evitar: [
      "Revolucionário",
      "Inovador",
      "Solução completa",
      "Líder de mercado",
      "O melhor do mercado"
    ]
  }
};

/**
 * =====================================================
 * OBJETIVOS DE CAMPANHA PRÉ-DEFINIDOS
 * =====================================================
 * Cada objetivo tem estratégia específica de copy,
 * tom de voz e CTAs otimizados.
 * =====================================================
 */
export const CAMPAIGN_OBJECTIVES = {
  TRAFEGO: {
    label: "🌊 Tráfego",
    emoji: "🌊",
    descricao: "Gerar alto volume de visitantes no site para remarketing posterior",
    estagio_funil: "Topo de Funil (Awareness)",
    angulo_copy: "Curiosidade + Educação",
    tom: "Educacional e instigante",
    foco: "Despertar interesse sem venda direta ainda",
    cta_ideal: ["Ver Como Funciona", "Conhecer a Solução", "Assistir Demonstração"],
    regras: [
      "NÃO mencionar preço",
      "NÃO pressionar para compra",
      "Focar em curiosidade e problema",
      "Usar perguntas que geram interesse"
    ],
    hooks: [
      "Você sabia que médicos perdem 15h/semana digitando prontuários?",
      "Por que médicos estão abandonando a digitação manual?",
      "O segredo dos médicos que saem da clínica sem levar trabalho para casa"
    ]
  },
  
  CONVERSAO: {
    label: "💰 Conversão",
    emoji: "💰",
    descricao: "Vendas diretas do produto Gravador Médico",
    estagio_funil: "Fundo de Funil (Decisão)",
    angulo_copy: "Urgência + Prova Social + Benefício Direto",
    tom: "Direto e consultivo com senso de urgência",
    foco: "Resolver a dor AGORA com call to action forte",
    cta_ideal: ["Começar Agora por R$ 36", "Garantir Acesso Vitalício", "Testar por 7 Dias"],
    regras: [
      "SEMPRE mencionar preço (R$ 36)",
      "SEMPRE mencionar garantia (7 dias)",
      "Incluir prova social forte",
      "Criar urgência sem ser agressivo"
    ],
    hooks: [
      "Médico, você está perdendo 15 horas por semana digitando prontuários?",
      "Prontuário pronto em 30 segundos. Sem digitar uma linha.",
      "Mais de 2.000 médicos já economizam 15h/semana com isso"
    ]
  },
  
  REMARKETING: {
    label: "🎯 Remarketing",
    emoji: "🎯",
    descricao: "Converter visitantes que já conhecem o produto mas não compraram",
    estagio_funil: "Meio de Funil (Consideração)",
    angulo_copy: "Objeções + Garantia + Escassez",
    tom: "Empático e resoluto, abordando dúvidas",
    foco: "Remover fricção e reforçar segurança da compra",
    cta_ideal: ["Testar Sem Risco por 7 Dias", "Garantir Seu Acesso", "Ver Depoimentos de Médicos"],
    regras: [
      "Abordar objeções comuns",
      "SEMPRE reforçar garantia de 7 dias",
      "Destacar simplicidade (5 min para configurar)",
      "Usar depoimentos de médicos"
    ],
    hooks: [
      "Ainda com dúvida se o Gravador Médico funciona para você?",
      "Médico, você voltou! Veja o que outros profissionais estão dizendo...",
      "Se não funcionar para sua especialidade, devolvemos seu dinheiro"
    ]
  }
} as const;

export type ObjectiveType = keyof typeof CAMPAIGN_OBJECTIVES;

/**
 * =====================================================
 * HELPER: Gerar Prompt Completo
 * =====================================================
 * Combina conhecimento do produto + objetivo selecionado
 * para gerar o meta-prompt perfeito.
 * =====================================================
 */
export function generateMetaPrompt(objectiveType: ObjectiveType): string {
  const objective = CAMPAIGN_OBJECTIVES[objectiveType];
  const product = GRAVADOR_MEDICO_KNOWLEDGE;

  return `Você é David Ogilvy, o maior copywriter da história, especializado em Direct Response Marketing para produtos médicos.

## PRODUTO: ${product.nome}
**Empresa:** ${product.empresa}
**Proposta:** ${product.proposta_central}

## CONTEXTO COMPLETO DO PRODUTO:

**Transformação:**
${product.transformacao_principal}

**Público-Alvo:**
- ${product.publico.primario}
- Características: ${product.publico.caracteristicas.join(', ')}
- Especialidades: ${product.publico.especialidades.join(', ')}

**Dor Principal:**
${product.dor.principal}

Manifestações:
${product.dor.manifestacoes.map(m => `- ${m}`).join('\n')}

Citações reais de clientes:
${product.dor.citacoes_reais.map(c => `"${c}"`).join('\n')}

**Benefícios-Chave:**
- Velocidade: ${product.beneficios.velocidade}
- Economia: ${product.beneficios.economia_tempo}
- Conexão: ${product.beneficios.conexao}
- Documentação: ${product.beneficios.documentacao}
- Qualidade de vida: ${product.beneficios.qualidade_vida}

**Prova Social:**
- ${product.prova_social.usuarios_ativos}
- Caso de sucesso: ${product.prova_social.caso_sucesso.medica} - ${product.prova_social.caso_sucesso.resultado}
- Depoimentos: ${product.prova_social.depoimentos.join(' | ')}

**Funcionamento:**
${product.funcionamento.processo}
Configuração: ${product.funcionamento.configuracao}

**Preço:**
- Método: ${product.preco.metodo}
- Acesso: ${product.preco.acesso}
- App adicional: ${product.preco.app_voicepen}
- Garantia: ${product.preco.garantia}

**Diferencial vs Concorrente:**
${product.preco.comparacao_concorrente}

**Diferenciais Únicos:**
${product.diferenciais.map(d => `- ${d}`).join('\n')}

**Tom de Voz:**
${product.tom.caracteristicas.join(', ')}

**Expressões para usar:**
${product.tom.expressoes_tipicas.join(', ')}

**EVITAR estas expressões:**
${product.tom.evitar.join(', ')}

---

## OBJETIVO DA CAMPANHA: ${objective.label}

**Descrição:** ${objective.descricao}
**Estágio do Funil:** ${objective.estagio_funil}
**Ângulo de Copy:** ${objective.angulo_copy}
**Tom de Voz:** ${objective.tom}
**Foco:** ${objective.foco}
**CTAs Ideais:** ${objective.cta_ideal.join(' | ')}

**Regras específicas para ${objective.label}:**
${objective.regras.map(r => `- ${r}`).join('\n')}

**Exemplos de Hooks para ${objective.label}:**
${objective.hooks.map(h => `- "${h}"`).join('\n')}

---

## SUA TAREFA:

Crie 3 variações de copy para anúncio no Facebook Ads, seguindo estas especificações:

### ESTRUTURA DE CADA VARIAÇÃO:

1. **Hook (1ª linha):**
${objectiveType === 'TRAFEGO' 
  ? '- Pergunta de curiosidade que desperta interesse sem pressão de venda'
  : objectiveType === 'CONVERSAO'
  ? '- Pergunta direta sobre a DOR com senso de urgência'
  : '- Reconhecimento da objeção + reforço de segurança'
}

2. **Corpo (2-3 linhas):**
${objectiveType === 'TRAFEGO'
  ? '- Apresente a TRANSFORMAÇÃO de forma educativa (antes vs depois)\n- Mencione prova social leve ("mais de 2.000 médicos")\n- NÃO mencione preço ou venda direta'
  : objectiveType === 'CONVERSAO'
  ? '- Apresente a SOLUÇÃO imediatamente\n- Destaque benefício mensurável (15h/semana economizadas)\n- Inclua prova social forte (caso da Dra. Gabriela)\n- Mencione preço (R$ 36) e garantia (7 dias)'
  : '- Aborde a objeção comum ("será que funciona para minha especialidade?")\n- Reforce GARANTIA de 7 dias\n- Destaque simplicidade (5 minutos para configurar)'
}

3. **Headline (até 27 caracteres):**
${objectiveType === 'TRAFEGO'
  ? '- Foco em CURIOSIDADE'
  : objectiveType === 'CONVERSAO'
  ? '- Foco em BENEFÍCIO DIRETO'
  : '- Foco em REMOÇÃO DE FRICÇÃO'
}

4. **CTA:**
Use um dos CTAs ideais: ${objective.cta_ideal.join(' | ')}

---

## REGRAS OBRIGATÓRIAS:

1. Fale direto com o médico ("você"), não sobre o produto
2. Use números específicos (15h/semana, 2.000 médicos, R$ 36)
3. NUNCA use jargão corporativo (${product.tom.evitar.join(', ')})
4. Tom: ${objective.tom}
5. Expressões características: ${product.tom.expressoes_tipicas.join(', ')}
6. ${objective.regras[0]}

---

## FORMATO DE RESPOSTA (JSON):

{
  "variacoes": [
    {
      "primary_text": "Texto de 2-4 linhas aqui (máx 125 caracteres ideal)",
      "headline": "Até 27 caracteres",
      "cta": "Texto do botão"
    },
    {
      "primary_text": "Segunda variação...",
      "headline": "Headline 2",
      "cta": "CTA 2"
    },
    {
      "primary_text": "Terceira variação...",
      "headline": "Headline 3",
      "cta": "CTA 3"
    }
  ]
}

Agora crie as 3 variações otimizadas para o objetivo: ${objective.label}`;
}
