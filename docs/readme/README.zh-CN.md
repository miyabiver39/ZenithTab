<div align="center">

<img src="../../public/icons/icon128.png" width="96" height="96" alt="ZenithTab 图标" />

# ZenithTab

**快速、美观、可深度定制的 Google Chrome 新标签页仪表盘。**

拖放式小部件、毛玻璃界面、动态壁纸、7 种语言 —— 本地优先,无需账号,不跟踪。

[![Build and Test](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml/badge.svg)](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/miyabiver39/ZenithTab?label=release&color=0ea5e9)](https://github.com/miyabiver39/ZenithTab/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)](../../manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](../../tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19-20232a.svg?logo=react&logoColor=61dafb)](../../package.json)
[![i18n](https://img.shields.io/badge/i18n-7_languages-8b5cf6.svg)](../../src/i18n/locales)
[![Tests](https://img.shields.io/badge/tests-Vitest_%2B_Playwright-6e9f18.svg)](../../tests)

[**安装**](#-安装) · [**功能**](#-功能) · [**开发**](#️-开发) · [**更新日志**](../../CHANGELOG.md) · [**隐私**](../../PRIVACY.md)

[English](../../README.md) · [日本語](README.ja.md) · **简体中文** · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [한국어](README.ko.md)

<img src="../../store-assets/screenshot_1_1280x800.png" width="880" alt="ZenithTab 仪表盘" />

</div>

---

## ✨ 功能

### 小部件

| 小部件 | 作用 |
| :-- | :-- |
| 🔍 **快速搜索** | 多引擎搜索栏(Google、Bing、DuckDuckGo、GitHub、YouTube、ChatGPT + 自定义)。**智能回答**即时显示: `120*1.1`、`20% of 150`、`10 km to mi`、`0xff`、`2d6`、`coin`、`random 1-100`、`choose a, b, c`、`days until 2026-12-31`。 |
| 🌐 **快捷方式** | 常用网站磁贴,图标来自 Chrome 自身的缓存。 |
| ⏰ **时钟** | 数字 / 模拟 / 极简,秒、日期、时区。 |
| 🌤️ **天气** | 当前天气与 3 天预报(Open-Meteo),可一键检测位置。 |
| 🔖 **书签** | 浏览和搜索 Chrome 书签,包含文件夹。 |
| 📰 **新闻与 RSS** | Google 新闻(头条、主题、关键词搜索)或任意 RSS/Atom 源,后台刷新。 |
| ⏱️ **专注计时器** | 番茄钟,短/长休息与会话计数。 |
| ✅ **任务** | 带筛选的简单待办,删除可撤销。 |
| 📝 **快速笔记** | 多页 Markdown 便签。 |
| 🖼️ **网页嵌入** | 用 iframe 嵌入任意页面或工具,拒绝嵌入的站点显示回退卡片。 |
| ⚡ **快速访问** | Chrome 的常访问网站与最近关闭的标签页(可原地恢复)。 |
| 📱 **二维码** | 将网址、电话或文本转成二维码 —— 把链接发到手机。 |
| ⏳ **倒计时** | 距离生日、旅行、考试或截止日期的天数,支持每年重复。 |
| 🔥 **习惯打卡** | 每天勾选习惯,保持连续记录。 |
| 📅 **日历** | 通过 iCal(.ics)链接显示今天和近期的日程 —— Google 日历、Outlook、Apple。 |

### 仪表盘

- 🧩 **自由网格布局** —— 在响应式网格上拖动、缩放、排列小部件;小部件最小可缩到 2 列。
- 📑 **多页面** —— 独立的仪表盘(工作 / 家庭 / …),用 `Ctrl+Alt+←/→` 切换。
- 🖼️ **壁纸** —— Unsplash 图集、渐变或自己的图片;**时段模式**随早晨、白天、傍晚、夜晚切换风格;浅色壁纸上文字自动变深。
- 🎨 **毛玻璃** —— 调整模糊、圆角和 Dock。
- ↩️ **防误操作** —— 所有删除与布局更改均可撤销(`Ctrl+Z`),小部件和页面有 30 天回收站,危险操作前自动备份。
- ⌨️ **键盘快捷键** —— 内置(`/` 搜索、撤销/重做、切换页面)加上自定义组合键打开任意网址。
- 🌍 **7 种语言** —— English、日本語、简体中文、Español、Français、Deutsch、한국어;默认值随地区变化(搜索引擎、新闻版本、天气城市、Dock)。
- 🔄 **导入 / 导出** —— 整个仪表盘导出为一个 JSON 文件。
- 🔒 **本地优先** —— 一切都存放在 `chrome.storage.local`。没有后端、没有统计、没有跟踪。

---

## 🚀 安装

### 从发布版安装(推荐)

1. 从[最新发布](https://github.com/miyabiver39/ZenithTab/releases/latest)下载 `zenith-tab-vX.Y.Z.zip` 并解压。
2. 打开 `chrome://extensions/`,开启右上角的**开发者模式**。
3. 点击**加载已解压的扩展程序**,选择解压后的文件夹。
4. 打开一个新标签页。

> 更新侧载安装时,请把新版本解压到**新的文件夹**再加载(或点击扩展卡片上的 ↻)。Chrome 只在重新加载时读取 `manifest.json`,原地覆盖文件会导致权限停留在旧版本。

### 从源码安装

```bash
git clone https://github.com/miyabiver39/ZenithTab.git
cd ZenithTab
npm install
npm run build      # → dist/
npm run verify     # 校验打包后的 manifest 与 dist/
```

然后按上述步骤加载 `dist/`。

---

## 🔐 权限与隐私

| 权限 | 用途 |
| :-- | :-- |
| `storage`, `unlimitedStorage` | 仪表盘、笔记和缓存保存在你的设备上;自定义壁纸不受 10 MB 限制 |
| `bookmarks` | 书签小部件 |
| `alarms` | 后台刷新订阅源 |
| `favicon` | 从 Chrome 本地缓存获取网站图标 —— 不使用第三方图标服务 |
| `geolocation` | 仅在点击“检测当前位置”时读取一次 |
| 主机权限 | 天气(Open-Meteo)、Google 新闻、Unsplash 壁纸 |
| 可选: `topSites`, `sessions`, `tabs` | 添加快速访问小部件时请求(常访问网站、最近关闭的标签页及其标题) |
| 可选主机权限 | 添加自定义 RSS 源或日历时,按来源逐个请求 |

没有后端、没有统计、没有跟踪。[PRIVACY.md](../../PRIVACY.md) 列出了所有对外请求。

---

## 🛠️ 开发

| 任务 | 命令 |
| :-- | :-- |
| 开发服务器(HMR) | `npm run dev` → http://localhost:5173/newtab.html |
| 构建 | `npm run build` |
| Lint / 类型 / 单元测试 | `npm run lint` · `npm run typecheck` · `npm run test:run` |
| E2E(Playwright) | `npm run test:e2e` |
| 覆盖率 | `npm run test:coverage` |
| 发布 | `npm run version:bump X.Y.Z` → `npm run package`(先停止开发服务器)→ `git push origin main --tags` |

**VS Code**: 仓库自带 `.vscode/` —— `Ctrl+Shift+B` 构建,`F5` 启动开发服务器并打开 Chrome,断点可用(“Debug new tab”),或加载已构建的扩展(“Debug extension”)。“check all” 任务依次运行 lint → typecheck → 测试,与 CI 使用相同的门槛。

推送 `v*` 标签会构建 ZIP 与 SBOM 并发布 GitHub Release。

### 技术栈

React 19 + TypeScript(strict)· Vite + `@crxjs/vite-plugin` · Tailwind CSS + Lucide 图标 · `react-grid-layout` · Zustand · `fast-xml-parser` · Vitest + Testing Library + Playwright

### 项目结构

```text
src/
├── background/service-worker.ts   # 后台订阅源刷新(chrome.alarms)
├── components/
│   ├── common/                    # Modal, Button, Input, GlassCard, ConfirmDialog, UndoToast
│   ├── layout/                    # Header, Dock, GridContainer, SettingsPanel, 各种弹窗
│   └── widgets/                   # 每个小部件一个文件夹 + registry.tsx / widgetDefinitions.ts
├── hooks/                         # useRssFeed, useWeather, useLayoutUndo, …
├── i18n/locales/                  # 界面文案,7 种语言
├── services/                      # storage, migrations, rss, weather, calendar, wallpaper, trash, snapshots
├── store/                         # Zustand 状态 + 撤销栈
├── utils/                         # 解析器(RSS, iCal)、智能输入、倒计时 / 习惯计算 …
└── newtab.tsx                     # 应用根组件
tests/                             # unit / components / e2e
public/_locales/                   # 商店页面的名称与描述
```

新增小部件只需在注册表中登记 —— 见 [CLAUDE.md](../../CLAUDE.md) §2 与 [AGENT.md](../../AGENT.md)。

---

## 🤝 参与贡献

欢迎 Issue 和 Pull Request。请从 `main` 建分支,使用 Conventional Commits,并确保 `npm run lint`、`npm run typecheck`、`npm run test:run` 通过。[更新日志](../../CHANGELOG.md)遵循 Keep a Changelog。

## 📄 许可证

[MIT](../../LICENSE)
