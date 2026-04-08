# Architecture Technique

## Stack technique

### Frontend

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **Composants** : React 19
- **Gestion d'état** : React hooks (useState, useReducer si nécessaire)

### Backend / Data

- **Source de données** : Airtable
- **API** : Next.js Server Components + API Routes
- **SDK** : `airtable` npm package ou fetch direct
- **Rendu** : SSG (Static Site Generation) + ISR (Incremental Static Regeneration)

### Infrastructure

- **Hébergement** : Vercel
- **CI/CD** : GitHub + Vercel (déploiement auto)
- **DNS** : À configurer (sous-domaine ou domaine dédié)
- **Analytics** : Vercel Analytics (inclus gratuit)

## Architecture de données

### Flux SSG + ISR

```
1. Build time / ISR trigger
   ↓
2. Next.js Server appelle Airtable
   ↓
3. Fetch des films (vue optimisée)
   ↓
4. Transformation des données (TS types)
   ↓
5. Génération HTML statique
   ↓
6. Cache sur Vercel CDN
   ↓
7. Livraison instantanée au visiteur
   ↓
8. Régénération en background (ex: toutes les heures)
```

### Structure Airtable

**Table** : `Films` (ou nom existant)

**Vue recommandée** : `Website_CompletedFilms`

**Champs nécessaires** :

- `Titre` (text)
- `Slug` (text, unique, stable)
- `Affiche` (attachment)
- `Réalisateur` (text ou link to Realisateurs)
- `Année` (number)
- `Durée` (number, en minutes)
- `Pays` (text ou multi-select)
- `Genre` (text ou multi-select)
- `Synopsis` (long text)
- `Bande_annonce_URL` (URL)
- `Statut` (select: Terminé, Post-prod, etc.)

## Structure du projet

```
bordcadre-films/
├── app/
│   ├── page.tsx                    # Home
│   ├── completed-films/
│   │   ├── page.tsx               # Grille films (SSG)
│   │   └── [slug]/
│   │       └── page.tsx           # Détail film (SSG)
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── layout.tsx                 # Layout global
│   └── globals.css
├── components/
│   ├── FilmGrid.tsx               # Grille responsive
│   ├── FilmCard.tsx               # Carte film individuelle
│   ├── FiltersBar.tsx             # Barre de filtres
│   ├── SkeletonCard.tsx           # Loading skeleton
│   └── Header.tsx / Footer.tsx
├── lib/
│   ├── airtable.ts                # Fonctions fetch Airtable
│   └── types.ts                   # Types TS (Film, etc.)
├── public/
│   └── logo.svg, favicon.ico
├── .env.local                      # Variables d'env (clés API)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Optimisations clés

### Images

```tsx
import Image from 'next/image'

<Image
  src={film.affiche}
  alt={film.titre}
  width={300}
  height={450}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={film.blurData}
/>
```

### ISR Configuration

```tsx
// app/completed-films/page.tsx
export const revalidate = 3600 // 1 heure

export default async function CompletedFilmsPage() {
  const films = await getCompletedFilms()
  return <FilmGrid films={films} />
}
```

### Gestion environnement

```bash
# .env.local
AIRTABLE_API_KEY=key...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_FILMS=Films
AIRTABLE_VIEW_COMPLETED=Website_CompletedFilms
```

## Sécurité

- ✅ Clés API uniquement en variables d'environnement serveur
- ✅ Pas d'exposition des clés côté client (jamais dans le bundle JS)
- ✅ Rate limiting naturel via SSG (pas de calls directs)
- ✅ HTTPS par défaut sur Vercel
- ✅ Headers de sécurité (CSP, HSTS, etc.)