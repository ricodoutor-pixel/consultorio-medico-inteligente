// @ts-nocheck
/**
 * ═══════════════════════════════════════════════════════════════
 * MÓDULO 2: CLUB & MARKETPLACE — FLUXO DE CONVERSÃO
 * Implementação de AuthGuard, Galeria Tripla e Integração MP
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MessageCircle, Share2, ShoppingCart } from 'lucide-react';

// 🔵 INTERFACE: Estrutura de Post com 3 Fotos
interface ClubPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images: string[]; // Exatamente 3 imagens
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: Date;
}

// 🔵 INTERFACE: Produto do Marketplace
interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  mpCheckoutUrl?: string; // URL do Mercado Pago
}

/**
 * 🔵 COMPONENTE: AuthGuard para Botão "Postar"
 * Apenas usuários autenticados podem postar
 */
export const PostButtonGuard: React.FC<{
  onPostClick: () => void;
  isLoading?: boolean;
}> = ({ onPostClick, isLoading = false }) => {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="h-10 bg-gray-700 rounded animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg text-center">
        <p className="text-sm text-yellow-400">
          Faça login para postar no Club
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={onPostClick}
      disabled={isLoading}
      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
    >
      {isLoading ? 'Postando...' : '✨ Postar no Club'}
    </button>
  );
};

/**
 * 🔵 COMPONENTE: Galeria Tripla com object-fit: cover
 * Exatamente 3 fotos por post, sem distorção
 */
export const TripleGallery: React.FC<{
  images: string[];
  alt: string;
}> = ({ images, alt }) => {
  // Garantir exatamente 3 imagens
  const displayImages = images.slice(0, 3).concat(
    Array(Math.max(0, 3 - images.length)).fill('')
  );

  return (
    <div className="grid grid-cols-3 gap-2 w-full my-4">
      {displayImages.map((image, index) => (
        <div
          key={index}
          className="relative w-full aspect-square bg-gray-800 rounded-lg overflow-hidden"
        >
          {image ? (
            <img
              src={image}
              alt={`${alt} - Foto ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://via.placeholder.com/300?text=Imagem+Indisponível';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Sem imagem</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * 🔵 COMPONENTE: Card de Post do Club
 */
export const ClubPostCard: React.FC<{
  post: ClubPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}> = ({ post, onLike, onComment, onShare }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
      {/* Header do Post */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={post.userAvatar}
          alt={post.userName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-white">{post.userName}</p>
          <p className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Conteúdo do Post */}
      <p className="text-gray-300 mb-4">{post.content}</p>

      {/* Galeria Tripla */}
      <TripleGallery images={post.images} alt={post.userName} />

      {/* Ações */}
      <div className="flex justify-around pt-4 border-t border-gray-800">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
            post.isLiked
              ? 'text-red-500 bg-red-500/10'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
          }`}
        >
          <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm">{post.likes}</span>
        </button>

        <button
          onClick={() => onComment(post.id)}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-sm">{post.comments}</span>
        </button>

        <button
          onClick={() => onShare(post.id)}
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors"
        >
          <Share2 size={18} />
          <span className="text-sm">{post.shares}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * 🔵 COMPONENTE: Botão "Comprar" com Integração Mercado Pago
 */
export const BuyButtonMP: React.FC<{
  product: MarketplaceProduct;
  isLoading?: boolean;
}> = ({ product, isLoading = false }) => {
  const handleBuyClick = async () => {
    try {
      if (product.mpCheckoutUrl) {
        // Redirecionar para checkout do Mercado Pago
        window.location.href = product.mpCheckoutUrl;
      } else {
        // Fallback: criar checkout dinamicamente
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
          }),
        });

        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (error) {
      console.error('Erro ao iniciar compra:', error);
      alert('Erro ao processar compra. Tente novamente.');
    }
  };

  return (
    <button
      onClick={handleBuyClick}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
    >
      <ShoppingCart size={18} />
      {isLoading ? 'Processando...' : `Comprar - R$ ${product.price.toFixed(2)}`}
    </button>
  );
};

/**
 * 🔵 COMPONENTE: Card de Produto do Marketplace
 */
export const MarketplaceProductCard: React.FC<{
  product: MarketplaceProduct;
  onBuy?: (product: MarketplaceProduct) => void;
}> = ({ product, onBuy }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      if (onBuy) {
        onBuy(product);
      } else {
        // Integração padrão com Mercado Pago
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
          }),
        });

        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (error) {
      console.error('Erro ao comprar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-green-600 transition-colors">
      {/* Imagem do Produto */}
      <div className="relative w-full aspect-square bg-gray-800 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/300?text=Produto';
          }}
        />
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
          {product.category}
        </div>
      </div>

      {/* Informações do Produto */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Preço e Botão */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-green-400">
            R$ {product.price.toFixed(2)}
          </span>
          <button
            onClick={handleBuy}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded transition-colors text-sm"
          >
            {isLoading ? '...' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 🔵 COMPONENTE: Link para Club (apenas em Comunidade)
 */
export const ClubAccessLink: React.FC<{
  isInCommunity?: boolean;
}> = ({ isInCommunity = false }) => {
  if (!isInCommunity) {
    return null; // Não renderizar em outras páginas
  }

  return (
    <div className="bg-gradient-to-r from-green-600/20 to-purple-600/20 border border-green-600/50 rounded-lg p-6 text-center mb-6">
      <h3 className="text-xl font-bold text-white mb-2">
        🎉 Bem-vindo ao Club Planta y Raiz
      </h3>
      <p className="text-gray-300 mb-4">
        Acesse produtos exclusivos, posts de comunidade e descontos especiais
      </p>
      <a
        href="/club"
        className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
      >
        ✨ Acessar Club
      </a>
    </div>
  );
};

export default {
  PostButtonGuard,
  TripleGallery,
  ClubPostCard,
  BuyButtonMP,
  MarketplaceProductCard,
  ClubAccessLink,
};
