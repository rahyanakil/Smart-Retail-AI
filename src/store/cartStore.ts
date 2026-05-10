'use client';

import { create } from 'zustand';
import type { CartItem, Product } from '@/types';

const TAX_RATE = 0.08; // 8%

interface CartStore {
  items: CartItem[];
  discountPercent: number;

  // Mutators
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  incrementQty: (productId: string) => void;
  decrementQty: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  setDiscount: (pct: number) => void;
  clearCart: () => void;

  // Computed selectors
  itemCount: () => number;
  subtotal: () => number;
  discountAmount: () => number;
  taxAmount: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discountPercent: 0,

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        // Already in cart — increment if stock allows
        if (existing.quantity >= product.stock) return state;
        return {
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      if (product.stock === 0) return state;
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            quantity: 1,
            maxStock: product.stock,
            category: product.category,
          },
        ],
      };
    });
  },

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

  incrementQty: (productId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId && i.quantity < i.maxStock
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ),
    })),

  decrementQty: (productId) =>
    set((state) => ({
      items: state.items
        .map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })),

  setQuantity: (productId, qty) =>
    set((state) => ({
      items: state.items
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(Math.max(0, qty), i.maxStock) }
            : i
        )
        .filter((i) => i.quantity > 0),
    })),

  setDiscount: (pct) => set({ discountPercent: Math.min(100, Math.max(0, pct)) }),

  clearCart: () => set({ items: [], discountPercent: 0 }),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  discountAmount: () => {
    const sub = get().subtotal();
    return sub * (get().discountPercent / 100);
  },

  taxAmount: () => {
    const sub = get().subtotal();
    const disc = get().discountAmount();
    return (sub - disc) * TAX_RATE;
  },

  total: () => {
    const sub = get().subtotal();
    const disc = get().discountAmount();
    const tax = get().taxAmount();
    return sub - disc + tax;
  },
}));

export { TAX_RATE };
