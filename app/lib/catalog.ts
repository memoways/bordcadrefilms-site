import { cache } from "react";
import { readAirtableFilms, type Film } from "./airtable";

export type { Film };

/**
 * A Director is derived from a Film record — it carries the director's name,
 * bio, profile picture, and filmography from the first film associated with them.
 * Fields unrelated to the director's identity are typed as optional to reflect this.
 */
export type Director = {
  name: string;
  bio?: string;
  profilePicture?: string;
  filmography?: string;
};

export const getFilms = cache(async (): Promise<Film[]> => {
  return readAirtableFilms();
});

export const getDirectors = cache(async (): Promise<Director[]> => {
  const films = await getFilms();

  // Keep one entry per unique director name (first film encountered wins)
  const seen = new Map<string, Director>();
  for (const film of films) {
    const name = film.director?.trim();
    if (name && !seen.has(name)) {
      seen.set(name, {
        name,
        bio: film.bio,
        profilePicture: film.profilePicture,
        filmography: film.directorFilmography || film.filmography,
      });
    }
  }

  return Array.from(seen.values());
});
