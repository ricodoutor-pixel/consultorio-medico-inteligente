import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, ThumbsUp, Flag, Search, Filter } from 'lucide-react';

export default function Reviews() {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: 'João Silva',
      rating: 5,
      title: 'Excelente profissional!',
      content: 'Dr. Carlos foi muito atencioso e profissional. Recomendo para todos!',
      verified: true,
      helpful: 24,
      sentiment: 'positive',
      date: '2026-02-20',
    },
    {
      id: 2,
      author: 'Maria Santos',
      rating: 4,
      title: 'Bom atendimento',
      content: 'Muito bom, mas poderia ter sido mais rápido.',
      verified: true,
      helpful: 12,
      sentiment: 'positive',
      date: '2026-02-19',
    },
    {
      id: 3,
      author: 'Pedro Costa',
      rating: 3,
      title: 'Atendimento ok',
      content: 'Nada de especial, mas também não foi ruim.',
      verified: false,
      helpful: 5,
      sentiment: 'neutral',
      date: '2026-02-18',
    },
  ]);

  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'helpful' | 'recent' | 'rating'>('helpful');

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  let filteredReviews = reviews.filter(r => {
    if (filterRating && r.rating !== filterRating) return false;
    if (searchTerm && !r.content.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (sortBy === 'helpful') {
    filteredReviews.sort((a, b) => b.helpful - a.helpful);
  } else if (sortBy === 'recent') {
    filteredReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else if (sortBy === 'rating') {
    filteredReviews.sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white">Avaliações e Reviews</h1>
          <p className="text-gray-400">Veja o que nossos pacientes dizem</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* SIDEBAR - RATING SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border border-[#00FF00]/20 p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Resumo</h2>

              {/* Rating Médio */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-bold text-[#00FF00]">{avgRating}</span>
                  <div>
                    <div className="flex gap-1">
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(parseFloat(avgRating))
                              ? 'fill-[#00FF00] text-[#00FF00]'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{reviews.length} avaliações</p>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      filterRating === rating
                        ? 'bg-[#00FF00]/20 border border-[#00FF00]'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex gap-1">
                      {Array(rating).fill(0).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#00FF00] text-[#00FF00]" />
                      ))}
                    </div>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00FF00]"
                        style={{ width: `${(ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">{ratingDistribution[rating as keyof typeof ratingDistribution]}</span>
                  </button>
                ))}
              </div>

              <Button className="w-full bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold mt-6">
                Escrever Avaliação
              </Button>
            </Card>
          </div>

          {/* MAIN CONTENT - REVIEWS */}
          <div className="lg:col-span-3">
            {/* SEARCH AND FILTER */}
            <div className="mb-8 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-[#00FF00]/30 text-white"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white/10 border border-[#00FF00]/30 text-white px-4 py-2 rounded-lg"
                >
                  <option value="helpful">Mais úteis</option>
                  <option value="recent">Mais recentes</option>
                  <option value="rating">Melhor rating</option>
                </select>
              </div>
            </div>

            {/* REVIEWS LIST */}
            <div className="space-y-4">
              {filteredReviews.map(review => (
                <Card key={review.id} className="bg-white/5 border border-[#00FF00]/20 p-6 hover:border-[#00FF00]/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{review.author}</h3>
                        {review.verified && (
                          <span className="bg-[#00FF00]/20 border border-[#00FF00] text-[#00FF00] text-xs px-2 py-1 rounded">
                            ✓ Verificado
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex gap-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-[#00FF00] text-[#00FF00]'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-400">{review.date}</span>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        review.sentiment === 'positive'
                          ? 'bg-[#00FF00]/20 text-[#00FF00]'
                          : review.sentiment === 'negative'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {review.sentiment === 'positive' ? '😊 Positivo' : review.sentiment === 'negative' ? '😞 Negativo' : '😐 Neutro'}
                    </div>
                  </div>

                  <h4 className="text-white font-semibold mb-2">{review.title}</h4>
                  <p className="text-gray-300 mb-4">{review.content}</p>

                  <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-[#00FF00] transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">Útil ({review.helpful})</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors">
                      <Flag className="w-4 h-4" />
                      <span className="text-sm">Reportar</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <Card className="bg-white/5 border border-[#00FF00]/20 p-12 text-center">
                <p className="text-gray-400">Nenhuma avaliação encontrada</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
