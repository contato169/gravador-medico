import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const revalidate = 30; // Cache de 30s

export interface Customer {
  email: string;
  name: string;
  phone: string;
  cpf: string;
  total_orders: number;
  paid_orders: number;
  ltv: number;
  aov: number;
  first_purchase: string;
  last_purchase: string;
  days_since_last_purchase: number;
  active_days: number;
  segment: 'VIP' | 'New' | 'Dormant' | 'Churn Risk' | 'Regular';
  engagement_score: number;
  acquisition_source: string | null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 })
  }

  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    
    // Parâmetros
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const segment = searchParams.get('segment') || '';
    const sortBy = searchParams.get('sortBy') || 'first_purchase';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Base query - APENAS clientes que efetivamente compraram (paid_orders > 0)
    let query = supabase
      .from('customer_intelligence')
      .select('*', { count: 'exact' })
      .gt('paid_orders', 0);
    
    // Busca full-text (nome, email, telefone ou CPF)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,cpf.ilike.%${search}%`);
    }
    
    // Filtro por segmento
    if (segment) {
      query = query.eq('segment', segment);
    }
    
    // Ordenação
    const validSortFields = ['ltv', 'aov', 'total_orders', 'last_purchase', 'first_purchase', 'engagement_score', 'days_since_last_purchase'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'first_purchase';
    query = query.order(orderField, { ascending: sortOrder === 'asc', nullsFirst: false });
    
    // Paginação
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Error fetching customers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Estatísticas agregadas (para cards no topo)
    const { data: stats } = await supabase.rpc('get_customer_stats');
    
    return NextResponse.json({
      customers: data as Customer[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: stats?.[0] || {
        total_customers: 0,
        vip_count: 0,
        dormant_count: 0,
        total_ltv: 0,
        avg_ltv: 0,
      },
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/customers/[email] - Detalhes de um cliente específico
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 })
  }

  try {
    const supabase = supabaseAdmin;
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    // Buscar dados do cliente
    const { data: customer, error: customerError } = await supabase
      .from('customer_intelligence')
      .select('*')
      .eq('email', email)
      .single();
    
    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    
    // Buscar últimas vendas
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Buscar notas internas
    const { data: notes, error: notesError } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Buscar última visita (analytics)
    const { data: lastVisit } = await supabase
      .from('analytics_visits')
      .select('created_at, page')
      .eq('session_id', email) // Assumindo que session_id pode ter email
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return NextResponse.json({
      customer,
      sales: sales || [],
      notes: notes || [],
      lastVisit: lastVisit || null,
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
