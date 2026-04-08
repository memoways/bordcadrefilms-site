## Quoi

<!-- Une phrase : qu'est-ce que ce PR change ? -->

## Pourquoi

<!-- Contexte ou lien vers la tâche Notion / issue GitHub -->

## Comment tester

- [ ] `npm run dev` — vérifier la route concernée
- [ ] Vérifier les états vides et loading
- [ ] Vérifier sur mobile (320px et 768px)

## Checklist

- [ ] `npm run lint` passe sans erreurs
- [ ] `npm run type-check` passe sans erreurs
- [ ] `npm run build` passe localement
- [ ] Pas de secrets ou clés API exposés
- [ ] Les composants Server restent Server (pas de `"use client"` inutile)
- [ ] Les nouvelles images utilisent `next/image` avec hostname déclaré dans `next.config.ts`
- [ ] Tailwind v4 : `bg-linear-to-*` (pas `bg-gradient-to-*`), `aspect-2/3` (pas `aspect-[2/3]`)
