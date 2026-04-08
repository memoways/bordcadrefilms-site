import { getFilms } from "../lib/catalog";
import HomeFilmGridPreview from "./HomeFilmGridPreview";

export default async function HomeFilmGridSection() {
  await getFilms();
  return <HomeFilmGridPreview />;
}
