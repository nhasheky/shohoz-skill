"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function read(key: string) {
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

/**
 * Reads a query-string value without making the page dynamic and without
 * suspending the prerendered HTML (server snapshot is empty).
 */
export function useQueryParam(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => "",
  );
}
