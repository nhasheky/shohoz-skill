import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <LogoMark markOnly className="opacity-80" />
      <h1 className="mt-6 font-display text-6xl font-extrabold text-primary">404</h1>
      <p className="mt-3 font-display text-xl font-bold text-foreground">Page not found</p>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you are looking for has moved, was archived, or never existed.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/" variant="accent">
          Go home
        </ButtonLink>
        <ButtonLink href="/courses" variant="outline">
          Browse courses
        </ButtonLink>
      </div>
      <div className="mt-8">
        <Link href="/exams?type=free" className="text-sm font-semibold text-accent hover:underline">
          Try a free MCQ exam →
        </Link>
      </div>
    </div>
  );
}