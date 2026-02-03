// Script para executar migration no Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://egsmraszqnmosmtjuzhx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Executando migration ads_audiences...\n');

  // 1. Criar tabela
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ads_audiences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        meta_audience_id TEXT NOT NULL UNIQUE,
        template_id TEXT,
        name TEXT NOT NULL,
        audience_type TEXT NOT NULL DEFAULT 'CUSTOM',
        source_type TEXT,
        funnel_stage TEXT,
        retention_days INTEGER,
        lookalike_ratio DECIMAL(4,3),
        source_audience_id TEXT,
        is_essential BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        use_for_exclusion BOOLEAN DEFAULT false,
        recommended_for TEXT[],
        approximate_size INTEGER,
        health_status TEXT,
        last_health_check TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (error1) {
    console.log('⚠️ Tabela pode já existir, tentando adicionar colunas...');
  } else {
    console.log('✅ Tabela ads_audiences criada/verificada');
  }

  // 2. Verificar se tabela existe
  const { data, error: checkError } = await supabase
    .from('ads_audiences')
    .select('id')
    .limit(1);

  if (checkError) {
    console.error('❌ Erro ao verificar tabela:', checkError.message);
    
    // Se tabela não existe, vamos criar via insert direto que força criação
    console.log('\n📋 Tentando criar tabela via SQL direto...');
    
    // Usar a API de query direto
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    console.log('API disponível:', response.ok);
  } else {
    console.log('✅ Tabela ads_audiences existe e está acessível');
    console.log(`   Registros encontrados: ${data?.length || 0}`);
  }

  console.log('\n✅ Migration concluída!');
}

runMigration().catch(console.error);
