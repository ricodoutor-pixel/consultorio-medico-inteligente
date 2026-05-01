import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ShoppingBag, Gift, ArrowRight, Star, Percent } from "lucide-react";

interface UpsellProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  tag?: string;
}

interface UpsellPostOrientação TécnicaProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  condition?: string;
  onAddToCart?: (product: UpsellProduct) => void;
}

const UPSELL_PRODUCTS: UpsellProduct[] = [
  {
    id: "oil-full-spectrum",
    name: "Óleo CBD Full Spectrum 1000mg",
    description: "Recomendado para dor crônica e ansiedade. Importado com certificação.",
    price: 289,
    originalPrice: 350,
    tag: "Mais Vendido",
  },
  {
    id: "capsules-cbd",
    name: "Cápsulas CBD 25mg (30 un)",
    description: "Dose precisa e prática. Ideal para uso diário.",
    price: 199,
    originalPrice: 249,
    tag: "Recomendado",
  },
  {
    id: "club-assinatura",
    name: "Club Planta & Raiz — Mensal",
    description: "Orientação Técnicas ilimitadas + 20% desconto no shopping + conteúdo premium.",
    price: 99,
    tag: "Economia",
  },
];

export const UpsellPostOrientação Técnica = ({ isOpen, onClose, patientName, condition, onAddToCart }: UpsellPostOrientação TécnicaProps) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary/20 to-secondary/20 p-6 pb-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Oferta Especial Pós-Orientação Técnica</h2>
                <p className="text-sm text-muted-foreground">
                  {patientName ? `${patientName}, c` : "C"}omplete seu tratamento com desconto exclusivo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs">
              <div className="bg-destructive/20 text-destructive px-2 py-1 rounded-full flex items-center gap-1">
                <Percent className="w-3 h-3" /> Desconto válido por 30 min
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="p-4 space-y-3">
            {UPSELL_PRODUCTS.map(product => (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedProduct === product.id
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedProduct(product.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-sm">{product.name}</h3>
                        {product.tag && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                            {product.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">R$ {product.originalPrice}</span>
                      )}
                      <div className="text-lg font-bold text-primary">R$ {product.price}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="p-4 pt-0 space-y-2">
            <Button
              className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold"
              disabled={!selectedProduct}
              onClick={() => {
                const product = UPSELL_PRODUCTS.find(p => p.id === selectedProduct);
                if (product && onAddToCart) onAddToCart(product);
                onClose();
              }}
            >
              <ShoppingBag className="w-5 h-5" /> Adicionar ao Carrinho
              <ArrowRight className="w-4 h-4" />
            </Button>
            <button onClick={onClose} className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2">
              Não, obrigado. Continuar sem desconto.
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
