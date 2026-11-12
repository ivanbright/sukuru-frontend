import WorkspacePage from "../workspace-page";
import { privatePageMetadata } from "../../lib/seo";

export const metadata = privatePageMetadata("Your profile", "Manage your Sukuru account profile.");

export default function ProfilePage() {
  return <WorkspacePage path="/profile" />;
}
