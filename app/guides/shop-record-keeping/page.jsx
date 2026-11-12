import GuideArticle from "../GuideArticle";

const title = "A Simple Record-Keeping Routine for Shop Owners";
const description = "A small, repeatable routine can help a shop owner keep sales and stock information useful without saving every task for the end of the week.";

export const metadata = {
  title: "A Simple Record-Keeping Routine for Shop Owners",
  description: "Use this practical daily and weekly record-keeping checklist to keep small shop sales, products, and stock information organized.",
  alternates: { canonical: "/guides/shop-record-keeping" },
  openGraph: { type: "article", title: `${title} | Sukuru`, description, url: "/guides/shop-record-keeping" },
};

const sections = [
  {
    heading: "At the start of the day",
    steps: ["Check the stock of important or fast-moving items.", "Make sure new deliveries from the previous day have been recorded.", "Keep your sales book or digital sales tool ready for use."],
  },
  {
    heading: "During the day",
    paragraphs: ["Record each completed sale with its products, quantities, total, and payment details. When stock arrives, check the delivery and record what you accepted. Avoid relying on memory or loose notes that can be separated from the rest of your shop records."],
  },
  {
    heading: "Before closing",
    steps: ["Review the day's sales for missing or duplicate entries.", "Check recorded totals against receipts and payment confirmations.", "Make a short note of any mismatch that needs follow-up.", "Review stock that is running low so it can be considered for reordering."],
  },
  {
    heading: "Once a week",
    paragraphs: ["Look at sales and stock trends together. Which products sell regularly? Which quantities do you often need to replenish? A weekly review can help you plan purchases, but use your supplier timing, available cash, and actual demand as well as the records.", "Keep the routine simple enough that you can repeat it. If the process feels too heavy, start with recording every sale and delivery, then add a weekly review."],
  },
  {
    heading: "Keep records in one place",
    paragraphs: ["A notebook can work for a small shop when entries are clear and consistent. A digital business tool can connect the product list with sales and stock records. Sukuru provides a workspace for product catalogues, completed sales, received stock, inventory quantities, and available sales reports."],
    note: "Sukuru's reports reflect the data entered in the workspace. They do not replace a full accounting system or professional tax advice.",
  },
];

const related = [["Record daily sales", "/guides/record-daily-sales"], ["Track shop inventory", "/guides/track-shop-inventory"]];

export default function ShopRecordKeepingGuidePage() {
  return <GuideArticle path="/guides/shop-record-keeping" title={title} description={description} sections={sections} related={related} />;
}
