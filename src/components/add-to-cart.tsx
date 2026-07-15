"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-context";
import { isUpload } from "@/components/product-image";
import { PHONE_BRANDS } from "@/lib/phone-models";

type Props = {
  product: {
    slug: string;
    name: string;
    priceCents: number;
    currency: string;
    image?: string | null;
  };
  designImages: string[];
};

export function AddToCart({ product, designImages }: Props) {
  const { add } = useCart();
  const choices = designImages.filter(Boolean);
  const needsChoice = choices.length > 0;

  const [choice, setChoice] = useState(0);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [qty, setQty] = useState(1);
  const [touched, setTouched] = useState(false);

  const models = useMemo(
    () => PHONE_BRANDS.find((b) => b.brand === brand)?.models ?? [],
    [brand],
  );
  const invalid = !brand || !model;

  function handleAdd() {
    setTouched(true);
    if (invalid) return;
    add({
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      currency: product.currency,
      image: needsChoice ? choices[choice] : product.image,
      quantity: qty,
      phoneModel: model,
      phoneBrand: brand,
      designChoice: needsChoice ? `Design ${choice + 1}` : undefined,
    });
  }

  return (
    <div className="space-y-5">
      {needsChoice && (
        <div>
          <p className="text-sm font-medium">
            Choose your design <span className="text-ink-soft">({choice + 1} of {choices.length})</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {choices.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setChoice(i)}
                aria-pressed={choice === i}
                aria-label={`Design ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-alt transition ${
                  choice === i
                    ? "border-success ring-2 ring-success/30"
                    : "border-line hover:border-ink-soft"
                }`}
              >
                <Image
                  src={src}
                  alt={`Design ${i + 1}`}
                  fill
                  sizes="120px"
                  unoptimized={isUpload(src)}
                  className="object-contain p-1"
                />
                <span className="absolute left-1 top-1 rounded bg-white/85 px-1 text-[10px] font-semibold text-ink">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium">
            Brand <span className="text-danger">*</span>
          </label>
          <select
            id="brand"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setModel("");
            }}
            className="mt-1 w-full rounded-xl border border-line px-3 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            aria-invalid={touched && !brand}
          >
            <option value="">Select brand</option>
            {PHONE_BRANDS.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="model" className="block text-sm font-medium">
            Model <span className="text-danger">*</span>
          </label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!brand}
            className="mt-1 w-full rounded-xl border border-line px-3 py-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            aria-invalid={touched && !model}
          >
            <option value="">{brand ? "Select model" : "Pick a brand first"}</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      {touched && invalid && (
        <p className="text-sm text-danger">Please choose your phone brand and model.</p>
      )}

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
