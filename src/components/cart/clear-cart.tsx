"use client";

import { useEffect } from "react";
import { useCart } from "./cart-context";

/** Empties the cart once, after a successful checkout. */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // clear is stable within a render session; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
