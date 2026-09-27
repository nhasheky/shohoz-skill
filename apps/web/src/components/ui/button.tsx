import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "ghost" | "soft" | "danger" | "sky";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm focus-visible:outline-primary",
  accent:
    "bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm focus-visible:outline-accent",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted focus-visible:outline-primary",
  ghost: "bg-transparent text-foreground hover:bg-muted focus-visible:outline-primary",
  soft: "bg-primary/8 text-primary hover:bg-primary/14 focus-visible:outline-primary",
  sky: "bg-sky text-sky-foreground hover:bg-sky-deep shadow-sm focus-visible:outline-sky",
  danger: "bg-danger text-danger-foreground hover:opacity-90 focus-visible:outline-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
  xl: "h-13 px-6 text-base gap-2",
  icon: "h-9 w-9",
};

const base =
  "inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98] cursor-pointer select-none";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

type ButtonLinkProps = {
  href: string;
  className?: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
  target?: string;
  rel?: string;
  ariaLabel?: string;
};

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  children,
  target,
  rel,
  ariaLabel,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {children}
    </Link>
  );
}