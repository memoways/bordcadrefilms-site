## Client

**Bord Cadre Films** - Société de production de films basée à Genève

- Site principal : [bordcadrefilms.com](http://bordcadrefilms.com)
- Spécialisation : Production de films (longs/courts métrages)
- Présence internationale : festivals, coproductions

## Problématique

Le site actuel [new.bordcadrefilms.com/completed-films](http://new.bordcadrefilms.com/completed-films) (construit avec Dorik) souffre de problèmes majeurs :

### Symptômes techniques

- 🐌 Chargement lent de la grille de films
- 💥 Bugs d'affichage lors du scroll (contenu qui apparaît progressivement)
- 🐢 Images lourdes non optimisées
- ⏳ Attente visible avant affichage complet
- 🚧 Sensation de "blocage" de la page

### Causes racines

1. **Requêtes côté client** : Chaque visiteur appelle directement l'API Airtable depuis son navigateur
2. **Absence de cache** : Aucune optimisation serveur, chaque visite = nouvelle requête
3. **Limites Dorik** : Contrôle limité sur le rendering, pagination, lazy loading
4. **Charge massive** : Tentative de charger toute la table d'un coup
5. **Rate limiting Airtable** : API publique avec limites strictes (5 req/sec)

## Solution proposée

Refonte complète en **code natif** avec architecture moderne :

### Approche

- ✅ Garder **Airtable** comme source de données (confort équipe)
- ✅ Passer sur **Next.js** pour performance et contrôle total
- ✅ Implémenter **SSG + ISR** (pages statiques régénérées automatiquement)
- ✅ Optimiser images avec **next/image**
- ✅ Sécuriser clés API côté serveur

### Architecture cible

```
Visiteur
  ↓
Next.js (serveur Vercel)
  ↓ (build time / ISR)
Airtable API
  ↓
HTML statique pré-généré
  ↓
Livraison instantanée au visiteur
```

## Livrables attendus

- 🖥️ Site web complet avec grille de films performante
- 📋 Pages détail pour chaque film
- 🎯 Système de filtres (année, genre, pays)
- 💎 UI cohérente avec le site principal
- 📈 SEO optimisé
- 🔧 Documentation technique pour maintenance