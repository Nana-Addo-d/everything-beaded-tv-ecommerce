"use client";
import * as React from "react";
import {
  CART_STORAGE_KEY,
  MAX_QUANTITY,
  parseCart,
  readCart,
  setQuantity,
  type CartItem,
} from "./cart-state";
import {
  SAVED_KEY,
  RECENT_KEY,
  MAX_SAVED,
  MAX_RECENT,
  parseSelection,
  selectionIds,
  recordView,
  addQuantity,
} from "./selections";
type CartContextValue = {
  items: CartItem[];
  saved: string[];
  recent: string[];
  ready: boolean;
  storageAvailable: boolean;
  add: (slug: string, quantity?: number, limit?: number) => boolean;
  update: (slug: string, quantity: number) => void;
  toggleSaved: (slug: string) => void;
  saveForLater: (slug: string) => void;
  remember: (slug: string) => void;
  clearRecent: () => void;
};
const CartContext = React.createContext<CartContextValue | null>(null);
export function CartProvider({
  children,
  validSlugs,
}: {
  children: React.ReactNode;
  validSlugs: string[];
}) {
  const signature = validSlugs.join("|");
  const known = React.useMemo(() => signature.split("|"), [signature]);
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const itemRef = React.useRef(items),
    savedRef = React.useRef(saved),
    recentRef = React.useRef(recent);
  const [ready, setReady] = React.useState(false);
  const [storageAvailable, setStorageAvailable] = React.useState(true);
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (!hydrated.current)
      try {
        itemRef.current = parseCart(
          localStorage.getItem(CART_STORAGE_KEY),
          known,
        );
        savedRef.current = parseSelection(
          localStorage.getItem(SAVED_KEY),
          known,
          MAX_SAVED,
        );
        recentRef.current = parseSelection(
          localStorage.getItem(RECENT_KEY),
          known,
          MAX_RECENT,
        );
      } catch {
        setStorageAvailable(false);
      }
    hydrated.current = true;
    itemRef.current = readCart(itemRef.current, known);
    savedRef.current = selectionIds(savedRef.current, known, MAX_SAVED);
    recentRef.current = selectionIds(recentRef.current, known, MAX_RECENT);
    setItems(itemRef.current);
    setSaved(savedRef.current);
    setRecent(recentRef.current);
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        itemRef.current = parseCart(event.newValue, known);
        setItems(itemRef.current);
      }
      if (event.key === SAVED_KEY || event.key === null) {
        savedRef.current = parseSelection(event.newValue, known, MAX_SAVED);
        setSaved(savedRef.current);
      }
      if (event.key === RECENT_KEY || event.key === null) {
        recentRef.current = parseSelection(event.newValue, known, MAX_RECENT);
        setRecent(recentRef.current);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [known]);
  const persist = React.useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      setStorageAvailable(false);
    }
  }, []);
  const update = React.useCallback(
    (slug: string, quantity: number) => {
      const next = setQuantity(itemRef.current, slug, quantity, known);
      itemRef.current = next;
      setItems(next);
      persist(CART_STORAGE_KEY, next);
    },
    [known, persist],
  );
  const add = React.useCallback(
    (slug: string, quantity = 1, limit = MAX_QUANTITY) => {
      if (!ready || !known.includes(slug)) return false;
      const next = addQuantity(
        itemRef.current.find((i) => i.slug === slug)?.quantity ?? 0,
        quantity,
        Math.min(MAX_QUANTITY, limit),
      );
      if (next === null) return false;
      update(slug, next);
      return true;
    },
    [ready, known, update],
  );
  const toggleSaved = React.useCallback(
    (slug: string) => {
      if (!ready || !known.includes(slug)) return;
      const next = savedRef.current.includes(slug)
        ? savedRef.current.filter((id) => id !== slug)
        : [slug, ...savedRef.current].slice(0, MAX_SAVED);
      savedRef.current = next;
      setSaved(next);
      persist(SAVED_KEY, next);
    },
    [ready, known, persist],
  );
  const saveForLater = React.useCallback(
    (slug: string) => {
      if (!ready || !known.includes(slug)) return;
      if (!savedRef.current.includes(slug)) toggleSaved(slug);
      update(slug, 0);
    },
    [ready, known, toggleSaved, update],
  );
  const remember = React.useCallback(
    (slug: string) => {
      if (!ready || recentRef.current[0] === slug) return;
      const next = recordView(recentRef.current, slug, known);
      recentRef.current = next;
      setRecent(next);
      persist(RECENT_KEY, next);
    },
    [ready, known, persist],
  );
  const clearRecent = React.useCallback(() => {
    recentRef.current = [];
    setRecent([]);
    persist(RECENT_KEY, []);
  }, [persist]);
  return (
    <CartContext.Provider
      value={{
        items,
        saved,
        recent,
        ready,
        storageAvailable,
        add,
        update,
        toggleSaved,
        saveForLater,
        remember,
        clearRecent,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const cart = React.useContext(CartContext);
  if (!cart) throw new Error("Cart controls must be inside CartProvider");
  return cart;
}
