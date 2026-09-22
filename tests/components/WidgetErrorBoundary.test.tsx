import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { WidgetErrorBoundary } from '../../src/components/widgets/WidgetErrorBoundary';
import { GridContainer } from '../../src/components/layout/GridContainer';
import * as registry from '../../src/components/widgets/registry';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';

const state = () => useDashboardStore.getState();

const widget = (config: Record<string, any> = {}) =>
  ({ id: 'w-crash', type: 'clock' as const, title: 'Clock', config, layout: { i: 'w-crash', x: 0, y: 0, w: 4, h: 2 } });

/** Throws on render whenever `config.explode` is true; renders "ok" otherwise. */
const Flaky: React.FC<{ widgetId: string; config: any }> = ({ config }) => {
  if (config.explode) throw new Error('boom');
  return <div>ok</div>;
};

describe('WidgetErrorBoundary', () => {
  beforeEach(() => {
    resetDashboardStore();
    // The boundary logs via console.error; React also logs the caught
    // error itself — both are expected noise for this test.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('クラッシュしたら代替カードを出し、他は道連れにしないこと', () => {
    render(
      <div>
        <div data-testid="sibling">alive</div>
        <WidgetErrorBoundary widget={widget({ explode: true })}>
          <Flaky widgetId="w-crash" config={{ explode: true }} />
        </WidgetErrorBoundary>
      </div>
    );
    expect(screen.getByTestId('sibling')).toHaveTextContent('alive');
    expect(screen.getByTestId('widget-crash-fallback')).toBeInTheDocument();
    expect(screen.getByText('"Clock" couldn\'t be loaded')).toBeInTheDocument();
    expect(screen.queryByText('ok')).not.toBeInTheDocument();
  });

  it('代替カードの「設定」「削除」がストアの操作を呼ぶこと', async () => {
    const user = setupUser();
    useDashboardStore.setState({ widgets: [widget({ explode: true })] });
    render(
      <WidgetErrorBoundary widget={state().widgets[0]}>
        <Flaky widgetId="w-crash" config={{ explode: true }} />
      </WidgetErrorBoundary>
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(state().activeSettingsModal).toBe('editWidget');
    expect(state().editingWidgetId).toBe('w-crash');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(state().widgets).toHaveLength(0);
  });

  it('config が変わるまでは再レンダリングのたびにフォールバックを保ち、変わったら再試行すること', () => {
    const { rerender } = render(
      <WidgetErrorBoundary widget={widget({ explode: true })}>
        <Flaky widgetId="w-crash" config={{ explode: true }} />
      </WidgetErrorBoundary>
    );
    expect(screen.getByTestId('widget-crash-fallback')).toBeInTheDocument();

    // An unrelated parent re-render (same config content, but the outer
    // GridContainer always creates a fresh element) must not retry.
    rerender(
      <WidgetErrorBoundary widget={widget({ explode: true })}>
        <Flaky widgetId="w-crash" config={{ explode: true }} />
      </WidgetErrorBoundary>
    );
    expect(screen.getByTestId('widget-crash-fallback')).toBeInTheDocument();

    // The config object itself changes (settings fixed) → retried.
    rerender(
      <WidgetErrorBoundary widget={widget({ explode: false })}>
        <Flaky widgetId="w-crash" config={{ explode: false }} />
      </WidgetErrorBoundary>
    );
    expect(screen.queryByTestId('widget-crash-fallback')).not.toBeInTheDocument();
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});

describe('GridContainer › ウィジェットのクラッシュ分離', () => {
  beforeEach(() => {
    resetDashboardStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('1つのウィジェットが例外を投げても他のウィジェットは描画され続けること', () => {
    const real = registry.getWidgetDefinition;
    vi.spyOn(registry, 'getWidgetDefinition').mockImplementation((type) => {
      if (type === 'crash-test') {
        return { type: 'crash-test' as any, size: { w: 1, h: 1, minW: 1, minH: 1 }, icon: () => null, color: '', Component: Flaky } as any;
      }
      return real(type);
    });

    useDashboardStore.setState((s) => ({
      widgets: [
        ...s.widgets,
        { id: 'w-crash', type: 'crash-test' as any, title: 'Boom', config: { explode: true }, layout: { i: 'w-crash', x: 0, y: 0, w: 3, h: 2 } },
      ],
    }));

    render(<GridContainer />);
    expect(screen.getByTestId('widget-crash-fallback')).toBeInTheDocument();
    // The stock clock widget on the same grid rendered normally.
    expect(screen.getByText('Explore ZenithTab settings')).toBeInTheDocument();
  });
});
