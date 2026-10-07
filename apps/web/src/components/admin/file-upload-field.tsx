import { useState, useRef } from "react";
import { cn } from "@/lib/cn";
import { uploadFile } from "@/lib/admin-api";

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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setError("File size exceeds 500MB limit.");
      return;
    }

    setFileName(file.name);

    if (!file.type.startsWith("image/")) {
      setUploading(true);
      setProgress(0);
      try {
        onChange(await uploadFile(file, setProgress));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        setFileName("");
      } finally {
        setUploading(false);
      }
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const resized = await resizeImageToFile(file, 1280, 0.82);
      onChange(await uploadFile(resized, setProgress));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
      setFileName("");
    } finally {
      setUploading(false);
    }
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
            disabled={uploading}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer disabled:opacity-60"
          />
          {uploading && <span className="text-xs font-semibold text-accent">Uploading… {progress}%</span>}
          {!uploading && fileName && !error && (
            <span className="text-xs text-success font-semibold">✓ {fileName} uploaded (ready to save)</span>
          )}
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      )}
    </div>
  );
}

export async function resizeImageToFile(file: File, maxWidth: number, quality: number): Promise<File> {
  const passthrough = () => new File([file], file.name, { type: file.type });
  if (typeof document === "undefined" || !file.type.startsWith("image/")) return passthrough();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return passthrough();
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
  if (!blob) return passthrough();
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "image"}.jpg`, { type: "image/jpeg" });
}
