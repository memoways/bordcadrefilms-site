Projet de refonte complète du site catalogue de films de Bord Cadre Films, passant d'une solution Dorik + Airtable (client-side) à une architecture Next.js + Airtable performante et scalable.

## Contexte

**Problème actuel** : Le site existant sous Dorik présente des problèmes majeurs de performance (chargement lent, bugs d'affichage, scroll saccadé) dus aux requêtes Airtable côté client.

**Solution proposée** : Refonte complète avec Next.js 15 (App Router), TypeScript, Tailwind CSS et Airtable comme source de données, avec rendu statique (SSG) et régénération incrémentale (ISR).

## Bénéfices attendus

- ⚡ **Performance** : Temps de chargement divisé par 5-10
- 🎨 **UX améliorée** : Navigation fluide, transitions propres, images optimisées
- 🔒 **Sécurité** : Clé Airtable sécurisée côté serveur
- 📈 **SEO** : Pages pré-générées, optimisation native
- 🚀 **Évolutivité** : Architecture prête pour migration future (Supabase, etc.)

## Stack technique retenue

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **Data** : Airtable (via API serveur)
- **Hébergement** : Vercel

## Estimation globale

📅 **Durée** : 7-10  jours pour MVP, 2 semaines pour version pol

[📑 Présentation du Projet](https://www.notion.so/Pr-sentation-du-Projet-32f6c2a06b068128b71dd7c51311b7f5?pvs=21)

[🎯 Objectifs & Goals](https://www.notion.so/Objectifs-Goals-32f6c2a06b0681bf8039d18f88fc51dd?pvs=21)

[🏛️ Architecture Technique](https://www.notion.so/Architecture-Technique-32f6c2a06b0681fda5c5c3064b1851b1?pvs=21)

[🗓️ Roadmap & Planning](https://www.notion.so/Roadmap-Planning-32f6c2a06b068143ad8ae0aaff02150b?pvs=21)

[📊 Estimations Temps & Coûts](https://www.notion.so/Estimations-Temps-Co-ts-32f6c2a06b06818a97d8f8c4e3ef8934?pvs=21)

[📦 Besoins & Ressources](https://www.notion.so/Besoins-Ressources-32f6c2a06b068123a065ee703c6fd5fb?pvs=21)

[⚙️ Backoffice / CMS Custom Next.js](https://www.notion.so/Backoffice-CMS-Custom-Next-js-32f6c2a06b06813d81bdefc42ff2ce9a?pvs=21)

[💻 Ressources Techniques & Code](https://www.notion.so/Ressources-Techniques-Code-32f6c2a06b06812abf1eedc41422b0c9?pvs=21)

[✅ Suivi des Tâches](https://www.notion.so/cdb557d589c34bbe8d6b7c5ee24e0bb1?pvs=21)