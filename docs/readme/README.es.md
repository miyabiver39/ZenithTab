<div align="center">

<img src="../../public/icons/icon128.png" width="96" height="96" alt="Icono de ZenithTab" />

# ZenithTab

**Un panel de Nueva pestaña para Google Chrome: rápido, bonito y muy personalizable.**

Widgets de arrastrar y soltar, interfaz de cristal, fondos dinámicos, 7 idiomas — todo en local, sin cuentas, sin rastreo.

[![Build and Test](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml/badge.svg)](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/miyabiver39/ZenithTab?label=release&color=0ea5e9)](https://github.com/miyabiver39/ZenithTab/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)](../../manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](../../tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19-20232a.svg?logo=react&logoColor=61dafb)](../../package.json)
[![i18n](https://img.shields.io/badge/i18n-7_languages-8b5cf6.svg)](../../src/i18n/locales)
[![Tests](https://img.shields.io/badge/tests-Vitest_%2B_Playwright-6e9f18.svg)](../../tests)

[**Instalación**](#-instalación) · [**Funciones**](#-funciones) · [**Desarrollo**](#️-desarrollo) · [**Historial de cambios**](../../CHANGELOG.md) · [**Privacidad**](../../PRIVACY.md)

[English](../../README.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · **Español** · [Français](README.fr.md) · [Deutsch](README.de.md) · [한국어](README.ko.md)

<img src="../../store-assets/screenshot_1_1280x800.png" width="880" alt="Panel de ZenithTab" />

</div>

---

## ✨ Funciones

### Widgets

| Widget | Qué hace |
| :-- | :-- |
| 🔍 **Búsqueda rápida** | Barra de búsqueda multimotor (Google, Bing, DuckDuckGo, GitHub, YouTube, ChatGPT + los tuyos). **Respuestas rápidas** al instante: `120*1.1`, `20% of 150`, `10 km to mi`, `0xff`, `2d6`, `coin`, `random 1-100`, `choose a, b, c`, `days until 2026-12-31`. |
| 🌐 **Accesos directos** | Tus sitios favoritos en mosaico, con iconos de la propia caché de Chrome. |
| ⏰ **Reloj** | Digital / analógico / minimal, segundos, fecha, zona horaria. |
| 🌤️ **Tiempo** | Condiciones actuales y previsión a 3 días (Open-Meteo), detección de ubicación con un clic. |
| 🔖 **Marcadores** | Explora y busca en tus marcadores de Chrome, carpetas incluidas. |
| 📰 **Noticias y RSS** | Google News (titulares, temas, búsqueda por palabra clave) o cualquier feed RSS/Atom, actualizado en segundo plano. |
| ⏱️ **Temporizador de enfoque** | Sesiones Pomodoro con descansos cortos/largos y contador de sesiones. |
| ✅ **Tareas** | Lista de tareas sencilla con filtros y borrados reversibles. |
| 📝 **Notas rápidas** | Bloc de notas Markdown con varias páginas. |
| 🖼️ **Web incrustada** | Incrusta cualquier página o herramienta en un iframe, con tarjeta alternativa para los sitios que lo rechazan. |
| ⚡ **Acceso rápido** | Los sitios más visitados de Chrome y las pestañas cerradas recientemente (restaurables en su sitio). |
| 📱 **Código QR** | Convierte una URL, un teléfono o un texto en un código QR — envía un enlace a tu móvil. |
| ⏳ **Cuenta atrás** | Días que faltan para un cumpleaños, viaje, examen o fecha límite; repetición anual. |
| 🔥 **Hábitos** | Marca tus hábitos diarios y mantén la racha. |
| 📅 **Calendario** | Eventos de hoy y próximos desde cualquier enlace iCal (.ics): Google Calendar, Outlook, Apple. |

### Panel

- 🧩 **Cuadrícula libre** — arrastra, redimensiona y ordena widgets en una cuadrícula adaptable; los widgets se reducen hasta 2 columnas.
- 📑 **Varias páginas** — paneles independientes (trabajo / casa / …), cambiables con `Ctrl+Alt+←/→`.
- 🖼️ **Fondos** — colecciones de Unsplash, degradados o tu propia imagen; un **modo según la hora** cambia el aspecto por la mañana, el día, el atardecer y la noche; el texto pasa a oscuro automáticamente sobre fondos claros.
- 🎨 **Efecto cristal** — ajusta el desenfoque, el radio de las esquinas y el dock.
- ↩️ **A prueba de errores** — deshacer para cada borrado y cambio de diseño (`Ctrl+Z`), papelera de 30 días para widgets y páginas, copias automáticas antes de acciones arriesgadas.
- ⌨️ **Atajos de teclado** — integrados (`/` para buscar, deshacer/rehacer, cambio de página) más tus propias combinaciones que abren cualquier URL.
- 🌍 **7 idiomas** — English, 日本語, 简体中文, Español, Français, Deutsch, 한국어; los valores por defecto siguen tu región (motores de búsqueda, edición de noticias, ciudad del tiempo, dock).
- 🔄 **Importar / Exportar** — todo el panel en un único archivo JSON.
- 🔒 **Todo en local** — todo vive en `chrome.storage.local`. Sin backend, sin analítica, sin rastreo.

---

## 🚀 Instalación

### Desde una release (recomendado)

1. Descarga `zenith-tab-vX.Y.Z.zip` de la [última release](https://github.com/miyabiver39/ZenithTab/releases/latest) y descomprímelo.
2. Abre `chrome://extensions/` y activa el **Modo de desarrollador** (arriba a la derecha).
3. Pulsa **Cargar descomprimida** y elige la carpeta descomprimida.
4. Abre una pestaña nueva.

> ¿Actualizas una instalación cargada a mano? Carga la nueva versión en una **carpeta nueva** (o pulsa ↻ en la tarjeta de la extensión): Chrome solo vuelve a leer `manifest.json` al recargar, así que sustituir los archivos en el mismo sitio deja los permisos desactualizados.

### Desde el código fuente

```bash
git clone https://github.com/miyabiver39/ZenithTab.git
cd ZenithTab
npm install
npm run build      # → dist/
npm run verify     # comprueba el manifest empaquetado contra dist/
```

Después carga `dist/` como extensión descomprimida como se indica arriba.

---

## 🔐 Permisos y privacidad

| Permiso | Por qué |
| :-- | :-- |
| `storage`, `unlimitedStorage` | Tu panel, notas y cachés se quedan en tu dispositivo; sin límite de 10 MB para fondos personalizados |
| `bookmarks` | El widget de marcadores |
| `alarms` | Actualización de feeds en segundo plano |
| `favicon` | Iconos de sitios desde la caché local de Chrome — sin servicios de iconos de terceros |
| `geolocation` | Se lee una vez, solo cuando pulsas "Detectar ubicación actual" |
| Permisos de host | Tiempo (Open-Meteo), Google News, fondos de Unsplash |
| Opcionales: `topSites`, `sessions`, `tabs` | Se piden al añadir el widget de Acceso rápido (sitios más visitados, pestañas cerradas recientemente y sus títulos) |
| Permisos de host opcionales | Se piden por origen, en el momento de añadir un feed RSS o un calendario personalizado |

No hay backend, ni analítica, ni rastreo. [PRIVACY.md](../../PRIVACY.md) enumera todas las peticiones salientes.

---

## 🛠️ Desarrollo

| Tarea | Comando |
| :-- | :-- |
| Servidor de desarrollo (HMR) | `npm run dev` → http://localhost:5173/newtab.html |
| Compilar | `npm run build` |
| Lint / tipos / tests unitarios | `npm run lint` · `npm run typecheck` · `npm run test:run` |
| E2E (Playwright) | `npm run test:e2e` |
| Cobertura | `npm run test:coverage` |
| Release | `npm run version:bump X.Y.Z` → `npm run package` (detén antes el servidor de desarrollo) → `git push origin main --tags` |

**VS Code**: el repositorio incluye `.vscode/` — `Ctrl+Shift+B` compila, `F5` arranca el servidor de desarrollo y abre Chrome con puntos de interrupción funcionando ("Debug new tab"), o carga la extensión compilada ("Debug extension"). La tarea "check all" ejecuta lint → typecheck → tests, el mismo filtro que usa la CI.

Al subir una etiqueta `v*` se generan el ZIP y el SBOM y se publica una GitHub Release.

### Tecnologías

React 19 + TypeScript (strict) · Vite + `@crxjs/vite-plugin` · Tailwind CSS + iconos Lucide · `react-grid-layout` · Zustand · `fast-xml-parser` · Vitest + Testing Library + Playwright

### Estructura del proyecto

```text
src/
├── background/service-worker.ts   # Actualización de feeds en segundo plano (chrome.alarms)
├── components/
│   ├── common/                    # Modal, Button, Input, GlassCard, ConfirmDialog, UndoToast
│   ├── layout/                    # Header, Dock, GridContainer, SettingsPanel, modales
│   └── widgets/                   # Una carpeta por widget + registry.tsx / widgetDefinitions.ts
├── hooks/                         # useRssFeed, useWeather, useLayoutUndo, …
├── i18n/locales/                  # Textos de la interfaz, 7 idiomas
├── services/                      # storage, migrations, rss, weather, calendar, wallpaper, trash, snapshots
├── store/                         # Store de Zustand + pila de deshacer
├── utils/                         # parsers (RSS, iCal), entrada inteligente, cálculos de cuenta atrás / hábitos, …
└── newtab.tsx                     # Raíz de la aplicación
tests/                             # unit / components / e2e
public/_locales/                   # Nombre y descripción para la tienda
```

Añadir un widget es una entrada en el registro — consulta [CLAUDE.md](../../CLAUDE.md) §2 y [AGENT.md](../../AGENT.md).

---

## 🤝 Contribuir

Los issues y pull requests son bienvenidos. Trabaja en una rama a partir de `main`, usa Conventional Commits y asegúrate de que `npm run lint`, `npm run typecheck` y `npm run test:run` pasan. El [historial de cambios](../../CHANGELOG.md) sigue Keep a Changelog.

## 📄 Licencia

[MIT](../../LICENSE)
