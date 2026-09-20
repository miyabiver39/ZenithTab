<div align="center">

<img src="../../public/icons/icon128.png" width="96" height="96" alt="Icône ZenithTab" />

# ZenithTab

**Un tableau de bord Nouvel onglet pour Google Chrome : rapide, élégant et entièrement personnalisable.**

Widgets en glisser-déposer, interface « verre dépoli », fonds d'écran dynamiques, 7 langues — tout en local, sans compte, sans pistage.

[![Build and Test](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml/badge.svg)](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/miyabiver39/ZenithTab?label=release&color=0ea5e9)](https://github.com/miyabiver39/ZenithTab/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)](../../manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](../../tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19-20232a.svg?logo=react&logoColor=61dafb)](../../package.json)
[![i18n](https://img.shields.io/badge/i18n-7_languages-8b5cf6.svg)](../../src/i18n/locales)
[![Tests](https://img.shields.io/badge/tests-Vitest_%2B_Playwright-6e9f18.svg)](../../tests)

[**Installation**](#-installation) · [**Fonctionnalités**](#-fonctionnalités) · [**Développement**](#️-développement) · [**Journal des modifications**](../../CHANGELOG.md) · [**Confidentialité**](../../PRIVACY.md)

[English](../../README.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · **Français** · [Deutsch](README.de.md) · [한국어](README.ko.md)

<img src="../../store-assets/screenshot_1_1280x800.png" width="880" alt="Tableau de bord ZenithTab" />

</div>

---

## ✨ Fonctionnalités

### Widgets

| Widget | Ce qu'il fait |
| :-- | :-- |
| 🔍 **Recherche rapide** | Barre de recherche multi-moteurs (Google, Bing, DuckDuckGo, GitHub, YouTube, ChatGPT + les vôtres). **Réponses rapides** en ligne : `120*1.1`, `20% of 150`, `10 km to mi`, `0xff`, `2d6`, `coin`, `random 1-100`, `choose a, b, c`, `days until 2026-12-31`. |
| 🌐 **Raccourcis** | Vos sites favoris en tuiles, avec les favicons du cache de Chrome. |
| ⏰ **Horloge** | Numérique / analogique / minimale, secondes, date, fuseau horaire. |
| 🌤️ **Météo** | Conditions actuelles et prévisions à 3 jours (Open-Meteo), détection de la position en un clic. |
| 🔖 **Favoris** | Parcourez et cherchez dans vos favoris Chrome, dossiers compris. |
| 📰 **Actualités & RSS** | Google Actualités (à la une, rubriques, recherche par mot-clé) ou n'importe quel flux RSS/Atom, actualisé en arrière-plan. |
| ⏱️ **Minuteur de concentration** | Sessions Pomodoro avec pauses courtes/longues et compteur de sessions. |
| ✅ **Tâches** | Liste de tâches simple avec filtres et suppressions annulables. |
| 📝 **Notes rapides** | Bloc-notes Markdown multi-pages. |
| 🖼️ **Page intégrée** | Intégrez n'importe quelle page ou outil dans une iframe, avec une carte de repli pour les sites qui refusent l'intégration. |
| ⚡ **Accès rapide** | Les sites les plus visités de Chrome et les onglets récemment fermés (restaurables sur place). |
| 📱 **QR code** | Transformez une URL, un numéro de téléphone ou un texte en QR code — envoyez un lien sur votre téléphone. |
| ⏳ **Compte à rebours** | Jours restants avant un anniversaire, un voyage, un examen ou une échéance ; répétition annuelle. |
| 🔥 **Habitudes** | Cochez vos habitudes quotidiennes et gardez la série en vie. |
| 📅 **Calendrier** | Les événements du jour et à venir depuis n'importe quel lien iCal (.ics) : Google Agenda, Outlook, Apple. |

### Tableau de bord

- 🧩 **Grille libre** — glissez, redimensionnez et organisez les widgets sur une grille adaptative ; les widgets descendent jusqu'à 2 colonnes.
- 📑 **Plusieurs pages** — des tableaux de bord séparés (travail / maison / …), à basculer avec `Ctrl+Alt+←/→`.
- 🖼️ **Fonds d'écran** — collections Unsplash, dégradés ou votre propre image ; un **mode selon l'heure** fait évoluer l'ambiance du matin au soir ; le texte passe automatiquement en sombre sur les fonds clairs.
- 🎨 **Verre dépoli** — réglez le flou, l'arrondi des coins et le dock.
- ↩️ **À l'épreuve des erreurs** — annulation de chaque suppression et changement de disposition (`Ctrl+Z`), corbeille de 30 jours pour les widgets et les pages, sauvegardes automatiques avant les actions risquées.
- ⌨️ **Raccourcis clavier** — intégrés (`/` pour chercher, annuler/rétablir, changement de page) plus vos propres combinaisons qui ouvrent n'importe quelle URL.
- 🌍 **7 langues** — English, 日本語, 简体中文, Español, Français, Deutsch, 한국어 ; les valeurs par défaut suivent votre région (moteurs de recherche, édition des actualités, ville météo, dock).
- 🔄 **Import / Export** — tout le tableau de bord dans un seul fichier JSON.
- 🔒 **Tout en local** — tout vit dans `chrome.storage.local`. Pas de backend, pas d'analytique, pas de pistage.

---

## 🚀 Installation

### Depuis une release (recommandé)

1. Téléchargez `zenith-tab-vX.Y.Z.zip` depuis la [dernière release](https://github.com/miyabiver39/ZenithTab/releases/latest) et décompressez-le.
2. Ouvrez `chrome://extensions/` et activez le **Mode développeur** (en haut à droite).
3. Cliquez sur **Charger l'extension non empaquetée** et choisissez le dossier décompressé.
4. Ouvrez un nouvel onglet.

> Vous mettez à jour une installation chargée manuellement ? Chargez la nouvelle version dans un **nouveau dossier** (ou cliquez sur ↻ sur la carte de l'extension) : Chrome ne relit `manifest.json` qu'au rechargement, remplacer les fichiers sur place laisse donc les permissions obsolètes.

### Depuis les sources

```bash
git clone https://github.com/miyabiver39/ZenithTab.git
cd ZenithTab
npm install
npm run build      # → dist/
npm run verify     # vérifie le manifest empaqueté par rapport à dist/
```

Chargez ensuite `dist/` comme extension non empaquetée, comme ci-dessus.

---

## 🔐 Permissions et confidentialité

| Permission | Pourquoi |
| :-- | :-- |
| `storage`, `unlimitedStorage` | Votre tableau de bord, vos notes et les caches restent sur votre appareil ; pas de plafond de 10 Mo pour les fonds personnalisés |
| `bookmarks` | Le widget Favoris |
| `alarms` | Actualisation des flux en arrière-plan |
| `favicon` | Icônes des sites depuis le cache local de Chrome — aucun service d'icônes tiers |
| `geolocation` | Lue une fois, uniquement quand vous cliquez sur « Détecter ma position » |
| Permissions d'hôte | Météo (Open-Meteo), Google Actualités, fonds Unsplash |
| Optionnelles : `topSites`, `sessions`, `tabs` | Demandées à l'ajout du widget Accès rapide (sites les plus visités, onglets récemment fermés et leurs titres) |
| Permissions d'hôte optionnelles | Demandées par origine, au moment où vous ajoutez un flux RSS ou un calendrier personnalisé |

Pas de backend, pas d'analytique, pas de pistage. [PRIVACY.md](../../PRIVACY.md) liste toutes les requêtes sortantes.

---

## 🛠️ Développement

| Tâche | Commande |
| :-- | :-- |
| Serveur de développement (HMR) | `npm run dev` → http://localhost:5173/newtab.html |
| Build | `npm run build` |
| Lint / types / tests unitaires | `npm run lint` · `npm run typecheck` · `npm run test:run` |
| E2E (Playwright) | `npm run test:e2e` |
| Couverture | `npm run test:coverage` |
| Release | `npm run version:bump X.Y.Z` → `npm run package` (arrêtez d'abord le serveur de développement) → `git push origin main --tags` |

**VS Code** : le dépôt fournit `.vscode/` — `Ctrl+Shift+B` compile, `F5` lance le serveur de développement et ouvre Chrome avec les points d'arrêt fonctionnels (« Debug new tab »), ou charge l'extension compilée (« Debug extension »). La tâche « check all » enchaîne lint → typecheck → tests, le même contrôle que la CI.

Pousser un tag `v*` construit le ZIP et le SBOM et publie une GitHub Release.

### Pile technique

React 19 + TypeScript (strict) · Vite + `@crxjs/vite-plugin` · Tailwind CSS + icônes Lucide · `react-grid-layout` · Zustand · `fast-xml-parser` · Vitest + Testing Library + Playwright

### Structure du projet

```text
src/
├── background/service-worker.ts   # Actualisation des flux en arrière-plan (chrome.alarms)
├── components/
│   ├── common/                    # Modal, Button, Input, GlassCard, ConfirmDialog, UndoToast
│   ├── layout/                    # Header, Dock, GridContainer, SettingsPanel, modales
│   └── widgets/                   # Un dossier par widget + registry.tsx / widgetDefinitions.ts
├── hooks/                         # useRssFeed, useWeather, useLayoutUndo, …
├── i18n/locales/                  # Textes de l'interface, 7 langues
├── services/                      # storage, migrations, rss, weather, calendar, wallpaper, trash, snapshots
├── store/                         # Store Zustand + pile d'annulation
├── utils/                         # parseurs (RSS, iCal), saisie intelligente, calculs compte à rebours / habitudes, …
└── newtab.tsx                     # Racine de l'application
tests/                             # unit / components / e2e
public/_locales/                   # Nom et description pour la boutique
```

Ajouter un widget, c'est une entrée dans le registre — voir [CLAUDE.md](../../CLAUDE.md) §2 et [AGENT.md](../../AGENT.md).

---

## 🤝 Contribuer

Les issues et pull requests sont les bienvenues. Travaillez sur une branche issue de `main`, utilisez Conventional Commits et vérifiez que `npm run lint`, `npm run typecheck` et `npm run test:run` passent. Le [journal des modifications](../../CHANGELOG.md) suit Keep a Changelog.

## 📄 Licence

[MIT](../../LICENSE)
