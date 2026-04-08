# Roadmap d'execution — Sprint Weekly (Suivi des taches)

Date de reference: 2026-04-07
Projet: Bord Cadre Films (Next.js 16 + Airtable)

## Objectif

Executer toutes les taches restantes en cadence hebdomadaire, avec un suivi clair dans le Kanban Notion, et prioriser la finalisation des composants non termines.

## Etat actuel (base code)

### Deja en place
- Stack Next.js 16 / React 19 / Tailwind 4 operationnelle.
- Pages principales en ligne: Home, Completed Films, Directors, News, About, Contact.
- Data films/realisateurs deja alimentee cote serveur via Airtable.
- Loading states deja presents sur les routes catalogue.

### Ecarts critiques a fermer
- Source legacy CSV encore active dans [app/api/films/route.ts](app/api/films/route.ts).
- Composants About non termines (retournent null):
  - [app/components/AboutCarouselGallery.tsx](app/components/AboutCarouselGallery.tsx)
  - [app/components/AboutFounderBio.tsx](app/components/AboutFounderBio.tsx)
  - [app/components/AboutTeamCarousel.tsx](app/components/AboutTeamCarousel.tsx)
  - [app/components/AboutCounters.tsx](app/components/AboutCounters.tsx)
- Sections Home encore statiques (a brancher CMS):
  - [app/components/HomeHero.tsx](app/components/HomeHero.tsx)
  - [app/components/HomeAboutSection.tsx](app/components/HomeAboutSection.tsx)
  - [app/components/HomeNewsSection.tsx](app/components/HomeNewsSection.tsx)
- Page About encore partiellement statique:
  - [app/about/page.tsx](app/about/page.tsx)

---

## Plan d'execution par sprint (weekly)

## Sprint 1 — Alignement Data/API (P0)

But: supprimer les incoherences de source de verite et stabiliser les contrats API.

### Taches
- Migrer [app/api/films/route.ts](app/api/films/route.ts) vers Airtable (suppression CSV).
- Creer les routes editoriales P0/P1:
  - /api/hero-video
  - /api/home-about
  - /api/home-news
  - /api/bcf-numbers
  - /api/festival-photos
  - /api/about-bio
  - /api/team
- Normaliser reponses JSON (id/slug, mediaUrl, order, isPublished/isVisible).
- Ajouter gestion erreurs + cas vide (404/empty/partial media).
- Verifier coherences cache revalidate et tags.

### Definition of Done
- Plus aucune route active dependante de CSV.
- Contrats API documentes et testes manuellement via routes.
- Build + lint OK.

---

## Sprint 2 — Home CMS (P0/P1)

But: remplacer les sections statiques Home par des sections editoriales.

### Taches
- Connecter [app/components/HomeHero.tsx](app/components/HomeHero.tsx) a /api/hero-video.
- Connecter [app/components/HomeNewsSection.tsx](app/components/HomeNewsSection.tsx) a /api/home-news.
- Connecter [app/components/HomeAboutSection.tsx](app/components/HomeAboutSection.tsx) a /api/home-about.
- Implementer section chiffres Home (HomeBCFNumbers) via /api/bcf-numbers.
- Gerer fallback media manquants et chargement progressif.
- Valider rendu SSR/RSC + revalidate coherent.

### Definition of Done
- Home ne contient plus de contenu editorial hardcode.
- Donnees editees dans Airtable visibles sans redeploiement (ISR).
- Performance percue stable (pas de flash inutile).

---

## Sprint 3 — Finalisation composants non finis (About) (P1)

But: terminer tous les composants About non implementes.

### Taches
- Implementer [app/components/AboutCarouselGallery.tsx](app/components/AboutCarouselGallery.tsx) avec /api/festival-photos.
- Implementer [app/components/AboutFounderBio.tsx](app/components/AboutFounderBio.tsx) avec /api/about-bio.
- Implementer [app/components/AboutTeamCarousel.tsx](app/components/AboutTeamCarousel.tsx) avec /api/team.
- Implementer [app/components/AboutCounters.tsx](app/components/AboutCounters.tsx) avec /api/bcf-numbers (si scope About maintenu).
- Refactor [app/about/page.tsx](app/about/page.tsx) pour supprimer texte/images statiques residuels.
- Ajouter empty states propres et alt text sur medias.

### Definition of Done
- Les 4 composants About ne retournent plus null.
- About est entierement alimente par API CMS/Airtable.
- Lint + typecheck + verification responsive OK.

---

## Sprint 4 — Backoffice + QA Release (P1/P2)

But: rendre l'execution editoriale autonome et preparer livraison stable.

### Taches
- Mettre en place /admin minimal (dashboard + sections par composant).
- Ajouter formulaires edition/publish/order pour Home/About.
- Implementer invalidation cache (tags/revalidatePath) apres update.
- QA complete:
  - Accessibilite (alt, focus, clavier)
  - SEO metadata pages editoriales
  - Lighthouse cible > 90 sur pages critiques
- Stabilisation cross-device (mobile/tablette/desktop).

### Definition of Done
- Equipe editoriale peut modifier Home/About sans code.
- Publication fiable et visible via cycle cache prevu.
- Checklist QA validee.

---

## Regles de priorisation (Kanban)

- P0: blocant prod ou source de verite.
- P1: necessaire experience complete Home/About.
- P2: optimisation ou extension.

Ordre recommande:
1. API/data coherence
2. Home editorial
3. About composants non finis
4. Admin + QA

---

## Rituels hebdomadaires (suivi des taches)

- Lundi: planning sprint + commitment Kanban.
- Quotidien: mise a jour statut par tache (Todo/In Progress/Review/Done).
- Jeudi: freeze des nouvelles taches, focus fermeture.
- Vendredi: demo + retro + creation sprint suivant.

---

## Risques et mitigation

- Risque: divergence Airtable/API/front.
  - Mitigation: contrat JSON unique + verif route avant integration UI.
- Risque: regression cache/perf.
  - Mitigation: conserver strategy revalidate existante, tester avant merge.
- Risque: surcharge sprint.
  - Mitigation: limiter WIP, decouper taches en items <= 1 jour.

---

## Liens de reference

- [📋 PRD — Composants CMS (Scope & Backoffice) 3366c2a06b0681b08758dbaee88a822a.md](%F0%9F%93%8B%20PRD%20%E2%80%94%20Composants%20CMS%20%28Scope%20%26%20Backoffice%29%203366c2a06b0681b08758dbaee88a822a.md)
- [PROJECT_STATUS_2026-04-02.md](PROJECT_STATUS_2026-04-02.md)
- [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md)
- [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md)
