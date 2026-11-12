import WorkspacePage from "../workspace-page";
import { privatePageMetadata } from "../../lib/seo";
export const metadata = privatePageMetadata("Inventory", "View and manage stock for your business.");

export default function InventoryPage() { return <WorkspacePage path="/inventory" />; }
