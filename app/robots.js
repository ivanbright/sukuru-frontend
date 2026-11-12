const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sukuru.cursorclick.dev").replace(/\/$/, "");

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
