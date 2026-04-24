import { SocialClient } from "./SocialClient";
import { getAllSocialRowsAdmin } from "../../../lib/social";

export const revalidate = 0;

export default async function AdminSocialPage() {
  const items = await getAllSocialRowsAdmin();
  return <SocialClient initialItems={items} />;
}
