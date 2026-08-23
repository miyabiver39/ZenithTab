---
name: zenith-workflow
description: Comprehensive development and release workflow guide for ZenithTab Chrome Extension. Use when adding new widgets, fixing bugs, testing, or preparing new version releases.
---

# ZenithTab Workflow Skill

Use this skill when developing, refactoring, or releasing features in ZenithTab.

## Procedure 1: Adding a New Widget

When creating a new widget (e.g. `CalculatorWidget`):

1. **Define Types (`src/types/widget.ts`)**:
   - Add widget name to `WidgetType` union.
   - Define interface `XYZWidgetConfig extends BaseWidgetConfig`.
   - Add to `WidgetConfig` union.

2. **Add Default Configs (`src/store/useDashboardStore.ts`)**:
   - Register default size in `DEFAULT_WIDGET_SIZES`.
   - Register default config in `DEFAULT_CONFIGS_BY_TYPE`.

3. **Implement Widget Component (`src/components/widgets/XYZWidget/XYZWidget.tsx`)**:
   - Wrap interactive elements with i18n via `useTranslation()`.
   - Use `WidgetWrapper` in `GridContainer.tsx`.

4. **Register in Add Widget Catalog (`src/components/layout/AddWidgetModal.tsx`)**:
   - Add catalog card entry with Lucide icon and i18n description.

5. **Register in Config Modal (`src/components/layout/WidgetConfigModal.tsx`)**:
   - Provide custom form controls to configure the widget's properties.

6. **Add Unit / Component Test (`tests/components/XYZWidget.test.tsx`)**:
   - Ensure widget renders cleanly and handles state changes.

---

## Procedure 2: Running Verification

Always run the full test and verification suite before committing:

```bash
npm run typecheck
npm run test:run
npm run build
```

---

## Procedure 3: Creating a Release (GitHub Flow)

1. Ensure you are on `main` branch with all tests passing.
2. Run the automated version bump:
   ```bash
   npm run version:bump <new-version> # e.g. 1.0.1 or 1.1.0
   ```
3. Push main branch and tags:
   ```bash
   git push origin main --tags
   ```
4. GitHub Actions will automatically:
   - Build production assets in `.github/workflows/release.yml`.
   - Create a GitHub Release with the tag name.
   - Attach `zenith-tab-v<version>.zip` ready for Chrome Web Store upload.
