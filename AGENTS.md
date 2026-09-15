# ZenithTab (ゼニスタブ) - AI Agent Operational Rules & Context

See [AGENT.md](./AGENT.md) for full architecture and developer specifications.

## Core Rules for AI Assistants
1. **GitHub Flow**: Always branch from `main` (`feature/...`, `fix/...`), ensure tests pass, and keep `main` production-ready.
2. **Version Bumping**: Use `npm run version:bump <version>` to keep `package.json` and `manifest.json` versions synchronized.
3. **i18n Localization**: All UI text must be defined in `src/i18n/locales/` (at least English and Japanese).
4. **Verification**: Always run `npm run typecheck` and `npm run test:run` before completing tasks.
5. **Modern Web & Chrome Extension Guidance**: Follow the `chrome-extensions` and `modern-web-guidance` skills for web standards and Manifest V3 API best practices.
6. **Store Presence**: Whenever you are creating or making changes to the Chrome extension (e.g. permissions, features, or metadata), create and manage the `CHROMEWEBSTORE.md` file using the `chrome-extensions` skill format.
