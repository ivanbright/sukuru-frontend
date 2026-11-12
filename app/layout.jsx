import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Sukuru | Simple shop management for small businesses",
    template: "%s | Sukuru",
  },
  description: "Track sales, products, and stock with Sukuru, a simple business management tool for shop owners and market traders.",
  applicationName: "Sukuru",
  alternates: siteUrl ? { canonical: "/" } : undefined,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Sukuru",
    title: "Sukuru | Simple shop management for small businesses",
    description: "Track sales, products, and stock with Sukuru, a simple business management tool for shop owners and market traders.",
    url: siteUrl || undefined,
  },
  twitter: {
    card: "summary",
    title: "Sukuru | Simple shop management for small businesses",
    description: "Track sales, products, and stock with Sukuru, a simple business management tool for shop owners and market traders.",
  },
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  verification: googleVerification ? { google: googleVerification } : undefined,
};

export default function RootLayout({ children }) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
