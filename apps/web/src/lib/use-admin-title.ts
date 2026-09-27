"use client";

import { useEffect } from "react";

/** Client-side page title for admin pages (which are client components and cannot export metadata). */
export function useAdminTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — Shohoz Skill Admin`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
