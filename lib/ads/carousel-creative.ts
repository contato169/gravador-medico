// lib/ads/carousel-creative.ts
// ✅ Suporte a anúncios de carrossel (múltiplos cards) - Meta API v24.0

/**
 * Interface para cada card do carrossel
 */
export interface CarouselCard {
  title: string;        // Título do card (max 25 chars)
  description: string;  // Descrição (max 30 chars)
  imageHash?: string;   // Hash da imagem (upload via AdImage)
  imageUrl?: string;    // URL da imagem (alternativa ao hash)
  link: string;         // URL de destino do card
  videoId?: string;     // ID do vídeo (opcional, para carousel de vídeos)
}

/**
 * Parâmetros para criar um carousel
 */
export interface CreateCarouselParams {
  accountId: string;
  accessToken: string;
  pageId: string;
  instagramActorId?: string;
  name?: string;
  message: string;      // Texto principal que aparece acima do carousel
  cards: CarouselCard[];
  callToAction: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'BOOK_NOW' | 'CONTACT_US' | 'GET_QUOTE' | 'DOWNLOAD';
  caption?: string;     // Legenda final (ex: "Veja mais produtos")
  showEndCard?: boolean; // Mostrar card final "Ver Mais" (padrão: true)
}

/**
 * Cria um Creative de Carousel
 * 
 * Requisitos:
 * - Mínimo 2 cards, máximo 10 cards
 * - Cada card precisa de imagem (hash ou URL) ou vídeo
 * - Todos os cards devem ter o mesmo CTA
 */
export async function createCarouselCreative(params: CreateCarouselParams): Promise<string> {
  try {
    console.log('🎠 [Carousel] Criando creative com', params.cards.length, 'cards...');

    // Validações
    if (params.cards.length < 2) {
      throw new Error('Carousel precisa de pelo menos 2 cards');
    }
    if (params.cards.length > 10) {
      throw new Error('Carousel pode ter no máximo 10 cards');
    }

    // Validar que cada card tem imagem ou vídeo
    for (let i = 0; i < params.cards.length; i++) {
      const card = params.cards[i];
      if (!card.imageHash && !card.imageUrl && !card.videoId) {
        throw new Error(`Card ${i + 1} precisa de imagem (imageHash/imageUrl) ou vídeo (videoId)`);
      }
    }

    // Construir child_attachments (cada card)
    const childAttachments = params.cards.map((card, index) => {
      const attachment: any = {
        name: card.title.substring(0, 25), // Max 25 chars
        description: card.description.substring(0, 30), // Max 30 chars
        link: card.link,
        call_to_action: {
          type: params.callToAction
        }
      };

      // Adicionar mídia
      if (card.videoId) {
        attachment.video_id = card.videoId;
      } else if (card.imageHash) {
        attachment.image_hash = card.imageHash;
      } else if (card.imageUrl) {
        attachment.picture = card.imageUrl;
      }

      console.log(`   📇 Card ${index + 1}: "${card.title}" → ${card.link.substring(0, 50)}...`);

      return attachment;
    });

    // Construir dados do creative
    const creativeData = {
      name: params.name || `Carousel - ${new Date().toISOString()}`,
      object_story_spec: {
        page_id: params.pageId,
        ...(params.instagramActorId && { instagram_actor_id: params.instagramActorId }),
        link_data: {
          message: params.message,
          link: params.cards[0].link, // Link principal (primeiro card)
          child_attachments: childAttachments,
          caption: params.caption || 'Veja mais',
          multi_share_end_card: params.showEndCard !== false, // Botão "Ver Mais" no final
          multi_share_optimized: true // ✅ Meta otimiza a ordem dos cards
        }
      },
      // ✅ Advantage+ Creative para carousels
      degrees_of_freedom_spec: {
        creative_features_spec: {
          standard_enhancements: {
            enroll_status: 'OPT_IN' // IA otimiza automaticamente
          }
        }
      },
      access_token: params.accessToken
    };

    // Criar via API
    const response = await fetch(
      `https://graph.facebook.com/v24.0/act_${params.accountId}/adcreatives`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [Carousel] Erro da API:', errorData);
      throw new Error(errorData.error?.message || 'Erro ao criar carousel');
    }

    const data = await response.json();
    console.log('✅ [Carousel] Creative criado. ID:', data.id);
    
    return data.id;
    
  } catch (error: any) {
    console.error('❌ [Carousel] Erro ao criar:', error.message);
    throw error;
  }
}

/**
 * Cria um Carousel de Produtos (para e-commerce)
 * Versão simplificada com produtos do catálogo
 */
export async function createProductCarousel(params: {
  accountId: string;
  accessToken: string;
  pageId: string;
  productSetId: string; // ID do Product Set no Catálogo
  message: string;
  templateTitle?: string;
  templateDescription?: string;
}) {
  try {
    console.log('🛒 [Carousel] Criando carousel de produtos...');

    const creativeData = {
      name: `Product Carousel - ${new Date().toISOString()}`,
      object_story_spec: {
        page_id: params.pageId,
        template_data: {
          message: params.message,
          name: params.templateTitle || '{{product.name}}',
          description: params.templateDescription || '{{product.price}}',
          link: '{{product.url}}',
          call_to_action: {
            type: 'SHOP_NOW'
          }
        }
      },
      product_set_id: params.productSetId,
      access_token: params.accessToken
    };

    const response = await fetch(
      `https://graph.facebook.com/v24.0/act_${params.accountId}/adcreatives`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro ao criar product carousel');
    }

    const data = await response.json();
    console.log('✅ [Carousel] Product carousel criado. ID:', data.id);
    
    return data.id;
    
  } catch (error: any) {
    console.error('❌ [Carousel] Erro ao criar product carousel:', error.message);
    throw error;
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Faz upload de múltiplas imagens para usar no carousel
 */
export async function uploadCarouselImages(params: {
  accountId: string;
  accessToken: string;
  images: { buffer: Buffer; filename: string }[];
}): Promise<string[]> {
  console.log('🖼️ [Carousel] Fazendo upload de', params.images.length, 'imagens...');

  const imageHashes: string[] = [];

  for (const image of params.images) {
    try {
      const formData = new FormData();
      formData.append('bytes', image.buffer.toString('base64'));
      formData.append('access_token', params.accessToken);

      const response = await fetch(
        `https://graph.facebook.com/v24.0/act_${params.accountId}/adimages`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Erro no upload de', image.filename);
        continue;
      }

      const data = await response.json();
      const hash = Object.values(data.images || {})[0] as any;
      
      if (hash?.hash) {
        imageHashes.push(hash.hash);
        console.log(`   ✅ ${image.filename}: ${hash.hash}`);
      }

    } catch (error: any) {
      console.warn('⚠️ Erro no upload:', error.message);
    }
  }

  console.log('✅ [Carousel]', imageHashes.length, 'imagens enviadas');
  return imageHashes;
}

/**
 * Exemplo de uso do Carousel
 */
export const CAROUSEL_EXAMPLE = {
  message: '🔥 Conheça nossos principais recursos!',
  cards: [
    {
      title: 'Transcrição em 30s',
      description: 'Prontuário completo',
      imageUrl: 'https://example.com/image1.jpg',
      link: 'https://gravador-medico.com.br/funcionalidades#transcricao'
    },
    {
      title: 'Economize 15h/semana',
      description: 'Mais tempo livre',
      imageUrl: 'https://example.com/image2.jpg',
      link: 'https://gravador-medico.com.br/funcionalidades#economia'
    },
    {
      title: 'Preço único R$36',
      description: 'Sem mensalidade',
      imageUrl: 'https://example.com/image3.jpg',
      link: 'https://gravador-medico.com.br/checkout'
    }
  ],
  callToAction: 'LEARN_MORE' as const
};
