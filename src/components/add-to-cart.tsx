"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/components/cart/cart-context";

type Props = { product: Omit<CartItem, "quantity" | "phoneModel"> };

export function AddToCart({ product }: Props) {
  const { add } = useCart();
  const [phoneModel, setPhoneModel] = useState("");
  const [qty, setQty] = useState(1);
  const [touched, setTouched] = useState(false);

  const invalid = phoneModel.trim().length === 0;

  function handleAdd() {
    setTouched(true);
    if (invalid) return;
    add({ ...product, quantity: qty, phoneModel: phoneModel.trim() });
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="phone-model" className="block text-sm font-medium">
          Your phone model <span className="text-danger">*</span>
        </label>
        <input
          id="phone-model"
          type="text"
          value={phoneModel}
          onChange={(e) => setPhoneModel(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. iPhone 15 Pro, Samsung Galaxy S24…"
          maxLength={80}
          className="mt-1 w-full rounded-xl border border-line px-4 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          aria-invalid={touched && invalid}
        />
        {touched && invalid && (
          <p className="mt-1 text-sm text-danger">Tell us your device so we can make it fit.</p>
        )}
        <p className="mt-1 text-xs text-ink-soft">
          We print for every iPhone and the full Android range.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm font-medium">
          Qty
        </label>
        <select
          id="qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="rounded-lg border border-line px-3 py-2"
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleAdd} className="btn btn-primary w-full text-base">
        Add to cart
      </button>
    </div>
  );
}
