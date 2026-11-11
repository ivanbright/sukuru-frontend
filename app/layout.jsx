import "./globals.css";

export const metadata = {
  title: "Sukuru — Your business, in good hands",
  description: "A quick business assistant for shop owners and market traders.",
};

export default function RootLayout({ children }) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
