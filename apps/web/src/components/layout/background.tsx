"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Pure-CSS animated gradient orbs (GPU-accelerated, zero JS). */
export function BackgroundOrbs({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "navy" | "accent";
}) {
  const palettes = {
    default: ["bg-sky/25", "bg-accent/20", "bg-primary/10"],
    navy: ["bg-sky/15", "bg-accent/12", "bg-[#7FC4E8]/20"],
    accent: ["bg-accent/20", "bg-sky/20", "bg-primary/15"],
  } as const;
  const colors = palettes[variant];

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div
        className={cn(
          "absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl animate-drift",
          colors[0]
        )}
      />
      <div
        className={cn(
          "absolute top-1/3 -right-32 h-[380px] w-[380px] rounded-full blur-3xl animate-drift",
          colors[1]
        )}
        style={{ animationDelay: "-6s" }}
      />
      <div
        className={cn(
          "absolute -bottom-32 left-1/4 h-[400px] w-[400px] rounded-full blur-3xl animate-drift",
          colors[2]
        )}
        style={{ animationDelay: "-12s" }}
      />
    </div>
  );
}

/** Lightweight canvas particle/orbit field. No libraries; respects reduced motion & tab visibility. */
export function ParticleField({ className, density = 46 }: { className?: string; density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; r: number; vx: number; vy: number; hue: "sky" | "gold" };
    let dots: P[] = [];

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      resize();
      const count = Math.max(14, Math.min(density, Math.floor((w * h) / 20000)));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        hue: Math.random() > 0.55 ? "gold" : "sky",
      }));
    };

    const colors = {
      sky: "127,196,232",
      gold: "242,169,59",
    };

    let t = 0;
    const draw = () => {
      if (!running || reduced) return;
      t += 0.004;
      ctx.clearRect(0, 0, w, h);
      for (const p of dots) {
        p.x += p.vx + Math.sin(t + p.y * 0.01) * 0.02;
        p.y += p.vy + Math.cos(t + p.x * 0.01) * 0.02;
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;
        if (p.y < -8) p.y = h + 8;
        if (p.y > h + 8) p.y = -8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors[p.hue]},0.5)`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      cancelAnimationFrame(raf);
      if (running && !reduced) raf = requestAnimationFrame(draw);
    };

    init();
    if (!reduced) {
      raf = requestAnimationFrame(draw);
    } else {
      draw();
      ctx.clearRect(0, 0, w, h);
    }
    window.addEventListener("resize", init);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", init);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    />
  );
}