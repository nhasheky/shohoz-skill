"use client";

import type { ReactNode } from "react";
import { useOwned } from "./use-owned";

export function OwnedOnly({
  type,
  productId,
  slug,
  children,
}: {
  type: "course" | "book" | "exam";
  productId?: string;
  slug?: string;
  children: ReactNode;
}) {
  const owned = useOwned(type, productId, slug);
  return owned ? <>{children}</> : null;
}
