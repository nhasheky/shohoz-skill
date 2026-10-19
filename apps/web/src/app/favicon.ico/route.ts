import { getSiteSettings } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const settings = await getSiteSettings().catch(() => null);
  const faviconUrl = settings?.faviconUrl;

  if (faviconUrl && faviconUrl.startsWith("data:")) {
    const matches = faviconUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=3600, must-revalidate",
        },
      });
    }
  }

  // Fallback to the default icon.svg if it exists, or just redirect
  return NextResponse.redirect(new URL("/icon.svg", process.env.NEXT_PUBLIC_APP_URL || "https://shohozskill.com"));
}
