import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@/data/products";

export type CartItem = {
  product: Product;
  qty: number;
};

export type SelectedShipping = {
  cep: string;
  carrier: string;
  service: string;
  price: number;
  days: number;
};

type CartStore = {
  items: CartItem[];
  shipping: SelectedShipping | null;
  setShipping: (shipping: SelectedShipping | null) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
  getSubtotal: () => number;
  getTax: (taxRate?: number) => number;
  getShipping: () => number;
  getFinalTotal: (taxRate?: number, shippingCost?: number) => number;
  hasItems: () => boolean;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      shipping: null,
      setShipping: (shipping) => set({ shipping }),
      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({ items: items.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i) });
        } else {
          set({ items: [...items, { product, qty: 1 }] });
        }
      },
      removeItem: (productId) => set({ items: get().items.filter((i) => i.product.id !== productId) }),
      updateQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
        } else {
          set({ items: get().items.map((i) => i.product.id === productId ? { ...i, qty } : i) });
        }
      },
      clearCart: () => set({ items: [], shipping: null }),
      total: () => get().items.reduce((sum, i) => sum + i.product.priceValue * i.qty, 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.product.priceValue * i.qty, 0),
      getTax: (taxRate = 0.1) => get().getSubtotal() * taxRate,
      // Frete real selecionado no carrinho (cotação por CEP). Sem CEP = 0.
      getShipping: () => (get().count() > 0 ? get().shipping?.price ?? 0 : 0),
      getFinalTotal: (taxRate = 0.1, shippingCost) => {
        const subtotal = get().getSubtotal();
        const tax = subtotal * taxRate;
        const shipping = shippingCost ?? get().getShipping();
        return subtotal + tax + (get().count() > 0 ? shipping : 0);
      },
      hasItems: () => get().items.length > 0,
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
