import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ShippingCalculator } from '@/components/ShippingCalculator';
import { Trash2, Plus, Minus, ShoppingCart as CartIcon, FileText } from 'lucide-react';

export function ShoppingCart() {
  const { items, removeItem, updateQty, clearCart, getSubtotal, getTax, shipping: selectedShipping, setShipping } = useCart();
  const [showCart, setShowCart] = useState(false);
  const location = useLocation();

  const allowedPaths = ['/shopping', '/planos', '/precos'];
  const isVisible = allowedPaths.some(p => location.pathname.startsWith(p));

  if (!isVisible) return null;
  if (!showCart) {
    return (
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 left-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:opacity-90 transition-all z-40"
        title="Abrir carrinho"
      >
        <CartIcon size={24} />
        {items.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {items.length}
          </span>
        )}
      </button>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const shipping = selectedShipping?.price ?? 0;
  const total = subtotal + tax + shipping;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-end">
      <Card className="w-full md:w-96 h-dvh md:h-auto md:rounded-lg rounded-t-2xl bg-card shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-card-foreground">Carrinho de Compras</h2>
          <button onClick={() => setShowCart(false)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <CartIcon size={48} className="mb-4 opacity-50" />
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-4 p-4 bg-muted rounded-lg hover:bg-accent transition-colors">
                {item.product.imageUrl && (
                  <img src={item.product.imageUrl} alt={item.product.title} className="w-20 h-20 object-cover rounded" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground">{item.product.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.product.category}</p>
                  <p className="text-primary font-bold mt-1">R$ {item.product.priceValue.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="p-1 hover:bg-accent rounded"><Minus size={16} /></button>
                  <Input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 1)} className="w-12 text-center" />
                  <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="p-1 hover:bg-accent rounded"><Plus size={16} /></button>
                </div>
                <button onClick={() => removeItem(item.product.id)} className="text-destructive hover:opacity-80 p-2" title="Remover"><Trash2 size={18} /></button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <>
            <div className="border-t border-border p-6 space-y-3">
              <ShippingCalculator
                cartTotal={subtotal}
                onSelectShipping={(opt) => {
                  setShipping({ carrier: opt.company, service: opt.name, price: opt.price, days: opt.delivery_time });
                }}
              />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal:</span><span className="font-semibold">R$ {subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Imposto (10%):</span><span className="font-semibold">R$ {tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete:</span><span className="font-semibold">{selectedShipping ? `R$ ${shipping.toFixed(2)}` : "calcule pelo CEP"}</span></div>
              {selectedShipping && (
                <p className="text-[11px] text-muted-foreground">
                  {selectedShipping.carrier} {selectedShipping.service} · até {selectedShipping.days} dias úteis · frete repassado 100% à farmácia
                </p>
              )}
              <div className="border-t border-border pt-3 flex justify-between"><span className="font-bold">Total:</span><span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span></div>
            </div>
            <div className="px-6 space-y-2">
               <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="text-sm font-bold text-primary flex items-center gap-1">
                      <FileText size={16} /> Receita Digital (PDF)
                   </span>
                   <span className="text-xs text-muted-foreground">Obrigatório para canabinoides</span>
                 </div>
                 <Button variant="outline" size="sm" className="text-xs" onClick={() => alert('Abrindo modal de receitas salvas do paciente...')}>Anexar</Button>
               </div>
            </div>
            <div className="p-6 border-t border-border space-y-3">
              <Button className="w-full py-6" onClick={() => { window.location.href = '/cart-checkout'; }}>Ir para Checkout</Button>
              <Button variant="outline" className="w-full" onClick={() => clearCart()}>Limpar Carrinho</Button>
              <Button variant="ghost" className="w-full" onClick={() => setShowCart(false)}>Continuar Comprando</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
