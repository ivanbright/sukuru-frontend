import Link from "next/link";
import "./features.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sukuru.cursorclick.dev").replace(/\/$/, "");
const applicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sukuru",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web browser",
  description: "Simple sales, product, and inventory management for small shops and market traders.",
  url: `${siteUrl}/features`,
};

export const metadata = {
  title: "Shop Management for Small Businesses in Rwanda",
  description: "Sukuru helps small shops and market traders in Rwanda record sales, manage products, track stock, and review daily business reports in one place.",
  alternates: { canonical: "/features" },
  openGraph: {
    type: "website",
    title: "Shop Management for Small Businesses in Rwanda | Sukuru",
    description: "Record sales, manage products, track stock, and review daily reports with Sukuru.",
    url: `${siteUrl}/features`,
  },
};

const features = [
  {
    number: "01",
    title: "Record each sale",
    description: "Log completed sales and their payments, then find recent transactions when you need to review the day's activity.",
  },
  {
    number: "02",
    title: "Know what is in stock",
    description: "Keep a product catalogue and record stock received so you can see quantities on hand and spot items running low.",
  },
  {
    number: "03",
    title: "Review business reports",
    description: "See sales revenue, transaction counts, and gross profit summaries based on the records in your workspace.",
  },
];

const steps = [
  ["Set up your shop", "Create an account, add your business details, and start a product catalogue."],
  ["Record daily activity", "Add sales and received stock as your business operates."],
  ["Check your records", "Review current stock, recent sales, and available business reports."],
];

export default function FeaturesPage() {
  return (
    <main className="feature-page">
      <script id="sukuru-software-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }} />
      <header className="feature-nav">
        <Link className="feature-brand" href="/" aria-label="Sukuru home"><span aria-hidden="true">S</span>Sukuru</Link>
        <nav aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/guides">Shop guides</Link>
          <a href="#questions">Questions</a>
        </nav>
        <Link className="feature-nav-cta" href="/">Sign in / Get started</Link>
      </header>

      <section className="feature-hero">
        <p className="feature-kicker"><span /> SALES / STOCK / SIMPLE RECORDS</p>
        <h1>Simple shop management for small businesses in Rwanda.</h1>
        <p className="feature-lede">Sukuru helps shop owners and market traders in Rwanda keep sales, products, and stock records together, so they can spend less time searching through notebooks and more time serving customers.</p>
        <div className="feature-actions">
          <Link className="feature-primary" href="/">Get started with Sukuru <span aria-hidden="true">&rarr;</span></Link>
          <a className="feature-secondary" href="#features">Explore the features</a>
        </div>
        <p className="feature-note">Start with one business workspace on the Free plan.</p>
      </section>

      <section className="feature-section" id="features" aria-labelledby="feature-section-title">
        <div className="feature-section-heading">
          <p className="feature-kicker">MADE FOR THE DAILY WORK</p>
          <h2 id="feature-section-title">The essentials for running your shop.</h2>
          <p>Keep everyday business records organized in one workspace.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-section feature-how" id="how-it-works" aria-labelledby="how-title">
        <div className="feature-section-heading">
          <p className="feature-kicker">A CLEARER DAILY ROUTINE</p>
          <h2 id="how-title">Start small. Keep useful records.</h2>
        </div>
        <ol className="feature-steps">
          {steps.map(([title, description], index) => (
            <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{description}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="feature-section" id="guides" aria-labelledby="guides-title">
        <div className="feature-section-heading">
          <p className="feature-kicker">PRACTICAL SHOP ADVICE</p>
          <h2 id="guides-title">Guides for keeping better shop records.</h2>
          <p>Simple routines for recording sales and knowing what is in stock.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-number">GUIDE 01</span><h3><Link href="/guides/record-daily-sales">How to record daily sales</Link></h3><p>A straightforward routine for capturing each sale and reviewing the day.</p></article>
          <article className="feature-card"><span className="feature-number">GUIDE 02</span><h3><Link href="/guides/track-shop-inventory">How to track shop inventory</Link></h3><p>Keep product quantities useful by recording stock received and sales consistently.</p></article>
          <article className="feature-card"><span className="feature-number">GUIDE 03</span><h3><Link href="/guides/shop-record-keeping">A simple record-keeping routine</Link></h3><p>Build a daily and weekly habit around your shop's sales and stock records.</p></article>
        </div>
        <p className="feature-guides-link"><Link href="/guides">See all shop guides <span aria-hidden="true">&rarr;</span></Link></p>
      </section>

      <section className="feature-plan" aria-labelledby="plan-title">
        <div><p className="feature-kicker">SIMPLE TO START</p><h2 id="plan-title">One workspace, free.</h2><p>Use the Free plan for one business workspace and core sales, inventory, product, and report tools. Premium workspace access is available by arrangement.</p></div>
        <Link className="feature-primary" href="/">Create your account <span aria-hidden="true">&rarr;</span></Link>
      </section>

      <section className="feature-section feature-faq" id="questions" aria-labelledby="questions-title">
        <div className="feature-section-heading"><p className="feature-kicker">COMMON QUESTIONS</p><h2 id="questions-title">About Sukuru.</h2></div>
        <details><summary>Who is Sukuru for?</summary><p>Sukuru is designed for small shop owners and market traders who want a simple way to record sales, products, stock, and business activity.</p></details>
        <details><summary>What can I track with Sukuru?</summary><p>You can keep a product catalogue, record sales and payments, receive stock, review quantities on hand, and view available sales reports.</p></details>
        <details><summary>Can I manage more than one business?</summary><p>The Free plan includes one owner workspace. Premium workspace access supports multiple workspaces and is activated after payment is confirmed and approved.</p></details>
      </section>

      <footer className="feature-footer">
        <Link className="feature-brand" href="/"><span aria-hidden="true">S</span>Sukuru</Link>
        <span>Business records, kept simply.</span>
        <div className="contact-links" aria-label="Contact Ivan Bright">
          <span>Contact Ivan Bright</span>
          <a href="https://wa.me/250735024932">WhatsApp: +250 735 024 932</a>
          <a href="mailto:mugishaivanbright250@gmail.com">mugishaivanbright250@gmail.com</a>
          <a href="mailto:support@cursorclick.dev">support@cursorclick.dev</a>
        </div>
      </footer>
    </main>
  );
}
