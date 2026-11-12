const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export default function sitemap() {
  if (!siteUrl) return [];

  return [{
    url: new URL("/", siteUrl).toString(),
    changeFrequency: "weekly",
    priority: 1,
  }];
}
