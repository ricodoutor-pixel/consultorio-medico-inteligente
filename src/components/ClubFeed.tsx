import React, { useState } from "react";
import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";

interface FeedPost {
  id: string;
  author: string;
  profession: string;
  avatar: string;
  image: string;
  testimonial: string;
  likes: number;
  comments: number;
  timestamp: string;
  liked?: boolean;
}

interface ClubFeedProps {
  className?: string;
}

// Posts de exemplo com imagens de alta fidelidade (IA geradas)
export const SAMPLE_POSTS: FeedPost[] = [
  {
    id: "1",
    author: "Maria Silva",
    profession: "Médica",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=500&fit=crop",
    testimonial:
      "Planta & Raiz transformou minha prática clínica. Agora posso oferecer tratamentos com cannabis medicinal de forma segura e legal. Recomendo!",
    likes: 245,
    comments: 18,
    timestamp: "há 2 dias",
    liked: false,
  },
  {
    id: "2",
    author: "João Santos",
    profession: "Paciente",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop",
    testimonial:
      "Minha qualidade de vida melhorou drasticamente. O atendimento da Brisa é impecável e o Dr. foi muito atencioso. Muito obrigado!",
    likes: 512,
    comments: 42,
    timestamp: "há 5 dias",
    liked: false,
  },
  {
    id: "3",
    author: "Ana Costa",
    profession: "Enfermeira",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop",
    testimonial:
      "Trabalhar na Planta & Raiz é gratificante. Vejo pessoas recuperando suas vidas todos os dias. Isso é medicina de verdade!",
    likes: 189,
    comments: 15,
    timestamp: "há 1 semana",
    liked: false,
  },
  {
    id: "4",
    author: "Carlos Mendes",
    profession: "Paciente",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop",
    testimonial:
      "Finalmente encontrei uma solução para minha insônia. R$30 a orientação técnica é acessível e o resultado é real. Muito grato!",
    likes: 378,
    comments: 28,
    timestamp: "há 1 semana",
    liked: false,
  },
  {
    id: "5",
    author: "Beatriz Oliveira",
    profession: "Médica",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beatriz",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop",
    testimonial:
      "A conformidade CFM e LGPD da Planta & Raiz é exemplar. Sinto-me segura recomendando para meus pacientes.",
    likes: 234,
    comments: 12,
    timestamp: "há 2 semanas",
    liked: false,
  },
  {
    id: "6",
    author: "Pedro Alves",
    profession: "Paciente",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop",
    testimonial:
      "Democratizar o acesso à cannabis medicinal é o futuro. Planta & Raiz está liderando isso no Brasil. Parabéns!",
    likes: 456,
    comments: 35,
    timestamp: "há 2 semanas",
    liked: false,
  },
];

export default function ClubFeed({ className = "" }: ClubFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>(SAMPLE_POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const handleLike = (postId: string) => {
    const newLiked = new Set(likedPosts);
    const updatedPosts = posts.map((p) => {
      if (p.id !== postId) return p;
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
        return { ...p, likes: p.likes - 1 };
      } else {
        newLiked.add(postId);
        return { ...p, likes: p.likes + 1 };
      }
    });
    setLikedPosts(newLiked);
    setPosts(updatedPosts);
  };

  const handleShare = (post: FeedPost) => {
    const text = `"${post.testimonial}" - ${post.author} (${post.profession}) via Planta & Raiz`;
    const url = `https://plantayraiz.com.br/club`;

    if (navigator.share) {
      navigator.share({ title: "Planta & Raiz", text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert("Link copiado para clipboard!");
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📖 Feed da Comunidade</h2>
        <p className="text-gray-700">
          Histórias reais de pessoas que transformaram suas vidas com Planta & Raiz
        </p>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            {/* Header do Post */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.avatar}
                  alt={post.author}
                  className="w-12 h-12 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <div className="font-bold text-gray-900">{post.author}</div>
                  <div className="text-sm text-gray-500">
                    {post.profession} • {post.timestamp}
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Imagem */}
            <div className="relative bg-gray-100 aspect-square overflow-hidden">
              <img
                src={post.image}
                alt={post.author}
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
                loading="lazy"
              />
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Planta & Raiz
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-3">
              <p className="text-gray-800 leading-relaxed">{post.testimonial}</p>

              <div className="flex items-center gap-4 text-sm text-gray-600 py-2 border-t border-b border-gray-100">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{post.likes} curtidas</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments} comentários</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                    likedPosts.has(post.id)
                      ? "bg-red-50 text-red-600"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={likedPosts.has(post.id) ? "currentColor" : "none"}
                  />
                  <span className="font-bold">Curtir</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-bold">Comentar</span>
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-bold">Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <button className="w-full py-3 border-2 border-green-500 text-green-600 font-bold rounded-lg hover:bg-green-50 transition">
        Carregar Mais Histórias
      </button>
    </div>
  );
}
