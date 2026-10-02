"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Book } from "@/lib/types";
import { useCart } from "./cart-provider";

/** Adds a book to the cart using whichever single format is on sale. */
export function AddToCartButton({ book, className }: { book: Book; className?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

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
    <button
      type="button"
      onClick={() => {
        add({
          productType: "book",
          productId: book.id,
          slug: book.slug,
          title: book.titleBn ?? book.title,
          image: book.thumbnailUrl,
          variant: format,
          unitPrice: price,
          isPhysical: format === "hardcopy",
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl border border-accent bg-accent/10 px-3 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent/20",
        className,
      )}
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
