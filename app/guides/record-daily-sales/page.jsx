import GuideArticle from "../GuideArticle";

const title = "How to Record Daily Sales in a Small Shop";
const description = "A consistent sales record helps a shop owner see what sold, when it sold, and how it was paid for. This simple routine works with a paper ledger or a shop management app.";

export const metadata = {
  title: "How to Record Daily Sales in a Small Shop",
  description: "Learn a simple daily sales recording routine for small shops: capture each sale, keep payment methods clear, and review the day's records.",
  alternates: { canonical: "/guides/record-daily-sales" },
  openGraph: { type: "article", title: `${title} | Sukuru`, description, url: "/guides/record-daily-sales" },
};

const sections = [
  {
    heading: "Choose the details to record",
    paragraphs: ["For each sale, capture the date, the products sold, quantities, prices, total amount, and payment method. Use the same product names and units each time so your records are easy to search and compare.", "If a customer returns an item or a sale is corrected, keep a note of the change in the method your shop uses. Do not silently change the day's totals."],
  },
  {
    heading: "Record sales as they happen",
    paragraphs: ["A reliable habit is easier to maintain than trying to remember a busy day at closing time. Record a sale soon after it is completed, and check that the total and payment method match what you received.", "Keep different payment methods identifiable in your records. A combined daily total can show how much you sold, while separate payment details help you check cash and digital payments independently."],
  },
  {
    heading: "Close the day with a quick review",
    steps: ["Review the day's sale entries and look for missing or repeated records.", "Compare the recorded sales totals with your receipts and payment confirmations.", "Note discrepancies and investigate them while you still remember the day's activity."],
    note: "Sales records describe money from sales. Record business costs separately in a system that supports expenses; a sales total alone is not the same as profit or cash available.",
  },
  {
    heading: "Use a consistent record-keeping tool",
    paragraphs: ["A paper ledger can work if it is kept current and stored safely. A digital tool can make it easier to search recent transactions and see summaries. Sukuru lets shop owners record completed sales and review transaction records and available sales reports in a business workspace."],
  },
];

const related = [["Track inventory in a small shop", "/guides/track-shop-inventory"], ["Build a simple record-keeping routine", "/guides/shop-record-keeping"]];

export default function DailySalesGuidePage() {
  return <GuideArticle path="/guides/record-daily-sales" title={title} description={description} sections={sections} related={related} />;
}
