import GuideArticle from "../GuideArticle";

const title = "How to Track Inventory in a Small Shop";
const description = "A useful inventory record starts with a clear product list and stays accurate when stock received and items sold are recorded consistently.";

export const metadata = {
  title: "How to Track Inventory in a Small Shop",
  description: "A practical guide to small shop inventory tracking: create a product list, record incoming stock and sales, and compare expected stock with a physical count.",
  alternates: { canonical: "/guides/track-shop-inventory" },
  openGraph: { type: "article", title: `${title} | Sukuru`, description, url: "/guides/track-shop-inventory" },
};

const sections = [
  {
    heading: "Start with a clear product list",
    paragraphs: ["List the products you sell and choose a consistent name and unit for each one, such as each, kilogram, or litre. If you use different names for the same item, it becomes harder to tell what is actually in stock.", "Count the stock you have now and record that starting quantity using the inventory process available to your shop. Keep the count date so you know when the figure was last checked."],
  },
  {
    heading: "Record stock coming in and going out",
    paragraphs: ["When a delivery arrives, check it against what you ordered, then record the quantity you actually received. Record sales promptly so the stock record reflects items that have left the shop.", "A simple expected-stock calculation is: opening quantity + stock received − recorded units sold. It is a useful cross-check, but it depends on complete records and does not account for damage, samples, returns, or counting mistakes unless you record those separately."],
  },
  {
    heading: "Compare the record with a physical count",
    steps: ["Choose a regular time to count products, starting with fast-moving or valuable items.", "Compare the count with the quantity your records suggest should be on hand.", "If the figures differ, check recent deliveries and sales first, then investigate other causes and record the correction using your shop's process."],
  },
  {
    heading: "Make the stock list part of the daily routine",
    paragraphs: ["Review low or fast-moving items before placing a new order, and use recent sales as one input to your decision. Sukuru keeps a product catalogue, records stock received and sales, and displays stock quantities in the workspace."],
    note: "Inventory figures are only as reliable as the transactions entered. Keep delivery notes and count records available when checking a discrepancy.",
  },
];

const related = [["Record daily sales", "/guides/record-daily-sales"], ["Build a simple record-keeping routine", "/guides/shop-record-keeping"]];

export default function ShopInventoryGuidePage() {
  return <GuideArticle path="/guides/track-shop-inventory" title={title} description={description} sections={sections} related={related} />;
}
