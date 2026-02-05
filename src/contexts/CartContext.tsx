/**
 * Cart Context
 * - Manages cart state
 * - Persisted to sessionStorage
 * - Profile-scoped
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { analytics } from "@/lib/analytics";
import type { CartItem, Test } from "@/types/api";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  profileId: string | null;
  
  addItem: (test: Test, fromExtraction?: boolean) => void;
  removeItem: (testId: string) => void;
  clearCart: () => void;
  hasItem: (testId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "medool_cart";

interface StoredCart {
  profileId: string;
  items: CartItem[];
  updatedAt: number;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { activeProfile } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const profileId = activeProfile?.id || null;

  // Load cart from sessionStorage on mount and profile change
  useEffect(() => {
    if (!profileId) {
      setItems([]);
      return;
    }

    try {
      const stored = sessionStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const cart: StoredCart = JSON.parse(stored);
        // Only restore if same profile and not too old (1 hour)
        const isValid =
          cart.profileId === profileId &&
          Date.now() - cart.updatedAt < 60 * 60 * 1000;
        
        if (isValid) {
          setItems(cart.items);
        } else {
          setItems([]);
        }
      }
    } catch {
      setItems([]);
    }
  }, [profileId]);

  // Save cart to sessionStorage on change
  useEffect(() => {
    if (!profileId) return;

    const cart: StoredCart = {
      profileId,
      items,
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [items, profileId]);

  const addItem = useCallback(
    (test: Test, fromExtraction: boolean = false) => {
      setItems((prev) => {
        const exists = prev.some((item) => item.test_id === test.id);
        if (exists) return prev;

        const newItems = [...prev, { test_id: test.id, test, quantity: 1 }];
        analytics.cartUpdated(newItems.length, fromExtraction);
        return newItems;
      });
    },
    []
  );

  const removeItem = useCallback((testId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.test_id !== testId);
      analytics.cartUpdated(newItems.length);
      return newItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    sessionStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const hasItem = useCallback(
    (testId: string) => items.some((item) => item.test_id === testId),
    [items]
  );

  const value: CartContextValue = {
    items,
    itemCount: items.length,
    profileId,
    addItem,
    removeItem,
    clearCart,
    hasItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
