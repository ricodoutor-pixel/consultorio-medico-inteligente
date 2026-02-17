import { create } from "zustand";
import { Product } from "@/data/products";

export type CartItem = {
  product: Product;
  qty: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartStore>((set, get) => ({
  items: [],
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
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.product.priceValue * i.qty, 0),
  count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
}));
