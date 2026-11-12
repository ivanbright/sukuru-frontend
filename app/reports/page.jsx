import WorkspacePage from "../workspace-page";
import { privatePageMetadata } from "../../lib/seo";
export const metadata = privatePageMetadata("Reports", "Review sales and business performance reports.");

export default function ReportsPage() { return <WorkspacePage path="/reports" />; }
