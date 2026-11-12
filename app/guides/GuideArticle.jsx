import Link from "next/link";
import "./guides.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sukuru.cursorclick.dev").replace(/\/$/, "");

export default function GuideArticle({ path, title, description, sections, related }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: { "@type": "Organization", name: "Sukuru" },
    publisher: { "@type": "Organization", name: "Sukuru" },
    mainEntityOfPage: `${siteUrl}${path}`,
  };

  return (
    <main className="guide-page">
      <script id={`guide-schema-${path.replaceAll("/", "-")}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="guide-header">
        <Link className="feature-brand" href="/features" aria-label="Sukuru features"><span aria-hidden="true">S</span>Sukuru</Link>
        <nav aria-label="Main navigation"><Link href="/features">Features</Link><Link href="/guides">Shop guides</Link><Link href="/">Sign in</Link></nav>
      </header>
      <nav className="guide-breadcrumb" aria-label="Breadcrumb"><Link href="/features">Sukuru</Link><span aria-hidden="true">/</span><Link href="/guides">Shop guides</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
      <article className="guide-article">
        <p className="feature-kicker"><span /> PRACTICAL SHOP GUIDE</p>
        <h1>{title}</h1>
        <p className="guide-intro">{description}</p>
        <div className="guide-content">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.steps && <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
              {section.note && <p className="guide-note">{section.note}</p>}
            </section>
          ))}
        </div>
        <section className="guide-related" aria-labelledby="related-guides-title">
          <h2 id="related-guides-title">Related shop guides</h2>
          <div>{related.map(([label, href]) => <Link key={href} href={href}>{label} <span aria-hidden="true">&rarr;</span></Link>)}</div>
        </section>
        <aside className="guide-cta"><div><h2>Keep your shop records together.</h2><p>Sukuru brings sales, products, stock, and business reports into one workspace.</p></div><Link className="feature-primary" href="/">Explore Sukuru <span aria-hidden="true">&rarr;</span></Link></aside>
      </article>
      <footer className="feature-footer"><Link className="feature-brand" href="/features"><span aria-hidden="true">S</span>Sukuru</Link><span>Business records, kept simply.</span><a href="mailto:support@cursorclick.dev?subject=Sukuru%20support">Contact support</a></footer>
    </main>
  );
}
