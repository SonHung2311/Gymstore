import { create } from "zustand";
import type { Cart } from "../types";

interface CartState {
  cart: Cart;
  setCart: (cart: Cart) => void;
  clearCart: () => void;
}

const EMPTY_CART: Cart = { items: [], total: 0, item_count: 0 };

export const useCartStore = create<CartState>()((set) => ({
  cart: EMPTY_CART,

  setCart: (cart) => set({ cart }),

  clearCart: () => set({ cart: EMPTY_CART }),
}));
