import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/cart/cart-provider";
import { TrackOrder } from "@/components/marketing/track-order";
import { MarketingPixels } from "@/components/marketing/pixels";
import { getMarketingPixels, getSiteSettings } from "@/lib/api";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const [settings, pixels] = await Promise.all([
    getSiteSettings().catch(() => null),
    getMarketingPixels().catch(() => []),
  ]);
  const logoUrl = settings?.logoUrl || undefined;

  return (
    <CartProvider>
      <Navbar logoUrl={logoUrl} />
      <div className="flex-1">{children}</div>
      <TrackOrder />
      <MarketingPixels pixels={pixels} />
      <Footer />
    </CartProvider>
  );
}
