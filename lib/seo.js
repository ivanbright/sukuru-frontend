export function privatePageMetadata(title, description) {
  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}
