import type { Metadata } from "next";
import { Hind_Siliguri, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/api";
import { ThemeProvider } from "@/providers/theme";
import { ThemeScript } from "@/components/layout/theme-toggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd")
  .replace(/\/api\/?$/, "")
  .replace(/\/+$/, "");

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteTitle || SITE.name;
  const description = settings.metaDescription || SITE.description;
  const keywords = settings.keywords?.length
    ? settings.keywords
    : [
        "BCS preparation",
        "Bangladesh govt job",
        "NTRCA",
        "MCQ exam",
        "bank job course",
        "সহজ স্কিল",
        "বিসিএস কোর্স",
      ];
  const ogImage = settings.ogImageUrl || undefined;

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: `${siteName} — ${SITE.tagline}`,
      template: `%s — ${siteName}`,
    },
    description,
    keywords,
    openGraph: {
      type: "website",
      siteName,
      locale: "bn_BD",
      title: `${siteName} — ${SITE.tagline}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} — ${SITE.tagline}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    manifest: "/manifest.webmanifest",
  };
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1826" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      className={`${inter.variable} ${poppins.variable} ${hindSiliguri.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={API_ORIGIN} />
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}