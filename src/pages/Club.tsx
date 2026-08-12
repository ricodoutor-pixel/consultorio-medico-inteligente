import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, ShoppingCart, Bell, Check, Send, X, Star, Filter, ChevronLeft, ChevronRight, Minus, Plus, Trash2, Package, MapPin, Camera, Image as ImageIcon, Loader2, Bitcoin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WhatsAppProofModal, useWhatsAppProofModal, type WhatsAppContext } from "@/components/WhatsAppProofModal";
import { BTCPaymentModal } from "@/components/BTCPaymentModal";
import { ProductAlertBell } from "@/components/ProductAlertBell";

// Product images
import prod1a from "@/assets/club/prod1-a.jpg";
import prod1b from "@/assets/club/prod1-b.jpg";
import prod1c from "@/assets/club/prod1-c.jpg";
import prod2a from "@/assets/club/prod2-a.jpg";
import prod2b from "@/assets/club/prod2-b.jpg";
import prod2c from "@/assets/club/prod2-c.jpg";
import prod3a from "@/assets/club/prod3-a.jpg";
import prod3b from "@/assets/club/prod3-b.jpg";
import prod3c from "@/assets/club/prod3-c.jpg";
import prod4a from "@/assets/club/prod4-a.jpg";
import prod4b from "@/assets/club/prod4-b.jpg";
import prod4c from "@/assets/club/prod4-c.jpg";
import prod5a from "@/assets/club/prod5-a.jpg";
import prod5b from "@/assets/club/prod5-b.jpg";
import prod5c from "@/assets/club/prod5-c.jpg";
import prod6a from "@/assets/club/prod6-a.jpg";
import prod6b from "@/assets/club/prod6-b.jpg";
import prod6c from "@/assets/club/prod6-c.jpg";
import prod7a from "@/assets/club/prod7-a.jpg";
import prod7b from "@/assets/club/prod7-b.jpg";
import prod7c from "@/assets/club/prod7-c.jpg";
import prod8a from "@/assets/club/prod8-a.jpg";
import prod8b from "@/assets/club/prod8-b.jpg";
import prod8c from "@/assets/club/prod8-c.jpg";
import prod9a from "@/assets/club/prod9-a.jpg";
import prod9b from "@/assets/club/prod9-b.jpg";
import prod9c from "@/assets/club/prod9-c.jpg";
import prod10a from "@/assets/club/prod10-a.jpg";
import prod10b from "@/assets/club/prod10-b.jpg";
import prod10c from "@/assets/club/prod10-c.jpg";

// Feed images - pessoas reais em lugares incríveis
import feedPersonCachoeira1 from "@/assets/club/feed-person-cachoeira1.jpg";
import feedPersonCachoeira2 from "@/assets/club/feed-person-cachoeira2.jpg";
import feedPersonCachoeira3 from "@/assets/club/feed-person-cachoeira3.jpg";
import feedPersonTrilha1 from "@/assets/club/feed-person-trilha1.jpg";
import feedPersonTrilha2 from "@/assets/club/feed-person-trilha2.jpg";
import feedPersonTrilha3 from "@/assets/club/feed-person-trilha3.jpg";
import feedPersonPraia1 from "@/assets/club/feed-person-praia1.jpg";
import feedPersonPraia2 from "@/assets/club/feed-person-praia2.jpg";
import feedPersonPraia3 from "@/assets/club/feed-person-praia3.jpg";

const WHATSAPP_BRISA = "https://wa.me/5511991363154";

type Category = "all" | "camisetas" | "bones" | "chapeus" | "canecas";

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  desc: string;
  category: Category;
  rating: number;
  reviews: number;
  isLimited: boolean;
}

interface CartItem {
  product: Product;
  qty: number;
}

const clubProducts: Product[] = [
  { id: 1, name: 'Camiseta "Verdinho Explorer"', price: 89.90, images: [prod1a, prod1b, prod1c], desc: "100% algodão orgânico com estampa exclusiva do Verdinho", category: "camisetas", rating: 4.8, reviews: 234, isLimited: false },
  { id: 2, name: 'Camiseta "Logo Roots Gradient"', price: 94.90, images: [prod2a, prod2b, prod2c], desc: "Camiseta branca com logo gradiente vibrante", category: "camisetas", rating: 4.9, reviews: 312, isLimited: false },
  { id: 3, name: 'Camiseta "Cachoeira Relax"', price: 99.90, images: [prod3a, prod3b, prod3c], desc: "Azul petróleo estonado com arte psicodélica", category: "camisetas", rating: 5.0, reviews: 189, isLimited: true },
  { id: 4, name: 'Camiseta "Noite nas Estrelas"', price: 104.90, images: [prod4a, prod4b, prod4c], desc: "Preta slim fit com estampa céu estrelado", category: "camisetas", rating: 4.9, reviews: 267, isLimited: true },
  { id: 5, name: 'Boné "Trucker Roots"', price: 79.90, images: [prod5a, prod5b, prod5c], desc: "Trucker marrom/creme com patch bordado", category: "bones", rating: 4.7, reviews: 145, isLimited: false },
  { id: 6, name: 'Boné "Dad Hat Verdinho"', price: 74.90, images: [prod6a, prod6b, prod6c], desc: "Dad Hat rosa com bordado minimalista", category: "bones", rating: 4.8, reviews: 198, isLimited: false },
  { id: 7, name: 'Chapéu Bucket "Tropical Vibe"', price: 84.90, images: [prod7a, prod7b, prod7c], desc: "Bucket reversível estampa tropical", category: "chapeus", rating: 4.9, reviews: 276, isLimited: false },
  { id: 8, name: 'Viseira "Sol e Sal"', price: 69.90, images: [prod8a, prod8b, prod8c], desc: "Viseira palha natural com faixa branca", category: "chapeus", rating: 4.6, reviews: 134, isLimited: false },
  { id: 9, name: 'Caneca "Aventura Matinal"', price: 49.90, images: [prod9a, prod9b, prod9c], desc: "Cerâmica 350ml estilo camping rústico", category: "canecas", rating: 4.7, reviews: 412, isLimited: false },
  { id: 10, name: 'Caneca Térmica "Gole de Natureza"', price: 129.90, images: [prod10a, prod10b, prod10c], desc: "Aço inox laranja neon com gravação a laser", category: "canecas", rating: 5.0, reviews: 356, isLimited: true },
];

const staticPosts = [
  {
    id: "static-1",
    content: "Que manhã perfeita na Cachoeira do Poço Verde! A água estava tão cristalina que dava pra ver os peixes nadando... 💚 Experiência transformadora, já quero voltar! plantayraiz.com.br",
    images: [feedPersonCachoeira1, feedPersonCachoeira2, feedPersonCachoeira3],
    likes_count: 342, comment_count: 28, share_count: 15,
    user_id: "static", author: "Marina Silva", avatar: "👩‍🦱", location: "Cachoeira do Poço Verde, RJ",
    status: "active", created_at: new Date().toISOString(),
  },
  {
    id: "static-2",
    content: "Trilha da Serra da Mantiqueira no amanhecer... Nada se compara! 🏔️✨ O nascer do sol lá de cima é de tirar o fôlego. Obrigado Planta y Raiz pela nova qualidade de vida!",
    images: [feedPersonTrilha1, feedPersonTrilha2, feedPersonTrilha3],
    likes_count: 567, comment_count: 45, share_count: 32,
    user_id: "static", author: "Lucas Oliveira", avatar: "👨‍🦱", location: "Serra da Mantiqueira, SP",
    status: "active", created_at: new Date().toISOString(),
  },
  {
    id: "static-3",
    content: "Dia de praia em Jericoacoara com a galera! 🌅 O pôr do sol aqui é de outro mundo. Desde que comecei o tratamento, minha qualidade de vida mudou completamente!",
    images: [feedPersonPraia1, feedPersonPraia2, feedPersonPraia3],
    likes_count: 678, comment_count: 67, share_count: 41,
    user_id: "static", author: "Felipe Santos", avatar: "👨‍🦲", location: "Jericoacoara, CE",
    status: "active", created_at: new Date().toISOString(),
  },
];

const categories: { key: Category; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "camisetas", label: "Camisetas" },
  { key: "bones", label: "Bonés" },
  { key: "chapeus", label: "Chapéus" },
  { key: "canecas", label: "Canecas" },
];

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} className={s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">({reviews})</span>
    </div>
  );
}

function ProductImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative group overflow-hidden rounded-t-lg">
      <img src={images[idx]} alt={name} className="w-full h-56 object-cover transition-transform group-hover:scale-105" loading="lazy" decoding="async" />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setIdx((p) => (p - 1 + images.length) % images.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
            <ChevronLeft size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIdx((p) => (p + 1) % images.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const Club = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>(staticPosts);
  const [newPost, setNewPost] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [commentModal, setCommentModal] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, any[]>>({});

  // Marketplace state
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"shop" | "feed">("shop");
  const [btcModal, setBtcModal] = useState<{ open: boolean; planName: string; planId: string; amount: string }>({ open: false, planName: "", planId: "", amount: "" });

  useEffect(() => {
    document.title = "Club Planta y Raiz - Lifestyle & Comunidade";
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadPosts();
  }, []);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadPosts = async () => {
    const { data } = await supabase.from("club_posts").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(20);
    if (data && data.length > 0) setPosts(data);
    else setPosts(staticPosts);
  };

  const loadNotifications = async () => {
    const { data } = await supabase.from("club_notifications").select("*").eq("user_id", user?.id).eq("is_read", false).order("created_at", { ascending: false });
    if (data) setNotifications(data);
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase.from("club_post_comments").select("*").eq("post_id", postId).eq("status", "active").order("created_at", { ascending: true });
    if (data) setComments((prev) => ({ ...prev, [postId]: data }));
  };

  const handleCreatePost = async () => {
    if (!user) { toast({ title: "Login necessário", variant: "destructive" }); return; }
    if (!newPost.trim()) return;
    const imagesToPost = postImages.slice(0, 3);
    const { data: inserted } = await supabase
      .from("club_posts")
      .insert({ user_id: user.id, content: newPost, images: imagesToPost.length > 0 ? imagesToPost : [] })
      .select("id")
      .single();

    // Auto-publica no Instagram (IG cross-posta no Facebook nativamente).
    // Só publica se tiver pelo menos 1 imagem — IG não aceita post só de texto.
    if (inserted?.id && imagesToPost.length > 0) {
      const authorName =
        (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
        (user.user_metadata as { full_name?: string; name?: string } | undefined)?.name ||
        user.email?.split("@")[0] ||
        "Membro Club";
      supabase.functions
        .invoke("publish-to-instagram", {
          body: {
            post_id: inserted.id,
            content: newPost,
            images: imagesToPost,
            author_name: authorName,
          },
        })
        .then(({ error }) => {
          if (error) console.warn("[Club→IG] publish error:", error);
        });
    }

    setNewPost(""); setPostImages([]); loadPosts();
    toast({
      title: "Post criado! 🌿",
      description: imagesToPost.length > 0
        ? "Compartilhando também no Instagram (e Facebook via cross-post)"
        : "Adicione uma foto para publicar também no Instagram",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    const remaining = 3 - postImages.length;
    const filesToUpload = Array.from(files).slice(0, remaining);
    
    for (const file of filesToUpload) {
      const ext = file.name.split(".").pop();
      const path = `club-posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("experience-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("experience-images").getPublicUrl(path);
        setPostImages((prev) => [...prev, urlData.publicUrl]);
      }
    }
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
    const post = posts.find((p) => p.id === postId);
    if (post && post.user_id !== user.id) {
      await supabase.from("club_notifications").insert({ user_id: post.user_id, post_id: postId, triggered_by_user_id: user.id, type: "comment", title: "Novo comentário", message: "Alguém comentou no seu post", action_url: `/club#post-${postId}` });
    }
    await supabase.from("club_posts").update({ comment_count: (post?.comment_count || 0) + 1 }).eq("id", postId);
    setCommentText(""); loadComments(postId); loadPosts();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("club_notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    loadNotifications();
  };

  // Cart functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    toast({ title: `${product.name} adicionado! 🛒` });
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const filteredProducts = clubProducts.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
    if (p.rating < minRating) return false;
    return true;
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();

  const executeCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login para comprar", description: "Redirecionando...", variant: "destructive" });
        setTimeout(() => window.location.href = "/login", 1500);
        setCheckoutLoading(false);
        return;
      }

      const cartItems = cart.map(i => ({
        product_id: `club_${i.product.id}`,
        quantity: i.qty,
      }));

      const { data, error } = await supabase.functions.invoke("create-cart-payment", {
        body: { items: cartItems, description: `Club Planta y Raiz - ${cart.length} itens` },
      });

      if (error) throw error;
      if (data?.init_point) {
        window.open(data.init_point, "_blank");
        toast({ title: "Redirecionando para o Mercado Pago... 💳" });
      } else {
        toast({ title: "Erro ao gerar link", variant: "destructive" });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast({ title: "Erro ao processar pagamento", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBuyNow = (product: Product) => {
    showModal(
      { type: "compra", productName: product.name, value: product.price },
      async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast({ title: "Faça login para comprar", variant: "destructive" });
            setTimeout(() => window.location.href = "/login", 1500);
            return;
          }
          const { data, error } = await supabase.functions.invoke("create-cart-payment", {
            body: {
              items: [{ product_id: `club_${product.id}`, quantity: 1 }],
              description: `Planta y Raiz Ltda - ${product.name}`,
            },
          });
          if (error) throw error;
          if (data?.init_point) {
            window.open(data.init_point, "_blank");
            toast({ title: "Redirecionando para pagamento... 💳" });
          }
        } catch (err) {
          console.error(err);
          toast({ title: "Erro ao gerar pagamento", variant: "destructive" });
        }
      }
    );
  };

  const handleCheckout = () => {
    const productNames = cart.map(i => i.product.name).join(", ");
    showModal(
      { type: "compra", productName: productNames, value: cartTotal },
      () => executeCheckout()
    );
  };

  return (
    <div className="min-h-dvh bg-background w-full overflow-x-hidden">
      <Navbar />

      {/* Notification Bell */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative bg-card border border-border rounded-full p-3 shadow-lg hover:bg-muted transition">
            <Bell size={20} className="text-foreground" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{notifications.length}</span>
            )}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Notificações</h3>
                  {notifications.length > 0 && <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas</button>}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação</p>
                  ) : notifications.map((n) => (
                    <div key={n.id} className="p-3 border-b border-border hover:bg-muted/50 flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </div>
                      <button onClick={() => { supabase.from("club_notifications").update({ is_read: true }).eq("id", n.id).then(loadNotifications); }}>
                        <Check size={14} className="text-primary" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Hero */}
      <section className="pt-24 pb-6 md:pt-36 md:pb-12">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-4xl md:text-6xl font-display font-black mb-3 md:mb-4">
            <span className="text-gradient-green">Club</span> <span className="text-foreground">Planta y Raiz</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto mb-2">Lifestyle, comunidade e produtos exclusivos. Pagamento via PIX ou BTC.</p>
          <div className="flex justify-center mb-3">
            <ProductAlertBell category="club" />
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center gap-2">
            <Button variant={activeTab === "shop" ? "default" : "outline"} onClick={() => setActiveTab("shop")} className="gap-2">
              <ShoppingCart size={16} /> Loja
            </Button>
            <Button variant={activeTab === "feed" ? "default" : "outline"} onClick={() => setActiveTab("feed")} className="gap-2">
              <MessageCircle size={16} /> Post
            </Button>
          </div>
        </div>
      </section>

      {activeTab === "shop" ? (
        /* ==================== SHOP TAB ==================== */
        <section className="pb-32">
          <div className="container mx-auto px-4">
            <div className="flex gap-6">
              {/* Sidebar Filters (Desktop) */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-28 bg-card border border-border rounded-xl p-5 space-y-6">
                  <h3 className="font-bold text-foreground text-lg flex items-center gap-2"><Filter size={18} /> Filtros</h3>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Categoria</p>
                    <div className="space-y-2">
                      {categories.map((c) => (
                        <button key={c.key} onClick={() => setSelectedCategory(c.key)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedCategory === c.key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Preço</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">R$ {priceRange[0]}</span>
                      <input type="range" min={0} max={200} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                        className="flex-1 accent-primary" />
                      <span className="text-muted-foreground">R$ {priceRange[1]}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Avaliação Mínima</p>
                    <div className="flex gap-1">
                      {[0, 3, 4, 5].map((r) => (
                        <button key={r} onClick={() => setMinRating(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition ${minRating === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
                          {r === 0 ? "Todos" : `${r}★+`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Mobile Filter Button */}
              <div className="lg:hidden fixed top-20 left-3 z-40">
                <Button size="sm" onClick={() => setShowFilters(true)} className="rounded-full shadow-lg gap-1 text-xs h-8 px-3 opacity-90">
                  <Filter size={12} /> Filtros
                </Button>
              </div>

              {/* Products Grid */}
              <div className="flex-1">
                {/* Mobile category pills */}
                <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                  {categories.map((c) => (
                    <button key={c.key} onClick={() => setSelectedCategory(c.key)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition ${selectedCategory === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="bg-card border-border hover:border-primary/50 transition-all group overflow-hidden">
                      <ProductImageCarousel images={product.images} name={product.name} />
                      <CardContent className="p-2 sm:p-4">
                        {product.isLimited && (
                          <span className="inline-block text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 rounded-full mb-1 sm:mb-2">Edição Limitada</span>
                        )}
                        <h3 className="font-bold text-foreground text-xs sm:text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2 line-clamp-2 hidden sm:block">{product.desc}</p>
                        <StarRating rating={product.rating} reviews={product.reviews} />
                        <div className="mt-2 sm:mt-3">
                          <span className="text-sm sm:text-lg font-black text-primary">R$ {product.price.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-2">
                          <Button size="sm" className="w-full gap-1 text-[10px] sm:text-xs h-7 sm:h-8" onClick={() => addToCart(product)}>
                            <ShoppingCart size={12} /> Carrinho
                          </Button>
                          <Button size="sm" variant="outline" className="w-full gap-1 text-[10px] sm:text-xs h-7 sm:h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => handleBuyNow(product)}>
                            Comprar
                          </Button>
                        </div>
                        <Button size="sm" variant="outline" className="w-full gap-1 text-[10px] sm:text-xs h-6 sm:h-7 mt-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                          onClick={() => setBtcModal({ open: true, planName: product.name, planId: String(product.id), amount: `R$ ${product.price.toFixed(2)}` })}>
                          <Bitcoin size={10} /> Pague Com BTC
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Package size={48} className="mx-auto mb-4 opacity-40" />
                    <p>Nenhum produto encontrado com esses filtros.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ==================== FEED TAB ==================== */
        <section className="pb-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8 text-center">🌍 Lugares Incríveis</h2>

            {user ? (
              <div className="mb-8 bg-card border border-border rounded-xl p-4">
                <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Compartilhe sua experiência em cachoeiras, praias, trilhas, montanhas..."
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground border-none outline-none resize-none text-sm min-h-[80px]" />
                
                {/* Image previews */}
                {postImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {postImages.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" loading="lazy" decoding="async" />
                        <button onClick={() => setPostImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  {postImages.length < 3 && (
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer transition">
                      <Camera size={16} />
                      <span>Fotos ({postImages.length}/3)</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                  {postImages.length >= 3 && <span className="text-xs text-primary font-medium">✓ 3 fotos adicionadas</span>}
                  <Button size="sm" onClick={handleCreatePost}><Send size={14} className="mr-1" /> Publicar</Button>
                </div>
              </div>
            ) : (
              <div className="mb-8 text-center">
                <p className="text-muted-foreground text-sm mb-2">Faça login para compartilhar sua experiência</p>
                <Button variant="outline" asChild><a href="/login">Fazer Login</a></Button>
              </div>
            )}

            {posts.map((post) => (
              <Card key={post.id} id={`post-${post.id}`} className="bg-card border-border mb-6">
                <CardContent className="p-5">
                  {/* Author row */}
                  {post.author && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{post.avatar}</span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{post.author}</p>
                        {post.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} />{post.location}</p>}
                      </div>
                    </div>
                  )}

                  <p className="text-foreground text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

                  {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {post.images.slice(0, 3).map((img: string, i: number) => (
                        <img key={i} src={img} alt="" className={`w-full object-cover rounded-lg ${post.images.length === 1 ? "h-64" : "h-40"}`} loading="lazy" decoding="async" />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-muted-foreground text-sm">
                    <button onClick={() => handleLikePost(post.id, post.likes_count || 0)} className="flex items-center gap-1 hover:text-primary transition">
                      <Heart size={16} /> {post.likes_count || 0}
                    </button>
                    <button onClick={() => { setCommentModal(post.id); loadComments(post.id); }} className="flex items-center gap-1 hover:text-primary transition">
                      <MessageCircle size={16} />
                      <span className="bg-primary/20 text-primary text-xs rounded-full px-2 py-0.5 font-bold">{post.comment_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition">
                      <Share2 size={16} /> {post.share_count || 0}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && !showCart && (
        <motion.button initial={{ y: 100 }} animate={{ y: 0 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-20 right-6 z-40 bg-primary text-primary-foreground rounded-full p-4 shadow-2xl hover:scale-105 transition-transform">
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{cartCount}</span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center md:justify-end" onClick={() => setShowCart(false)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              className="w-full md:w-96 h-full md:h-auto bg-card border-l border-border shadow-2xl flex flex-col max-h-dvh md:max-h-[90vh] md:rounded-l-2xl"
              onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">🛒 Carrinho ({cartCount})</h2>
                <button onClick={() => setShowCart(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ShoppingCart size={48} className="mb-4 opacity-30" />
                    <p>Seu carrinho está vazio</p>
                  </div>
                ) : cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" loading="lazy" decoding="async" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{item.product.name}</h4>
                      <p className="text-primary font-bold text-sm">R$ {item.product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => updateCartQty(item.product.id, -1)} className="p-0.5 hover:bg-accent rounded"><Minus size={14} /></button>
                        <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.product.id, 1)} className="p-0.5 hover:bg-accent rounded"><Plus size={14} /></button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-destructive hover:opacity-70 self-start"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-border p-5 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete:</span><span className="text-primary font-semibold">Grátis 🎉</span></div>
                  <div className="flex justify-between"><span className="font-bold text-foreground">Total:</span><span className="text-xl font-black text-primary">R$ {cartTotal.toFixed(2)}</span></div>
                  <Button className="w-full py-5" onClick={handleCheckout} disabled={checkoutLoading}>
                    {checkoutLoading ? <><Loader2 size={16} className="mr-2 animate-spin" /> Gerando...</> : "Comprar Agora 💳"}
                  </Button>
                  <Button variant="outline" className="w-full border-amber-500/40 text-amber-500 hover:bg-amber-500/10 font-bold gap-1"
                    onClick={() => setBtcModal({ open: true, planName: cart.map(i => i.product.name).join(", "), planId: "club-cart", amount: `R$ ${cartTotal.toFixed(2)}` })}>
                    <Bitcoin size={14} /> Pague Com BTC
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setCart([])}>Limpar Carrinho</Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowFilters(false)}>
            <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
              className="bg-card border-t border-border rounded-t-2xl w-full p-6 space-y-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg">Filtros</h3>
                <button onClick={() => setShowFilters(false)}><X size={20} className="text-muted-foreground" /></button>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button key={c.key} onClick={() => setSelectedCategory(c.key)}
                      className={`px-4 py-2 rounded-full text-sm ${selectedCategory === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Preço até R$ {priceRange[1]}</p>
                <input type="range" min={0} max={200} value={priceRange[1]} onChange={(e) => setPriceRange([0, +e.target.value])} className="w-full accent-primary" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Avaliação</p>
                <div className="flex gap-2">
                  {[0, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setMinRating(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs ${minRating === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {r === 0 ? "Todos" : `${r}★+`}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={() => setShowFilters(false)}>Aplicar Filtros</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {commentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" onClick={() => setCommentModal(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">Comentários</h3>
                <button onClick={() => setCommentModal(null)}><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(comments[commentModal] || []).map((c) => (
                  <div key={c.id} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-foreground">{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                ))}
                {(comments[commentModal] || []).length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Seja o primeiro a comentar!</p>}
              </div>
              {user && (
                <div className="p-4 border-t border-border flex gap-2">
                  <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva um comentário..." className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none" />
                  <Button size="sm" onClick={() => handleAddComment(commentModal)}><Send size={14} /></Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BTCPaymentModal
        open={btcModal.open}
        onClose={() => setBtcModal({ ...btcModal, open: false })}
        planName={btcModal.planName}
        planId={btcModal.planId}
        amount={btcModal.amount}
      />
      <WhatsAppProofModal
        open={modalState.open}
        onOpenChange={setModalOpen}
        context={modalState.context}
        onProceed={modalState.onProceed}
      />

      <Footer />
    </div>
  );
};

export default Club;
