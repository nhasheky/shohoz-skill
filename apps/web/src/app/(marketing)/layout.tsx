import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSiteSettings } from "@/lib/api";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings().catch(() => null);
  const logoUrl = settings?.logoUrl || undefined;

  return (
    <>
      <Navbar logoUrl={logoUrl} />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
