import { describe, it, expect, beforeEach } from 'vitest';
import { Profiler } from 'react';
import { render, act } from '@testing-library/react';
import { GlassCard } from '../../src/components/common/GlassCard';
import { useTranslation } from '../../src/i18n/i18n';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';

/**
 * GlassCard wraps every widget and useTranslation runs in nearly every
 * component. Both must only re-render for the store fields they read —
 * a clock tick or a note keystroke elsewhere must not repaint the page.
 */
describe('store selectors', () => {
  beforeEach(() => resetDashboardStore());

  it('GlassCard は appearance.borderRadius / glassBlur 以外のストア更新で再描画しないこと', () => {
    // React.Profiler counts commits of the GlassCard subtree; a memoised
    // child would not, so this observes the card itself.
    let commits = 0;
    render(
      <Profiler id="card" onRender={() => commits++}>
        <GlassCard>x</GlassCard>
      </Profiler>
    );
    const before = commits;

    act(() => useDashboardStore.setState((s) => ({ widgets: [...s.widgets] })));
    act(() => useDashboardStore.getState().updateAppearance({ dockPosition: 'top' }));
    expect(commits).toBe(before);

    act(() => useDashboardStore.getState().updateAppearance({ glassBlur: 4 }));
    expect(commits).toBe(before + 1);
  });

  it('useTranslation は言語以外のストア更新で再評価しないこと', () => {
    let renders = 0;
    let lang = '';
    const Probe = () => {
      renders++;
      lang = useTranslation().currentLanguage;
      return null;
    };
    render(<Probe />);
    const before = renders;

    act(() => useDashboardStore.setState((s) => ({ widgets: [...s.widgets] })));
    act(() => useDashboardStore.getState().updateAppearance({ glassBlur: 8 }));
    expect(renders).toBe(before);

    act(() => useDashboardStore.getState().updateAppearance({ language: 'ja' }));
    expect(renders).toBe(before + 1);
    expect(lang).toBe('ja');
  });
});
