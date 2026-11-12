const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sukuru.cursorclick.dev").replace(/\/$/, "");

export default function sitemap() {
  return [{
    url: new URL("/", siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }];
}
