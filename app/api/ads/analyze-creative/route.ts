/**
 * =====================================================
 * API: ANALISAR CRIATIVO COM IA
 * =====================================================
 * 
 * POST /api/ads/analyze-creative
 * 
 * Recebe um criativo (imagem/vídeo) e retorna:
 * - Análise visual completa
 * - Recomendação automática de objetivo
 * - Ângulos de copywriting sugeridos
 * 
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeCreative, CreativeFormat } from '@/lib/meta/creative-analyzer';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação via cookie auth_token ou header Authorization
    let token: string | undefined;
    
    // Tentar do header primeiro
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    // Se não tiver no header, tentar do cookie
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar JWT próprio
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    console.log(`🎨 [Analyze Creative API] Usuário: ${payload.email}`);

    // Parse do FormData
    const formData = await req.formData();
    const format = formData.get('format') as CreativeFormat;
    const file = formData.get('file') as File;

    // Validações
    if (!format || !['IMAGE', 'VIDEO', 'CAROUSEL'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use: IMAGE, VIDEO ou CAROUSEL' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const allowedTypes = format === 'VIDEO' ? allowedVideoTypes : allowedImageTypes;
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo inválido: ${file.type}` },
        { status: 400 }
      );
    }

    // Validar tamanho (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 50MB' },
        { status: 400 }
      );
    }

    console.log(`🎨 [Analyze Creative API] Formato: ${format}, Arquivo: ${file.name}, Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // Upload para Supabase Storage
    const fileExt = file.name.split('.').pop() || 'jpg';
    // Usar email sanitizado como folder
    const userFolder = payload.email.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${userFolder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const fileBuffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('creatives')
      .upload(`temp/${fileName}`, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('[Analyze Creative API] Erro upload:', uploadError);
      throw new Error('Erro ao fazer upload do arquivo: ' + uploadError.message);
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('creatives')
      .getPublicUrl(`temp/${fileName}`);

    console.log(`📤 [Analyze Creative API] Upload concluído: ${publicUrl}`);

    // Analisar com GPT-5.2 Vision
    const analysis = await analyzeCreative(publicUrl, format);

    console.log('✅ [Analyze Creative API] Análise concluída');
    console.log(`💡 Recomendação: ${analysis.recommended_objective} (${analysis.recommendation_confidence}% confiança)`);

    return NextResponse.json({
      success: true,
      analysis,
      creative_url: publicUrl,
      file_name: fileName
    });

  } catch (error: any) {
    console.error('[Analyze Creative API] Erro:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro interno ao analisar criativo',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Route Segment Config para Next.js App Router
// FormData é processado nativamente, não precisa de configuração especial
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos para análise com GPT Vision
