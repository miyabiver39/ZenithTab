<div align="center">

<img src="../../public/icons/icon128.png" width="96" height="96" alt="ZenithTab 아이콘" />

# ZenithTab

**빠르고, 아름답고, 마음껏 꾸밀 수 있는 Google Chrome 새 탭 대시보드.**

드래그 앤 드롭 위젯, 글래스 UI, 다이내믹 배경화면, 7개 언어 — 로컬 우선, 계정 불필요, 추적 없음.

[![Build and Test](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml/badge.svg)](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/miyabiver39/ZenithTab?label=release&color=0ea5e9)](https://github.com/miyabiver39/ZenithTab/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)](../../manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](../../tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19-20232a.svg?logo=react&logoColor=61dafb)](../../package.json)
[![i18n](https://img.shields.io/badge/i18n-7_languages-8b5cf6.svg)](../../src/i18n/locales)
[![Tests](https://img.shields.io/badge/tests-Vitest_%2B_Playwright-6e9f18.svg)](../../tests)

[**설치**](#-설치) · [**기능**](#-기능) · [**개발**](#️-개발) · [**변경 이력**](../../CHANGELOG.md) · [**개인정보**](../../PRIVACY.md)

[English](../../README.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **한국어**

<img src="../../store-assets/screenshot_1_1280x800.png" width="880" alt="ZenithTab 대시보드" />

</div>

---

## ✨ 기능

### 위젯

| 위젯 | 하는 일 |
| :-- | :-- |
| 🔍 **빠른 검색** | 멀티 엔진 검색창(Google, Bing, DuckDuckGo, GitHub, YouTube, ChatGPT + 직접 추가). **스마트 답변**을 바로 표시: `120*1.1`, `20% of 150`, `10 km to mi`, `0xff`, `2d6`, `coin`, `random 1-100`, `choose a, b, c`, `days until 2026-12-31`. |
| 🌐 **바로가기** | 자주 가는 사이트를 타일로. 파비콘은 Chrome 자체 캐시에서 가져와요. |
| ⏰ **시계** | 디지털 / 아날로그 / 미니멀, 초·날짜·시간대. |
| 🌤️ **날씨** | 현재 날씨와 3일 예보(Open-Meteo), 클릭 한 번으로 위치 감지. |
| 🔖 **북마크** | Chrome 북마크를 폴더까지 탐색하고 검색. |
| 📰 **뉴스 & RSS** | Google 뉴스(헤드라인, 주제, 키워드 검색) 또는 모든 RSS/Atom 피드를 백그라운드에서 갱신. |
| ⏱️ **집중 타이머** | 짧은/긴 휴식과 세션 카운터가 있는 뽀모도로. |
| ✅ **할 일** | 필터가 있는 간단한 할 일 목록, 삭제 되돌리기 가능. |
| 📝 **빠른 메모** | 여러 페이지의 Markdown 메모장. |
| 🖼️ **웹 임베드** | 어떤 페이지나 도구든 iframe으로 삽입, 삽입을 거부하는 사이트에는 대체 카드 표시. |
| ⚡ **빠른 액세스** | Chrome의 자주 방문한 사이트와 최근 닫은 탭(제자리에서 복원 가능). |
| 📱 **QR 코드** | URL·전화번호·텍스트를 QR 코드로 — 휴대폰에 링크 보내기. |
| ⏳ **카운트다운** | 생일·여행·시험·마감까지 남은 날짜, 매년 반복 지원. |
| 🔥 **습관 트래커** | 매일 습관을 체크하고 연속 기록을 이어가요. |
| 📅 **캘린더** | iCal(.ics) 링크로 오늘과 다가오는 일정을 표시 — Google 캘린더, Outlook, Apple. |

### 대시보드

- 🧩 **자유로운 그리드** — 반응형 그리드에서 위젯을 끌고, 크기를 바꾸고, 정렬. 위젯은 2열까지 줄일 수 있어요.
- 📑 **여러 페이지** — 업무 / 집 / … 별도의 대시보드를 `Ctrl+Alt+←/→`로 전환.
- 🖼️ **배경화면** — Unsplash 컬렉션, 그라데이션, 내 이미지. **시간대 모드**가 아침·낮·저녁·밤에 맞춰 분위기를 바꾸고, 밝은 배경에서는 글자가 자동으로 어두워져요.
- 🎨 **글래스 효과** — 블러, 모서리 둥글기, 독을 조절.
- ↩️ **실수 방지** — 모든 삭제와 레이아웃 변경을 되돌리기(`Ctrl+Z`), 위젯과 페이지의 30일 휴지통, 위험한 작업 전 자동 백업.
- ⌨️ **키보드 단축키** — 기본 제공(`/` 검색, 실행 취소/다시 실행, 페이지 전환) + 원하는 URL을 여는 나만의 조합.
- 🌍 **7개 언어** — English, 日本語, 简体中文, Español, Français, Deutsch, 한국어. 기본값은 지역을 따라요(검색 엔진, 뉴스 에디션, 날씨 도시, 독).
- 🔄 **가져오기 / 내보내기** — 대시보드 전체를 JSON 파일 하나로.
- 🔒 **로컬 우선** — 모든 것이 `chrome.storage.local`에 저장돼요. 백엔드 없음, 분석 없음, 추적 없음.

---

## 🚀 설치

### 릴리스에서 설치(권장)

1. [최신 릴리스](https://github.com/miyabiver39/ZenithTab/releases/latest)에서 `zenith-tab-vX.Y.Z.zip`을 내려받아 압축을 풉니다.
2. `chrome://extensions/`를 열고 오른쪽 위의 **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 클릭하고 압축을 푼 폴더를 선택합니다.
4. 새 탭을 엽니다.

> 수동으로 설치한 확장을 업데이트할 때는 **새 폴더**에 풀어서 다시 로드하세요(또는 확장 카드의 ↻ 클릭). Chrome은 다시 로드할 때만 `manifest.json`을 읽기 때문에, 파일을 덮어쓰기만 하면 권한이 예전 상태로 남아요.

### 소스에서 설치

```bash
git clone https://github.com/miyabiver39/ZenithTab.git
cd ZenithTab
npm install
npm run build      # → dist/
npm run verify     # 패키징된 manifest와 dist/를 대조
```

그다음 위와 같이 `dist/`를 압축해제된 확장으로 로드합니다.

---

## 🔐 권한과 개인정보

| 권한 | 이유 |
| :-- | :-- |
| `storage`, `unlimitedStorage` | 대시보드·메모·캐시를 기기 안에 보관. 사용자 배경화면에 10 MB 제한 없음 |
| `bookmarks` | 북마크 위젯 |
| `alarms` | 백그라운드 피드 갱신 |
| `favicon` | Chrome 로컬 캐시의 사이트 아이콘 — 외부 아이콘 서비스 사용 안 함 |
| `geolocation` | "현재 위치 감지"를 눌렀을 때만 한 번 읽음 |
| 호스트 권한 | 날씨(Open-Meteo), Google 뉴스, Unsplash 배경화면 |
| 선택: `topSites`, `sessions`, `tabs` | 빠른 액세스 위젯을 추가할 때 요청(자주 방문한 사이트, 최근 닫은 탭과 제목) |
| 선택 호스트 권한 | 사용자 RSS 피드나 캘린더를 추가하는 순간 해당 출처만 요청 |

백엔드도, 분석도, 추적도 없어요. [PRIVACY.md](../../PRIVACY.md)에 모든 외부 요청을 적어 두었습니다.

---

## 🛠️ 개발

| 작업 | 명령 |
| :-- | :-- |
| 개발 서버(HMR) | `npm run dev` → http://localhost:5173/newtab.html |
| 빌드 | `npm run build` |
| Lint / 타입 / 단위 테스트 | `npm run lint` · `npm run typecheck` · `npm run test:run` |
| E2E(Playwright) | `npm run test:e2e` |
| 커버리지 | `npm run test:coverage` |
| 릴리스 | `npm run version:bump X.Y.Z` → `npm run package`(개발 서버를 먼저 중지)→ `git push origin main --tags` |

**VS Code**: 저장소에 `.vscode/`가 포함되어 있어요 — `Ctrl+Shift+B`로 빌드, `F5`로 개발 서버를 띄우고 Chrome을 열면 중단점이 동작해요("Debug new tab"). 빌드된 확장을 로드하는 구성("Debug extension")도 있어요. "check all" 작업은 lint → typecheck → 테스트를 순서대로 실행하며 CI와 같은 기준이에요.

`v*` 태그를 푸시하면 ZIP과 SBOM을 빌드하고 GitHub Release를 게시해요.

### 기술 스택

React 19 + TypeScript(strict) · Vite + `@crxjs/vite-plugin` · Tailwind CSS + Lucide 아이콘 · `react-grid-layout` · Zustand · `fast-xml-parser` · Vitest + Testing Library + Playwright

### 프로젝트 구조

```text
src/
├── background/service-worker.ts   # 백그라운드 피드 갱신(chrome.alarms)
├── components/
│   ├── common/                    # Modal, Button, Input, GlassCard, ConfirmDialog, UndoToast
│   ├── layout/                    # Header, Dock, GridContainer, SettingsPanel, 모달
│   └── widgets/                   # 위젯별 폴더 + registry.tsx / widgetDefinitions.ts
├── hooks/                         # useRssFeed, useWeather, useLayoutUndo, …
├── i18n/locales/                  # UI 문자열, 7개 언어
├── services/                      # storage, migrations, rss, weather, calendar, wallpaper, trash, snapshots
├── store/                         # Zustand 스토어 + 실행 취소 스택
├── utils/                         # 파서(RSS, iCal), 스마트 입력, 카운트다운 / 습관 계산 …
└── newtab.tsx                     # 앱 루트
tests/                             # unit / components / e2e
public/_locales/                   # 스토어 등록용 이름과 설명
```

위젯 추가는 레지스트리 항목 하나면 돼요 — [CLAUDE.md](../../CLAUDE.md) §2와 [AGENT.md](../../AGENT.md)를 참고하세요.

---

## 🤝 기여

이슈와 풀 리퀘스트를 환영해요. `main`에서 브랜치를 만들고, Conventional Commits를 사용하고, `npm run lint`, `npm run typecheck`, `npm run test:run`이 통과하는지 확인해 주세요. [변경 이력](../../CHANGELOG.md)은 Keep a Changelog 형식을 따라요.

## 📄 라이선스

[MIT](../../LICENSE)
