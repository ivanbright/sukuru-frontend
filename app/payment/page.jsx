import WorkspacePage from "../workspace-page";
import { privatePageMetadata } from "../../lib/seo";

export const metadata = privatePageMetadata("Plans and payment", "Manage your Sukuru workspace plan.");

export default function PaymentPage() {
  return <WorkspacePage path="/payment" />;
}
