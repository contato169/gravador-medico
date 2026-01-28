import { NextRequest, NextResponse } from 'next/server';
import { getAdsInsights, DatePreset } from '@/lib/meta-marketing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datePreset = (searchParams.get('period') || 'maximum') as DatePreset;
    
    const insights = await getAdsInsights(datePreset);
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Erro ao buscar insights de anúncios:', error);
    return NextResponse.json([], { status: 500 });
  }
}
