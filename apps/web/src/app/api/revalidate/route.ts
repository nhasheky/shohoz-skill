import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd")
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

const TAGS = ["site-settings", "marketing-pixels", "page:home", "page:about", "page:contact", "page:categories"];

/**
 * Called by the admin panel after any successful write so the ISR/Data Cache is
 * busted immediately. Only allowed with a valid admin token (verified against
 * the API — this app has no JWT secret of its own).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const check = await fetch(`${API_URL}/api/admin/site-settings`, {
      headers: { Authorization: auth, Accept: "application/json" },
      cache: "no-store",
    });
    if (!check.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "api unreachable" }, { status: 502 });
  }

  for (const tag of TAGS) {
    try {
      revalidateTag(tag, "max");
    } catch {
      /* ignore unknown tag */
    }
  }
  try {
    revalidatePath("/", "layout");
  } catch {
    /* ignore */
  }
  return NextResponse.json({ revalidated: true, at: Date.now() });
}
