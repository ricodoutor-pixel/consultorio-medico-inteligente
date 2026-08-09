/**
 * Club Planta y Raiz - E-commerce de Lifestyle + Rede Social de Turismo
 * Componente principal com produtos, feed social, drops exclusivos e gamificação
 */

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Clock, Zap, Trophy, Gift } from 'lucide-react';
import { clubProducts, socialPosts, exclusiveDrops, checkinLocations } from '@/data/clubProducts';

interface ClubPlantaRaizProps {
  isLoggedIn?: boolean;
  userMembershipLevel?: 'free' | 'member' | 'vip';
}

export const ClubPlantaRaiz: React.FC<ClubPlantaRaizProps> = ({
  isLoggedIn = false,
  userMembershipLevel = 'free',
}) => {
  const [activeTab, setActiveTab] = useState<'loja' | 'feed' | 'drops' | 'mapa'>('loja');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [countdownTime, setCountdownTime] = useState<number>(0);

  // Calcular tempo até o próximo drop
  useEffect(() => {
    const interval = setInterval(() => {
      const nextDrop = exclusiveDrops[0];
      if (nextDrop) {
        const timeUntilDrop = nextDrop.launchDate.getTime() - Date.now();
        setCountdownTime(Math.max(0, timeUntilDrop));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleAddToCart = (productId: string) => {
    setCartItems([...cartItems, productId]);
    setUserPoints(userPoints + 10);
  };

  const getMemberDiscount = (product: typeof clubProducts[0]) => {
    if (userMembershipLevel === 'vip') return product.memberDiscount + 5;
    if (userMembershipLevel === 'member') return product.memberDiscount;
    return 0;
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header com CTA */}
      <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">🌿 Club Planta y Raiz</h1>
          <p className="text-lg opacity-90">
            E-commerce de Lifestyle + Rede Social de Turismo de Natureza
          </p>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur border-b border-purple-500/20 z-40">
        <div className="max-w-7xl mx-auto flex gap-4 px-4 py-4">
          <button
            onClick={() => setActiveTab('loja')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'loja'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛍️ Loja
          </button>
          {isLoggedIn && (
            <>
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'feed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                📸 Feed Social
              </button>
              <button
                onClick={() => setActiveTab('mapa')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'mapa'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🗺️ Mapa de Check-ins
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('drops')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'drops'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ⚡ Drops Exclusivos
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* TAB: LOJA */}
        {activeTab === 'loja' && (
          <div className="space-y-8">
            {/* Filtros por Categoria */}
            <div className="flex gap-4 overflow-x-auto pb-4">
              {['camisetas', 'bones', 'chapeus', 'canecas'].map((category) => (
                <button
                  key={category}
                  className="px-6 py-2 rounded-full bg-slate-800 hover:bg-purple-600 text-white whitespace-nowrap transition"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubProducts.map((product) => {
                const discount = getMemberDiscount(product);
                const finalPrice = product.price * (1 - discount / 100);

                return (
                  <div
                    key={product.id}
                    className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition group"
                  >
                    {/* Imagem do Produto */}
                    <div className="relative overflow-hidden h-64 bg-gradient-to-br from-purple-500/10 to-cyan-500/10">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      {product.isLimitedEdition && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          🔥 Limitado
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          -{discount}% Membro
                        </div>
                      )}
                    </div>

                    {/* Informações do Produto */}
                    <div className="p-4 space-y-3">
                      <h3 className="text-lg font-bold text-white">{product.name}</h3>
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Preço */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-emerald-400">
                          R$ {finalPrice.toFixed(2)}
                        </span>
                        {discount > 0 && (
                          <span className="text-sm text-slate-400 line-through">
                            R$ {product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-yellow-400">⭐ {product.rating}</span>
                        <span className="text-slate-400">({product.reviews} avaliações)</span>
                      </div>

                      {/* Botão Adicionar ao Carrinho */}
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-2 rounded-lg transition"
                      >
                        🛒 Adicionar ao Carrinho
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: FEED SOCIAL */}
        {activeTab === 'feed' && isLoggedIn && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">📸 Feed de Turismo</h2>
            {socialPosts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition"
              >
                {/* Header do Post */}
                <div className="p-4 flex items-center justify-between border-b border-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{post.avatar}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{post.author}</h4>
                        {post.memberBadge && (
                          <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                            ✓ Membro
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {post.timestamp.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <MapPin className="text-cyan-400 w-5 h-5" />
                </div>

                {/* Conteúdo */}
                <div className="p-4 space-y-4">
                  <p className="text-slate-200">{post.content}</p>

                  {/* Imagens */}
                  {post.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-lg overflow-hidden">
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post ${idx}`}
                          className="w-full h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Localização */}
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <MapPin className="w-4 h-4" />
                    {post.location}
                  </div>
                </div>

                {/* Ações */}
                <div className="px-4 py-3 flex gap-6 border-t border-purple-500/10 text-slate-400">
                  <button className="flex items-center gap-2 hover:text-red-500 transition">
                    <Heart className="w-5 h-5" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-2 hover:text-cyan-400 transition">
                    <MessageCircle className="w-5 h-5" /> {post.comments}
                  </button>
                  <button className="flex items-center gap-2 hover:text-emerald-400 transition">
                    <Share2 className="w-5 h-5" /> Compartilhar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: DROPS EXCLUSIVOS */}
        {activeTab === 'drops' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500/20 to-purple-500/20 border border-red-500/50 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">⚡ Próximo Drop Exclusivo</h2>
                  <p className="text-slate-300">
                    Edição Especial: Verdinho Astronauta - Apenas 100 unidades!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-400">
                    {formatCountdown(countdownTime)}
                  </div>
                  <p className="text-sm text-slate-400">até o lançamento</p>
                </div>
              </div>
            </div>

            {/* Grid de Drops */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exclusiveDrops.map((drop) => (
                <div
                  key={drop.id}
                  className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl overflow-hidden"
                >
                  <img
                    src={drop.image}
                    alt={drop.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-bold text-white">{drop.name}</h3>
                    <p className="text-sm text-slate-300">{drop.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">{drop.quantity} unidades</span>
                      </div>
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{drop.discount}%
                      </span>
                    </div>
                    {drop.isMemberOnly && (
                      <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-2 text-center text-purple-300 text-sm font-semibold">
                        👑 Exclusivo para Membros
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: MAPA DE CHECK-INS */}
        {activeTab === 'mapa' && isLoggedIn && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">🗺️ Mapa Interativo de Check-ins</h2>

            {/* Estatísticas do Usuário */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Seus Pontos</p>
                    <p className="text-2xl font-bold text-white">{userPoints}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Check-ins</p>
                    <p className="text-2xl font-bold text-white">12</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-emerald-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Cupons Ganhos</p>
                    <p className="text-2xl font-bold text-white">3</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Locais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {checkinLocations.map((location) => (
                <div
                  key={location.id}
                  className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition"
                >
                  <img
                    src={location.image}
                    alt={location.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-bold text-white">{location.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      {location.description}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-400">⭐ {location.rating}</span>
                      <span className="text-slate-400">{location.checkins} check-ins</span>
                    </div>
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-2 rounded-lg transition">
                      📍 Fazer Check-in
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Carrinho Flutuante */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-8 right-8 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full w-16 h-16 flex items-center justify-center cursor-pointer hover:scale-110 transition shadow-lg">
          <div className="text-center">
            <div className="text-2xl">🛒</div>
            <div className="text-xs font-bold">{cartItems.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubPlantaRaiz;
