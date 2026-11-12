import WorkspacePage from "../workspace-page";
import { privatePageMetadata } from "../../lib/seo";
export const metadata = privatePageMetadata("Transactions", "Review sales transactions recorded for your business.");

export default function SalesPage() { return <WorkspacePage path="/sales" />; }
