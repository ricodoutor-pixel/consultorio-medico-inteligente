import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, ShoppingCart, Bell, Check, Trash2, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_BRISA = "https://wa.me/5511991363154";

const clubProducts = [
  { id: 1, name: "Camiseta Verdinho Explorer", price: 89.90, image: "🐸", desc: "100% algodão orgânico com estampa exclusiva do Verdinho" },
  { id: 2, name: "Caneca Térmica Natureza", price: 59.90, image: "☕", desc: "Caneca térmica 450ml com arte botânica" },
  { id: 3, name: "Boné Trucker Roots", price: 69.90, image: "🧢", desc: "Boné ajustável com bordado Planta y Raiz" },
  { id: 4, name: "Camiseta Enfermeira Brisa", price: 89.90, image: "👩‍⚕️", desc: "Estampa exclusiva da Enfermeira Brisa IA" },
  { id: 5, name: "Ecobag Cannabis Medicinal", price: 39.90, image: "🌿", desc: "Sacola ecológica reutilizável com arte verde" },
  { id: 6, name: "Chapéu de Praia Tropical", price: 79.90, image: "🏖️", desc: "Proteção UV com estilo tropical exclusivo" },
  { id: 7, name: "Squeeze 750ml Hydra", price: 49.90, image: "💧", desc: "Garrafa térmica com logo Planta y Raiz" },
  { id: 8, name: "Camiseta Dr. Edilson Edition", price: 99.90, image: "👨‍⚕️", desc: "Edição limitada com assinatura digital" },
  { id: 9, name: "Kit Adesivos Verdinho", price: 24.90, image: "🎨", desc: "10 adesivos vinil premium do Verdinho" },
  { id: 10, name: "Moletom Premium Club", price: 159.90, image: "🧥", desc: "Moletom canguru bordado edição Club" },
];

const Club = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [commentModal, setCommentModal] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, any[]>>({});

  useEffect(() => {
    document.title = "Club Planta y Raiz - Lifestyle & Comunidade";
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadPosts();
  }, []);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadPosts = async () => {
    const { data } = await supabase
      .from("club_posts")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPosts(data);
  };

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("club_notifications")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from("club_post_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (data) setComments((prev) => ({ ...prev, [postId]: data }));
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast({ title: "Login necessário", description: "Faça login para postar.", variant: "destructive" });
      return;
    }
    if (!newPost.trim()) return;
    await supabase.from("club_posts").insert({ user_id: user.id, content: newPost });
    setNewPost("");
    loadPosts();
    toast({ title: "Post criado! 🌿" });
  };

  const handleLikePost = async (postId: string, currentLikes: number) => {
    if (!user) return;
    await supabase.from("club_post_likes").insert({ post_id: postId, user_id: user.id });
    await supabase.from("club_posts").update({ likes_count: currentLikes + 1 }).eq("id", postId);
    loadPosts();
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !commentText.trim()) return;
    await supabase.from("club_post_comments").insert({ post_id: postId, user_id: user.id, content: commentText });
    // Create notification for post author
    const post = posts.find((p) => p.id === postId);
    if (post && post.user_id !== user.id) {
      await supabase.from("club_notifications").insert({
        user_id: post.user_id,
        post_id: postId,
        triggered_by_user_id: user.id,
        type: "comment",
        title: "Novo comentário",
        message: `Alguém comentou no seu post`,
        action_url: `/club#post-${postId}`,
      });
    }
    await supabase.from("club_posts").update({ comment_count: (post?.comment_count || 0) + 1 }).eq("id", postId);
    setCommentText("");
    loadComments(postId);
    loadPosts();
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from("club_notifications").update({ is_read: true }).eq("id", id);
    loadNotifications();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("club_notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    loadNotifications();
  };

  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Navbar />
      <WhatsAppButton />

      {/* Notification Bell - Fixed */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative bg-card border border-border rounded-full p-3 shadow-lg hover:bg-muted transition"
          >
            <Bell size={20} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Notificações</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 border-b border-border hover:bg-muted/50 flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                        </div>
                        <button onClick={() => markNotificationRead(n.id)}>
                          <Check size={14} className="text-primary" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-black mb-4"
          >
            <span className="text-gradient-green">Club</span>{" "}
            <span className="text-foreground">Planta y Raiz</span>
          </motion.h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-4">
            Lifestyle, comunidade e produtos exclusivos. Pagamento via PIX ou BTC.
          </p>
          <p className="text-xs text-muted-foreground">
            📱 Planta y Raiz — Mega Clínica Digital presente em todos os dispositivos Android, iOS, Desktop
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">
            🛍️ Produtos Exclusivos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clubProducts.map((product) => (
              <Card key={product.id} className="bg-card border-border hover:border-primary/50 transition-all group">
                <CardContent className="p-6">
                  <div className="text-6xl text-center mb-4">{product.image}</div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{product.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-primary">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => window.open(`${WHATSAPP_BRISA}?text=Olá! Quero comprar: ${product.name} - R$ ${product.price.toFixed(2)}`, "_blank")}
                    >
                      <ShoppingCart size={16} className="mr-1" /> Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Feed */}
      <section className="pb-16 border-t border-border pt-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">
            🌍 Lugares Incríveis
          </h2>

          {/* New Post */}
          {user ? (
            <div className="mb-8 bg-card border border-border rounded-xl p-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Compartilhe sua experiência..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground border-none outline-none resize-none text-sm min-h-[80px]"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handleCreatePost} className="bg-primary text-primary-foreground">
                  <Send size={14} className="mr-1" /> Publicar
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <p className="text-muted-foreground text-sm mb-2">Faça login para compartilhar sua experiência</p>
              <Button variant="outline" asChild>
                <a href="/login">Fazer Login</a>
              </Button>
            </div>
          )}

          {/* Posts */}
          {posts.map((post) => (
            <Card key={post.id} id={`post-${post.id}`} className="bg-card border-border mb-6">
              <CardContent className="p-5">
                <p className="text-foreground text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {post.images.slice(0, 3).map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded-lg" loading="lazy" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <button
                    onClick={() => handleLikePost(post.id, post.likes_count || 0)}
                    className="flex items-center gap-1 hover:text-primary transition"
                  >
                    <Heart size={16} /> {post.likes_count || 0}
                  </button>
                  <button
                    onClick={() => {
                      setCommentModal(post.id);
                      loadComments(post.id);
                    }}
                    className="flex items-center gap-1 hover:text-primary transition"
                  >
                    <MessageCircle size={16} />
                    <span className="bg-primary/20 text-primary text-xs rounded-full px-2 py-0.5 font-bold">
                      {post.comment_count || 0}
                    </span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-primary transition">
                    <Share2 size={16} /> {post.share_count || 0}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {posts.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Nenhum post ainda. Seja o primeiro a compartilhar! 🌿
            </p>
          )}
        </div>
      </section>

      {/* Comment Modal */}
      <AnimatePresence>
        {commentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setCommentModal(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">Comentários</h3>
                <button onClick={() => setCommentModal(null)}>
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(comments[commentModal] || []).map((c) => (
                  <div key={c.id} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-foreground">{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
                {(comments[commentModal] || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda</p>
                )}
              </div>

              {user && (
                <div className="p-4 border-t border-border flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment(commentModal)}
                  />
                  <Button size="sm" onClick={() => handleAddComment(commentModal)} className="bg-primary text-primary-foreground">
                    <Send size={14} />
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Club;
