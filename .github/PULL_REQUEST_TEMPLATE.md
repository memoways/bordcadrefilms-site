## Quoi

<!-- Une phrase : qu'est-ce que ce PR change ? -->

## Pourquoi

<!-- Contexte ou lien vers la tâche Notion / issue GitHub -->

## Comment tester

- [ ] `npm run dev` — vérifier la route concernée
- [ ] Vérifier les états vides et loading
- [ ] Vérifier sur mobile (320px et 768px)

## Checklist code qualité

Voir [BEST_PRACTICES.md](../BEST_PRACTICES.md) pour le détail de chaque règle.

- [ ] `npm run lint` passe sans erreurs
- [ ] `npm run type-check` passe sans erreurs
- [ ] `npm run build` passe localement
- [ ] Pas de secrets ou clés API exposés dans le code
- [ ] Pas de `"use client"` inutile — composant purement présentatif = Server Component
- [ ] Pas d'appel `/api/...` interne depuis un Server Component — utiliser `app/lib/` directement
- [ ] Couleurs via tokens CSS (`bg-accent`, `brand-btn-primary`) — pas de hex brut en JSX
- [ ] Pas de variables CSS indéfinies dans `style={{}}`
- [ ] `next/image` avec `sizes`, `priority` uniquement above-the-fold, `alt` descriptif
- [ ] Tailwind v4 : `bg-linear-to-*` (pas `bg-gradient-to-*`), `aspect-2/3` (pas `aspect-[2/3]`)
- [ ] `Promise.all` pour les fetches serveur indépendants
- [ ] `export const revalidate` cohérent avec la couche de données
- [ ] TypeScript strict — pas de `any`, props typées via les types de `app/lib/`
