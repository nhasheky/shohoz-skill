"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconPlay } from "@/components/ui/icons";

/** Adaptive video player: YouTube embeds or HLS (Bunny/Mux) with lazy init. */
export function VideoPlayer({
  source,
  title,
  className,
  autoplayable = true,
}: {
  source: { type: "youtube"; youtubeId: string } | { type: "direct"; hlsUrl: string };
  title?: string;
  className?: string;
  autoplayable?: boolean;
}) {
  const [ready, setReady] = useState(false);

  if (source.type === "youtube") {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black", className)}>
        {(ready || !autoplayable) && (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${source.youtubeId}?rel=0&modestbranding=1`}
            title={title ?? "Video lesson"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        {!ready && autoplayable && (
          <button
            type="button"
            onClick={() => setReady(true)}
            aria-label={`Play "${title ?? "video"}" on YouTube`}
            className="group absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/60 to-black/60"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glow transition-transform group-hover:scale-110">
              <IconPlay width={26} height={26} className="ml-1" />
            </span>
          </button>
        )}
      </div>
    );
  }

  return <HlsVideo hlsUrl={source.hlsUrl} title={title} className={className} />;
}

function HlsVideo({ hlsUrl, title, className }: { hlsUrl: string; title?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const video = ref.current;
    let cancelled = false;
    const isM3u8 = hlsUrl.includes(".m3u8");

    async function load() {
      if (!video || cancelled) return;
      if (isM3u8 && video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        return;
      }
      if (isM3u8) {
        const { default: Hls } = await import("hls.js");
        if (!Hls.isSupported()) return;
        const hls = new Hls({ capLevelToPlayerSize: true });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        return;
      }
      video.src = hlsUrl;
    }

    const t = setTimeout(load, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl]);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black", className)}>
      <video ref={ref} className="absolute inset-0 h-full w-full" controls playsInline preload="none" title={title} />
    </div>
  );
}