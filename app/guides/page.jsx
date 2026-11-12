import Link from "next/link";
import "./guides.css";

export const metadata = {
  title: "Shop Record-Keeping Guides",
  description: "Practical guides for small shop owners and market traders on recording daily sales, tracking stock, and building simple business record-keeping habits.",
  alternates: { canonical: "/guides" },
};

const guides = [
  ["How to record daily sales in a small shop", "A practical routine for recording each sale, keeping payment methods clear, and reviewing the day's totals.", "/guides/record-daily-sales"],
  ["How to track inventory in a small shop", "Learn a simple way to list products, record stock received, and compare expected quantities with a physical count.", "/guides/track-shop-inventory"],
  ["A simple record-keeping routine for shop owners", "A daily and weekly checklist for keeping sales, products, and stock records organized.", "/guides/shop-record-keeping"],
];

export default function GuidesPage() {
  return (
    <main className="guide-page">
      <header className="guide-header"><Link className="feature-brand" href="/features"><span aria-hidden="true">S</span>Sukuru</Link><nav aria-label="Main navigation"><Link href="/features">Features</Link><Link href="/">Sign in</Link></nav></header>
      <section className="guide-index">
        <p className="feature-kicker"><span /> SUKURU SHOP GUIDES</p>
        <h1>Practical guides for running a small shop.</h1>
        <p className="guide-index-intro">Clear, manageable ways to record sales and track stock. Start with one routine, use it consistently, and adjust it to fit your shop.</p>
        <ol className="guide-index-list">{guides.map(([title, description, href]) => <li key={href}><h2><Link href={href}>{title}</Link></h2><p>{description}</p></li>)}</ol>
        <p className="guide-index-intro">Sukuru helps shop owners keep their sales, products, and inventory records in one place. <Link href="/features">Explore Sukuru features</Link>.</p>
      </section>
      <footer className="feature-footer"><Link className="feature-brand" href="/features"><span aria-hidden="true">S</span>Sukuru</Link><span>Business records, kept simply.</span><div className="contact-links" aria-label="Contact Ivan Bright"><span>Contact Ivan Bright</span><a href="https://wa.me/250735024932">WhatsApp: +250 735 024 932</a><a href="mailto:mugishaivanbright250@gmail.com">mugishaivanbright250@gmail.com</a><a href="mailto:support@cursorclick.dev">support@cursorclick.dev</a></div></footer>
    </main>
  );
}
