import { useState, useRef } from "react";
import { cn } from "@/lib/cn";

export function FileUploadField({
  value,
  onChange,
  placeholder,
  accept,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  accept?: string;
  className?: string;
}) {
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        onChange(ev.target.result as string);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex bg-muted/30 p-1 rounded-lg border border-border w-max">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
            mode === "link" ? "bg-card shadow-sm border border-border text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Use Link
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
            mode === "upload" ? "bg-card shadow-sm border border-border text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Upload Direct
        </button>
      </div>

      {mode === "link" ? (
        <input
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "URL..."}
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept={accept}
            ref={inputRef}
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
          />
          {value.startsWith("data:") && <span className="text-xs text-success font-semibold">✓ {fileName || "File"} uploaded (ready to save)</span>}
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      )}
    </div>
  );
}
