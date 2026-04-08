import { getDirectors } from "../lib/catalog";
import HomeDirectorsPreview from "./HomeDirectorsPreview";

export default async function HomeDirectorsSection() {
  await getDirectors();
  return <HomeDirectorsPreview />;
}
