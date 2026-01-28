// Script para criar a função de engagement score no Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEngagementScoreFunction() {
  console.log('🚀 Criando função de Engagement Score...\n');

  // SQL simplificado para criar a função
  const sql = `
    -- Dropar função existente se houver
    DROP FUNCTION IF EXISTS calculate_customer_engagement_score(TEXT);

    -- Criar função para calcular score individual
    CREATE OR REPLACE FUNCTION calculate_customer_engagement_score(p_email TEXT)
    RETURNS INTEGER AS $$
    DECLARE
        v_score INTEGER := 0;
        v_paid_orders INTEGER := 0;
        v_total_orders INTEGER := 0;
        v_ltv NUMERIC := 0;
        v_days_since_last_purchase INTEGER := 999;
        v_total_visits INTEGER := 0;
        v_unique_pages INTEGER := 0;
        v_has_utm BOOLEAN := FALSE;
        v_has_fbclid BOOLEAN := FALSE;
        v_customer_phone TEXT;
        v_whatsapp_count INTEGER := 0;
    BEGIN
        -- 1. DADOS DE VENDAS (máx 40 pontos)
        SELECT 
            COUNT(*) FILTER (WHERE status IN ('paid', 'approved')),
            COUNT(*),
            COALESCE(SUM(total_amount) FILTER (WHERE status IN ('paid', 'approved')), 0),
            COALESCE(EXTRACT(DAY FROM NOW() - MAX(created_at) FILTER (WHERE status IN ('paid', 'approved'))), 999)::INTEGER,
            MAX(customer_phone)
        INTO v_paid_orders, v_total_orders, v_ltv, v_days_since_last_purchase, v_customer_phone
        FROM sales
        WHERE customer_email = p_email;

        -- Pontos por compras pagas (max 20)
        v_score := v_score + LEAST(v_paid_orders * 10, 20);
        
        -- Pontos por LTV (max 10)
        IF v_ltv >= 500 THEN v_score := v_score + 10;
        ELSIF v_ltv >= 200 THEN v_score := v_score + 7;
        ELSIF v_ltv >= 100 THEN v_score := v_score + 5;
        ELSIF v_ltv >= 50 THEN v_score := v_score + 3;
        ELSIF v_ltv > 0 THEN v_score := v_score + 1;
        END IF;
        
        -- Pontos por recência (max 10)
        IF v_days_since_last_purchase <= 7 THEN v_score := v_score + 10;
        ELSIF v_days_since_last_purchase <= 14 THEN v_score := v_score + 8;
        ELSIF v_days_since_last_purchase <= 30 THEN v_score := v_score + 5;
        ELSIF v_days_since_last_purchase <= 60 THEN v_score := v_score + 2;
        END IF;

        -- 2. DADOS DE ANALYTICS/VISITAS (máx 30 pontos)
        WITH customer_ips AS (
            SELECT DISTINCT ip_address 
            FROM sales 
            WHERE customer_email = p_email AND ip_address IS NOT NULL
        )
        SELECT 
            COUNT(*),
            COUNT(DISTINCT page_path),
            BOOL_OR(utm_source IS NOT NULL),
            BOOL_OR(fbclid IS NOT NULL OR fbc IS NOT NULL OR fbp IS NOT NULL)
        INTO v_total_visits, v_unique_pages, v_has_utm, v_has_fbclid
        FROM analytics_visits
        WHERE ip_address IN (SELECT ip_address FROM customer_ips);

        -- Pontos por total de visitas (max 10)
        IF v_total_visits >= 20 THEN v_score := v_score + 10;
        ELSIF v_total_visits >= 10 THEN v_score := v_score + 7;
        ELSIF v_total_visits >= 5 THEN v_score := v_score + 5;
        ELSIF v_total_visits >= 2 THEN v_score := v_score + 3;
        ELSIF v_total_visits >= 1 THEN v_score := v_score + 1;
        END IF;
        
        -- Pontos por páginas únicas (max 10)
        IF v_unique_pages >= 10 THEN v_score := v_score + 10;
        ELSIF v_unique_pages >= 5 THEN v_score := v_score + 7;
        ELSIF v_unique_pages >= 3 THEN v_score := v_score + 5;
        ELSIF v_unique_pages >= 2 THEN v_score := v_score + 3;
        END IF;

        -- 3. TRACKING/ATRIBUIÇÃO (máx 15 pontos)
        IF v_has_fbclid THEN v_score := v_score + 8; END IF;
        IF v_has_utm THEN v_score := v_score + 7; END IF;

        -- 4. WHATSAPP (máx 15 pontos)
        IF v_customer_phone IS NOT NULL THEN
            SELECT COUNT(*)
            INTO v_whatsapp_count
            FROM whatsapp_messages
            WHERE from_me = FALSE
            AND remote_jid LIKE '%' || REGEXP_REPLACE(v_customer_phone, '[^0-9]', '', 'g') || '%';
            
            IF v_whatsapp_count >= 5 THEN v_score := v_score + 15;
            ELSIF v_whatsapp_count >= 3 THEN v_score := v_score + 10;
            ELSIF v_whatsapp_count >= 1 THEN v_score := v_score + 5;
            END IF;
        END IF;

        -- Garantir que o score está entre 0 e 100
        RETURN GREATEST(0, LEAST(100, v_score));
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant permissions
    GRANT EXECUTE ON FUNCTION calculate_customer_engagement_score(TEXT) TO authenticated;
    GRANT EXECUTE ON FUNCTION calculate_customer_engagement_score(TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION calculate_customer_engagement_score(TEXT) TO anon;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Se exec_sql não existir, tentar de outra forma
      console.log('⚠️ exec_sql não disponível, tentando método alternativo...');
      
      // Vamos criar usando a Dashboard API ou SQL direto
      console.log('\n📋 Execute o seguinte SQL no Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/egsmraszqnmosmtjuzhx/sql/new\n');
      console.log('=' .repeat(60));
      console.log(sql);
      console.log('=' .repeat(60));
      
      return;
    }

    console.log('✅ Função criada com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n📋 Execute o SQL manualmente no Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/egsmraszqnmosmtjuzhx/sql/new\n');
  }
}

// Testar a função após criar
async function testFunction() {
  console.log('\n🧪 Testando a função...');
  
  const { data, error } = await supabase.rpc('calculate_customer_engagement_score', {
    p_email: 'bernadetebottene@gmail.com'
  });

  if (error) {
    console.log('❌ Erro ao testar:', error.message);
    return;
  }

  console.log('✅ Score de Bernadete:', data);
}

createEngagementScoreFunction().then(testFunction);
