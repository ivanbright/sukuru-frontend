import WorkspacePage from "../workspace-page";
import { privatePageMetadata } from "../../lib/seo";
export const metadata = privatePageMetadata("Products", "Manage your business product catalogue.");

export default function ProductsPage() { return <WorkspacePage path="/products" />; }
