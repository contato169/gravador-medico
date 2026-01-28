import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ALL_PRODUCTS } from '@/lib/products-config'

/**
 * 🧹 LIMPAR PRODUTOS FAKE E INSERIR APENAS OS REAIS
 * 
 * Esta rota:
 * 1. Remove produtos que não estão no products-config.ts
 * 2. Insere/atualiza os 4 produtos reais
 * 
 * URL: /api/admin/products/fix-real
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Limpando produtos fake...')

    // IDs reais dos produtos
    const realProductIds = ALL_PRODUCTS.map(p => p.appmax_product_id)
    
    console.log('📋 IDs reais:', realProductIds)

    // 1️⃣ DELETAR produtos que NÃO estão na lista de reais
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .not('external_id', 'in', `(${realProductIds.join(',')})`)

    if (deleteError) {
      console.error('❌ Erro ao deletar produtos fake:', deleteError)
    } else {
      console.log('✅ Produtos fake removidos')
    }

    // 2️⃣ INSERIR/ATUALIZAR os produtos reais
    const results = []

    for (const product of ALL_PRODUCTS) {
      console.log(`📦 Processando: ${product.name}`)

      const productData = {
        external_id: product.appmax_product_id,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url || `https://gravadormedico.com.br/images/${product.sku}.png`,
        category: product.category,
        plan_type: product.type === 'main' ? 'lifetime' : product.type,
        is_active: product.is_active,
        is_featured: product.is_featured,
        checkout_url: product.appmax_checkout_url || null,
        updated_at: new Date().toISOString()
      }

      // Verificar se existe
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('external_id', product.appmax_product_id)
        .single()

      if (existing) {
        // Atualizar
        const { error } = await supabaseAdmin
          .from('products')
          .update(productData)
          .eq('id', existing.id)

        if (error) {
          console.error(`❌ Erro ao atualizar ${product.name}:`, error)
          results.push({ product: product.name, status: 'error', error: error.message })
        } else {
          console.log(`✅ Atualizado: ${product.name}`)
          results.push({ product: product.name, status: 'updated' })
        }
      } else {
        // Inserir
        const { error } = await supabaseAdmin
          .from('products')
          .insert({
            ...productData,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error(`❌ Erro ao inserir ${product.name}:`, error)
          results.push({ product: product.name, status: 'error', error: error.message })
        } else {
          console.log(`✅ Criado: ${product.name}`)
          results.push({ product: product.name, status: 'created' })
        }
      }
    }

    // 3️⃣ BUSCAR produtos finais
    const { data: finalProducts } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('price', { ascending: false })

    console.log('✅ Limpeza e sincronização concluída!')
    console.log(`📦 Total de produtos: ${finalProducts?.length}`)

    return NextResponse.json({
      success: true,
      message: `✅ Produtos corrigidos! ${finalProducts?.length} produtos reais no sistema`,
      results,
      products: finalProducts,
      summary: {
        total: results.length,
        created: results.filter(r => r.status === 'created').length,
        updated: results.filter(r => r.status === 'updated').length,
        errors: results.filter(r => r.status === 'error').length
      }
    })

  } catch (error: any) {
    console.error('❌ Erro crítico:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}

// Permitir GET também
export async function GET() {
  return POST({} as NextRequest)
}
