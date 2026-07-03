"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  image?: string | null;
  quantity: number;
  phoneModel: string;
};

type State = { items: CartItem[] };

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem }
  | { type: "remove"; slug: string; phoneModel: string }
  | { type: "qty"; slug: string; phoneModel: string; quantity: number }
  | { type: "clear" };

const STORAGE_KEY = "globecase.cart.v1";
const MAX_QTY = 20;

/** Two lines merge only when both the product AND the device match. */
function sameLine(a: CartItem, slug: string, phoneModel: string) {
  return a.slug === slug && a.phoneModel === phoneModel;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items };
    case "add": {
      const idx = state.items.findIndex((i) =>
        sameLine(i, action.item.slug, action.item.phoneModel),
      );
      if (idx >= 0) {
        const items = [...state.items];
        items[idx] = {
          ...items[idx],
          quantity: Math.min(MAX_QTY, items[idx].quantity + action.item.quantity),
        };
        return { items };
      }
      return { items: [...state.items, action.item] };
    }
    case "remove":
      return {
        items: state.items.filter((i) => !sameLine(i, action.slug, action.phoneModel)),
      };
    case "qty":
      return {
        items: state.items.map((i) =>
          sameLine(i, action.slug, action.phoneModel)
            ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY, action.quantity)) }
            : i,
        ),
      };
    case "clear":
      return { items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  currency: string;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (item: CartItem) => void;
  remove: (slug: string, phoneModel: string) => void;
  setQuantity: (slug: string, phoneModel: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as CartItem[];
        if (Array.isArray(items)) dispatch({ type: "hydrate", items });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration so we don't overwrite with empty state).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* storage full / disabled */
    }
  }, [state.items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((n, i) => n + i.quantity, 0);
    const subtotalCents = state.items.reduce((n, i) => n + i.priceCents * i.quantity, 0);
    return {
      items: state.items,
      count,
      subtotalCents,
      currency: state.items[0]?.currency ?? "eur",
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add: (item) => {
        dispatch({ type: "add", item });
        setIsOpen(true);
      },
      remove: (slug, phoneModel) => dispatch({ type: "remove", slug, phoneModel }),
      setQuantity: (slug, phoneModel, quantity) =>
        dispatch({ type: "qty", slug, phoneModel, quantity }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [state.items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
