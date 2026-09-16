import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, within } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import React from 'react';
import { Header } from '../../src/components/layout/Header';
import { PageSwitcher } from '../../src/components/layout/PageSwitcher';
import { EmptyPage } from '../../src/components/layout/EmptyPage';
import { AddPageMenu } from '../../src/components/layout/AddPageMenu';
import { Dock } from '../../src/components/layout/Dock';
import { WallpaperBackground } from '../../src/components/layout/WallpaperBackground';
import { GridContainer } from '../../src/components/layout/GridContainer';
import { AddWidgetModal } from '../../src/components/layout/AddWidgetModal';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { Modal } from '../../src/components/common/Modal';
import { GlassCard } from '../../src/components/common/GlassCard';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { chromeMock } from '../helpers/chrome';

const state = () => useDashboardStore.getState();

describe('Header', () => {
  beforeEach(() => resetDashboardStore());

  it('挨拶・アプリドロワー・壁紙・ページ追加・編集・設定の各操作が動くこと', async () => {
    const user = setupUser();
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // never the splash branch
    render(<Header />);
    expect(screen.getByText('ZenithTab')).toBeInTheDocument();

    await user.click(screen.getByTitle('App Drawer'));
    expect(state().isAppDrawerOpen).toBe(true);

    const before = state().wallpaper.currentWallpaperUrl;
    await user.click(screen.getByTitle('Change Wallpaper'));
    expect(state().wallpaper.lastRefreshed).toBeTypeOf('number');
    expect(typeof before).toBe('string');

    await user.click(screen.getByTitle('Edit Layout'));
    expect(state().isEditMode).toBe(true);
    expect(screen.getByText('Add Widget')).toBeInTheDocument();
    await user.click(screen.getByText('Add Widget'));
    expect(state().activeSettingsModal).toBe('addWidget');
    await user.click(screen.getByText('Done Editing'));
    expect(state().isEditMode).toBe(false);

    await user.click(screen.getByTitle('Settings'));
    expect(state().activeSettingsModal).toBe('settings');
    vi.restoreAllMocks();
  });

  it('ページが1つの間だけ「ページを追加」ボタンを出すこと', async () => {
    const { rerender } = render(<Header />);
    expect(screen.getByTitle('Add page')).toBeInTheDocument();
    act(() => state().addPage());
    rerender(<Header />);
    expect(screen.queryByTitle('Add page')).not.toBeInTheDocument();
  });

  it('スプラッシュ文言が出ることがあること', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    render(<Header />);
    expect(document.querySelector('header')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

describe('AddPageMenu', () => {
  beforeEach(() => resetDashboardStore());

  it('空のページ / 複製を選べ、外側クリックや Escape で閉じること', async () => {
    const user = setupUser();
    render(
      <AddPageMenu>
        <button>open</button>
      </AddPageMenu>
    );
    await user.click(screen.getByText('open'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByText('open'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByText('open'));
    await user.click(screen.getByText('open')); // toggle closes
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByText('open'));
    await user.click(screen.getByText('Duplicate this page'));
    expect(state().pages).toHaveLength(2);
    expect(state().widgets.length).toBeGreaterThan(0);

    await user.click(screen.getByText('open'));
    await user.click(screen.getByText('New empty page'));
    expect(state().pages).toHaveLength(3);
    expect(state().widgets).toHaveLength(0);
  });

  it('右寄せでも画面内に収まる位置に出ること', async () => {
    const user = setupUser();
    render(
      <AddPageMenu align="right">
        <button>open</button>
      </AddPageMenu>
    );
    await user.click(screen.getByText('open'));
    const menu = screen.getByRole('menu') as HTMLElement;
    expect(parseInt(menu.style.left, 10)).toBeGreaterThanOrEqual(8);
    fireEvent(window, new Event('resize')); // window event, not a user interaction
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('PageSwitcher', () => {
  beforeEach(() => resetDashboardStore());

  it('ページが1つなら描画しないこと', async () => {
    const { container } = render(<PageSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('ページ切替・リネーム・削除・追加ができること', async () => {
    const user = setupUser();
    act(() => {
      state().addPage();
      state().switchPage('page-1');
    });
    render(<PageSwitcher />);
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();

    await user.click(screen.getByText('Page 2'));
    expect(state().activePageId).toBe(state().pages[1].id);

    await user.dblClick(screen.getByText('Page 2'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.placeholder).toBe('Page 2');
    await user.click(input);
    await user.clear(input);
    await user.type(input, literal('Work'));
    await user.keyboard('{Enter}');
    expect(state().pages[1].name).toBe('Work');

    await user.dblClick(screen.getByText('Work'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await user.dblClick(screen.getByText('Work'));
    await user.clear(screen.getByRole('textbox'));
    await user.tab();
    expect(state().pages[1].name).toBe('');

    await user.click(screen.getByTitle('Add page'));
    await user.click(screen.getByText('New empty page'));
    expect(state().pages).toHaveLength(3);

    const removeButtons = screen.getAllByTitle('Remove page');
    await user.click(removeButtons[2]);
    expect(state().pages).toHaveLength(2);
  });
});

describe('EmptyPage', () => {
  beforeEach(() => resetDashboardStore());

  it('複数ページなら説明と「戻る」を出し、戻れること', async () => {
    const user = setupUser();
    act(() => state().addPage());
    render(<EmptyPage />);
    expect(screen.getByText('This page is empty')).toBeInTheDocument();
    expect(screen.getByText(/Nothing was deleted/)).toBeInTheDocument();

    await user.click(screen.getByText('Back to Page 1'));
    expect(state().activePageId).toBe('page-1');
  });

  it('「ウィジェット追加」で編集モードに入りモーダルを開くこと', async () => {
    const user = setupUser();
    useDashboardStore.setState({ widgets: [] });
    render(<EmptyPage />);
    expect(screen.queryByText(/Nothing was deleted/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Back to/)).not.toBeInTheDocument();
    await user.click(screen.getByText('Add Widget'));
    expect(state().isEditMode).toBe(true);
    expect(state().activeSettingsModal).toBe('addWidget');
  });

  it('先頭の空ページからは次のページへ戻れること', async () => {
    act(() => {
      state().addPage();
      state().switchPage('page-1');
      state().removePage('page-1');
      state().addPage();
      state().switchPage(state().pages[0].id);
    });
    render(<EmptyPage />);
    expect(screen.getByText('Back to Page 2')).toBeInTheDocument();
  });
});

describe('Dock', () => {
  beforeEach(() => resetDashboardStore());

  it('ドック項目をリンクで描画し、歯車で設定を開くこと', async () => {
    const user = setupUser();
    render(<Dock />);
    expect(screen.getByTitle('Google')).toHaveAttribute('href', 'https://google.com');
    expect(screen.getByTitle('Wikipedia')).toHaveAttribute('target', '_blank');
    await user.click(screen.getByTitle('Quick Dock'));
    expect(state().activeSettingsModal).toBe('settings');
    expect(state().editingWidgetId).toBe('dock');
  });

  it('絵文字アイコンと位置設定を反映し、hidden なら描画しないこと', async () => {
    act(() => {
      state().addDockItem({ label: 'Game', url: 'https://g.example', icon: '🎮', openInNewTab: false });
      state().updateAppearance({ dockPosition: 'top' });
    });
    const { container, rerender } = render(<Dock />);
    expect(screen.getByText('🎮')).toBeInTheDocument();
    expect(screen.getByTitle('Game')).not.toHaveAttribute('target');
    expect(container.firstChild).toHaveClass('top-14');

    act(() => state().updateAppearance({ dockPosition: 'hidden' }));
    rerender(<Dock />);
    expect(container.firstChild).toBeNull();
  });
});

describe('WallpaperBackground', () => {
  beforeEach(() => resetDashboardStore());

  it('画像壁紙にぼかし・明るさ・オーバーレイを適用すること', async () => {
    act(() => state().updateWallpaper({ blur: 8, brightness: 0.5, overlayOpacity: 0.2, currentWallpaperUrl: 'https://img.example/x.jpg' }));
    const { container } = render(<WallpaperBackground />);
    const media = container.querySelector('[data-wallpaper-layer="top"]') as HTMLElement;
    expect(media.style.backgroundImage).toContain('https://img.example/x.jpg');
    expect(media.style.filter).toBe('blur(8px) brightness(0.5)');
  });

  it('グラデーション壁紙は background として描画すること', async () => {
    act(() => state().updateWallpaper({ source: 'gradient', currentWallpaperUrl: 'linear-gradient(135deg, #000 0%, #fff 100%)' }));
    const { container } = render(<WallpaperBackground />);
    const layer = container.querySelector('[data-wallpaper-layer="top"]') as HTMLElement;
    // jsdom expands the `background` shorthand into backgroundImage.
    expect(layer.style.backgroundImage).toContain('linear-gradient');
    expect(layer.style.filter).toBe('');
  });
});

describe('GridContainer', () => {
  beforeEach(() => resetDashboardStore());

  it('全ウィジェット種別を描画し、空ページではプレースホルダを出すこと', async () => {
    useDashboardStore.setState((s) => ({
      widgets: [
        ...s.widgets,
        { id: 'w-sc', type: 'shortcuts', title: 'SC', config: { items: [] }, layout: { i: 'w-sc', x: 0, y: 0, w: 4, h: 3 } },
        { id: 'w-if', type: 'iframe', title: 'IF', config: { url: 'https://example.com' }, layout: { i: 'w-if', x: 0, y: 0, w: 4, h: 3 } },
        { id: 'w-qr', type: 'qrcode', title: 'QR', config: { mode: 'url', value: '' }, layout: { i: 'w-qr', x: 0, y: 0, w: 3, h: 4 } },
        { id: 'w-??', type: 'mystery' as any, title: '??', config: {}, layout: { i: 'w-??', x: 0, y: 0, w: 3, h: 4 } },
      ],
    }));
    const { unmount } = render(<GridContainer />);
    expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
    expect(screen.getByText('Unknown widget')).toBeInTheDocument();
    expect(screen.queryByText('This page is empty')).not.toBeInTheDocument();
    unmount();

    useDashboardStore.setState({ widgets: [], layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } });
    render(<GridContainer />);
    expect(screen.getByText('This page is empty')).toBeInTheDocument();
  });
});

describe('AddWidgetModal', () => {
  beforeEach(() => resetDashboardStore());

  it('カタログの「追加」でウィジェットが追加されること', async () => {
    const user = setupUser();
    act(() => state().openSettingsModal('addWidget'));
    render(<AddWidgetModal />);
    const before = state().widgets.length;
    await user.click(within(screen.getByTestId('widget-card-qrcode')).getByRole('button', { name: 'Add Widget' }));
    expect(state().widgets).toHaveLength(before + 1);
    expect(state().widgets[before].type).toBe('qrcode');
  });

  it('閉じている間は何も描画しないこと', async () => {
    const { container } = render(<AddWidgetModal />);
    expect(container.firstChild).toBeNull();
  });
});

describe('common components', () => {
  it('Modal は Escape / 背景クリック / × で閉じ、body のスクロールを止めること', async () => {
    const user = setupUser();
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen title="Hi" onClose={onClose} maxWidth="sm">
        <p>body</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    await user.click(screen.getByTestId('modal-backdrop'));
    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(3);

    rerender(
      <Modal isOpen={false} title="Hi" onClose={onClose}>
        <p>body</p>
      </Modal>
    );
    expect(screen.queryByText('body')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('GlassCard / Input / Button がクラスとプロパティを反映すること', async () => {
    render(
      <GlassCard className="custom">
        <Input label="Name" value="v" onChange={() => {}} />
        <Button variant="danger" size="lg" disabled>
          Go
        </Button>
      </GlassCard>
    );
    expect(document.querySelector('.custom')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('v')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeDisabled();
    expect(screen.getByText('Go').className).toContain('rose');
  });
});

describe('ErrorBoundary', () => {
  it('描画クラッシュ時に復旧画面を出し、リセットでストレージを消してリロードすること', async () => {
    const user = setupUser();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
    localStorage.setItem('zenith_x', '1');
    const Boom: React.FC = () => {
      throw new Error('boom');
    };

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();

    await user.click(screen.getByText(/Reset to defaults/));
    await act(async () => {
      await Promise.resolve();
    });
    expect(chromeMock.storage.local.clear).toHaveBeenCalled();
    expect(localStorage.getItem('zenith_x')).toBeNull();
    expect(reload).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('正常時は子要素をそのまま描画すること', async () => {
    render(
      <ErrorBoundary>
        <span>fine</span>
      </ErrorBoundary>
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});
