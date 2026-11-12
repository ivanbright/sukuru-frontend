import WorkspacePage from "../workspace-page";
import { privatePageMetadata } from "../../lib/seo";
export const metadata = privatePageMetadata("Business settings", "Manage your business workspace details.");

export default function SettingsPage() { return <WorkspacePage path="/settings" />; }
