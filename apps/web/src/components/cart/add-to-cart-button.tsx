"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Book } from "@/lib/types";
import { useCart } from "./cart-provider";

/** Adds a book to the cart using whichever single format is on sale. */
export function AddToCartButton({ book, className }: { book: Book; className?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const format: "pdf" | "hardcopy" | null = book.pdfPrice ? "pdf" : book.hardcopyPrice ? "hardcopy" : null;

  if (!format) {
    return (
      <span className={cn("flex items-center justify-center rounded-xl border border-dashed border-border px-3 py-2 text-xs font-bold text-muted-foreground", className)}>
        Coming soon
      </span>
    );
  }

  const price = format === "pdf" ? book.pdfPrice!.amount : book.hardcopyPrice!.amount;

  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        onClick={() => {
          const res = add({
            productType: "book",
            productId: book.id,
            slug: book.slug,
            title: book.titleBn ?? book.title,
            image: book.thumbnailUrl,
            variant: format,
            unitPrice: price,
            isPhysical: format === "hardcopy",
          });
          if (!res.ok) {
            setError(res.error ?? "কার্টে যোগ করা যায়নি।");
            setTimeout(() => setError(""), 2800);
            return;
          }
          setAdded(true);
          setTimeout(() => setAdded(false), 1600);
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent bg-accent/10 px-3 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
      >
        {added ? "Added ✓" : "Add to cart"}
      </button>
      {error && <p className="mt-1 text-center text-[11px] font-semibold leading-tight text-danger">{error}</p>}
    </div>
  );
}
