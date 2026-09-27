"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
        <span className="text-2xl text-danger">!</span>
      </div>
      <h1 className="mt-6 font-display text-2xl font-extrabold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We hit an unexpected error. Try again, or head back home.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="accent" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go home
        </Button>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>}
    </div>
  );
}