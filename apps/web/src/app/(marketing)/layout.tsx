import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartProvider } from "@/components/cart/cart-provider";
import { getSiteSettings } from "@/lib/api";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings().catch(() => null);
  const logoUrl = settings?.logoUrl || undefined;

  return (
    <CartProvider>
      <Navbar logoUrl={logoUrl} />
      <div className="flex-1">{children}</div>
      <Footer />
    </CartProvider>
  );
}
