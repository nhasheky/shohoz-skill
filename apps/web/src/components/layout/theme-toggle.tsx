import { cn } from "@/lib/cn";
import { IconMoon, IconSun } from "@/components/ui/icons";
import { useTheme } from "@/providers/theme";

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("shohoz-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var root=document.documentElement;if(t==="dark"){root.classList.add("dark");}else{root.classList.remove("dark");}root.style.colorScheme=t;root.dataset.theme=t;}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-muted px-1 transition-colors cursor-pointer",
        className
      )}
    >
      <IconMoon width={14} height={14} className={cn("absolute left-2 text-muted-foreground transition-opacity")} />
      <IconSun width={14} height={14} className={cn("absolute right-2 text-muted-foreground transition-opacity")} />
      <span
        className={cn(
          "relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-transform duration-200",
          dark && "translate-x-7"
        )}
      >
        {dark ? <IconMoon width={14} height={14} /> : <IconSun width={14} height={14} />}
      </span>
    </button>
  );
}