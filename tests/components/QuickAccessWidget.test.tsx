import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { QuickAccessWidget } from '../../src/components/widgets/QuickAccessWidget/QuickAccessWidget';
import { WidgetConfigModal } from '../../src/components/layout/WidgetConfigModal';
import { AddWidgetModal } from '../../src/components/layout/AddWidgetModal';
import { quickAccessService } from '../../src/services/quickAccessService';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { chromeMock, installChromeMock, uninstallChromeMock } from '../helpers/chrome';

const base = { defaultView: 'topSites' as const, maxItems: 8 as const, viewMode: 'list' as const, openInNewTab: true };

describe('quickAccessService', () => {
  afterEach(() => {
    installChromeMock();
    vi.restoreAllMocks();
  });

  it('よく見るサイトを http(s) のみ・上限件数で返し、タイトル無しはホスト名にすること', async () => {
    const sites = await quickAccessService.getTopSites(2);
    expect(sites.map((s) => s.title)).toEqual(['YouTube', 'Company Portal']);
    const all = await quickAccessService.getTopSites(10);
    expect(all.map((s) => s.title)).toEqual(['YouTube', 'Company Portal', 'news.example.com']);
    expect(all[0].faviconUrl).toContain('_favicon');
  });

  it('最近閉じたタブをウィンドウも展開して返し、内部URLは除外すること', async () => {
    const items = await quickAccessService.getRecentlyClosed(8);
    expect(items.map((i) => i.sessionId)).toEqual(['s-1', 's-2']);
    expect(items[0]).toMatchObject({ title: 'Closed article', url: 'https://blog.example.com/post', lastModified: 1700000000 });
    expect(chromeMock.sessions.getRecentlyClosed).toHaveBeenCalledWith({ maxResults: 13 });
    expect(await quickAccessService.getRecentlyClosed(1)).toHaveLength(1);
  });

  it('復元は sessions.restore を呼び、成功可否を返すこと', async () => {
    expect(await quickAccessService.restoreSession('s-1')).toBe(true);
    expect(chromeMock.sessions.restore).toHaveBeenCalledWith('s-1');
    chromeMock.sessions.restore.mockRejectedValue(new Error('gone'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await quickAccessService.restoreSession('s-1')).toBe(false);
  });

  it('API が失敗したら空配列を返すこと', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    chromeMock.topSites.get.mockRejectedValue(new Error('x'));
    chromeMock.sessions.getRecentlyClosed.mockRejectedValue(new Error('y'));
    expect(await quickAccessService.getTopSites()).toEqual([]);
    expect(await quickAccessService.getRecentlyClosed()).toEqual([]);
  });

  it('拡張内で権限未許可（API名前空間なし）の場合はモックではなく空配列を返すこと', async () => {
    delete (chromeMock as any).topSites;
    delete (chromeMock as any).sessions;
    try {
      expect(await quickAccessService.getTopSites()).toEqual([]);
      expect(await quickAccessService.getRecentlyClosed()).toEqual([]);
      expect(await quickAccessService.restoreSession('s-1')).toBe(false);
    } finally {
      (chromeMock as any).topSites = { get: vi.fn(() => Promise.resolve([])) };
      (chromeMock as any).sessions = { getRecentlyClosed: vi.fn(() => Promise.resolve([])), restore: vi.fn() };
    }
  });

  it('hasPermission / requestPermission がビュー別（省略時は全部）の権限を問い合わせること', async () => {
    expect(await quickAccessService.hasPermission()).toBe(true);
    expect(chromeMock.permissions.contains).toHaveBeenCalledWith({ permissions: ['topSites', 'sessions', 'tabs'] });
    expect(await quickAccessService.hasPermission('topSites')).toBe(true);
    expect(chromeMock.permissions.contains).toHaveBeenLastCalledWith({ permissions: ['topSites'] });
    // Closed tabs come back without url/title unless `tabs` is granted too.
    expect(await quickAccessService.hasPermission('recentlyClosed')).toBe(true);
    expect(chromeMock.permissions.contains).toHaveBeenLastCalledWith({ permissions: ['sessions', 'tabs'] });
    chromeMock.permissions.request.mockResolvedValue(false);
    expect(await quickAccessService.requestPermission()).toBe(false);
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ permissions: ['topSites', 'sessions', 'tabs'] });
    expect(await quickAccessService.requestPermission('recentlyClosed')).toBe(false);
    expect(chromeMock.permissions.request).toHaveBeenLastCalledWith({ permissions: ['sessions', 'tabs'] });
  });

  it('Chrome API が無い環境ではモックデータにフォールバックし、復元は false になること', async () => {
    uninstallChromeMock();
    expect((await quickAccessService.getTopSites(2)).map((s) => s.title)).toEqual(['YouTube', 'Wikipedia']);
    expect((await quickAccessService.getRecentlyClosed()).length).toBeGreaterThan(0);
    expect(await quickAccessService.restoreSession('s-1')).toBe(false);
  });
});

describe('QuickAccessWidget', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => vi.restoreAllMocks());

  it('既定タブでよく見るサイトをリスト表示すること', async () => {
    render(<QuickAccessWidget widgetId="qa" config={base} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('YouTube')).toBeInTheDocument());
    expect(screen.getByTestId('quickaccess-list')).toBeInTheDocument();
    expect(screen.getByText('youtube.com')).toBeInTheDocument();
    const link = screen.getByText('YouTube').closest('a')!;
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('タブ切替で最近閉じたタブを表示し、クリックでセッションを復元すること', async () => {
    const user = setupUser();
    render(<QuickAccessWidget widgetId="qa" config={base} />);
    await waitFor(() => screen.getByText('YouTube'));
    await user.click(screen.getByText('Recently closed'));
    await waitFor(() => expect(screen.getByText('Closed article')).toBeInTheDocument());

    await user.click(screen.getByText('Closed article'));
    await waitFor(() => expect(chromeMock.sessions.restore).toHaveBeenCalledWith('s-1'));
  });

  it('グリッド表示・件数上限・同一タブで開く設定を反映すること', async () => {
    render(<QuickAccessWidget widgetId="qa" config={{ ...base, viewMode: 'grid', maxItems: 5, openInNewTab: false }} />);
    await waitFor(() => screen.getByText('YouTube'));
    expect(screen.getByTestId('quickaccess-grid')).toBeInTheDocument();
    expect(chromeMock.topSites.get).toHaveBeenCalled();
    expect(screen.getByText('YouTube').closest('a')).not.toHaveAttribute('target');
  });

  it('既定タブを最近閉じたタブにでき、空なら案内を出すこと', async () => {
    chromeMock.sessions.getRecentlyClosed.mockResolvedValue([]);
    render(<QuickAccessWidget widgetId="qa" config={{ ...base, defaultView: 'recentlyClosed' }} />);
    await waitFor(() => expect(screen.getByText('No recently closed tabs.')).toBeInTheDocument());
  });

  it('権限が未許可なら案内と許可ボタンを出し、許可後にデータを読み込むこと', async () => {
    const user = setupUser();
    chromeMock.permissions.contains.mockResolvedValue(false);
    render(<QuickAccessWidget widgetId="qa" config={base} />);
    await waitFor(() => expect(screen.getByText('Allow Quick Access')).toBeInTheDocument());
    expect(screen.getByText(/needs permission/)).toBeInTheDocument();
    expect(chromeMock.topSites.get).not.toHaveBeenCalled();

    chromeMock.permissions.request.mockImplementation(() => {
      chromeMock.permissions.contains.mockResolvedValue(true);
      return Promise.resolve(true);
    });
    await user.click(screen.getByText('Allow Quick Access'));
    await waitFor(() => expect(screen.getByText('YouTube')).toBeInTheDocument());
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ permissions: ['topSites'] });
  });

  it('topSites と sessions だけ許可済み（旧バージョン）でも、最近閉じたタブを開いたときだけ tabs を求めること', async () => {
    const user = setupUser();
    const granted = new Set(['topSites', 'sessions']);
    chromeMock.permissions.contains.mockImplementation(({ permissions = [] }: { permissions?: string[] }) =>
      Promise.resolve(permissions.every((p) => granted.has(p)))
    );
    chromeMock.permissions.request.mockImplementation(({ permissions = [] }: { permissions?: string[] }) => {
      permissions.forEach((p) => granted.add(p));
      return Promise.resolve(true);
    });
    render(<QuickAccessWidget widgetId="qa" config={base} />);
    await waitFor(() => screen.getByText('YouTube'));
    expect(chromeMock.permissions.request).not.toHaveBeenCalled();

    await user.click(screen.getByText('Recently closed'));
    await waitFor(() => screen.getByText('Allow Quick Access'));
    await user.click(screen.getByText('Allow Quick Access'));
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ permissions: ['sessions', 'tabs'] });
    await waitFor(() => expect(screen.getByText('Closed article')).toBeInTheDocument());
  });

  it('許可を拒否されたら案内のままであること', async () => {
    const user = setupUser();
    chromeMock.permissions.contains.mockResolvedValue(false);
    chromeMock.permissions.request.mockResolvedValue(false);
    render(<QuickAccessWidget widgetId="qa" config={base} />);
    await waitFor(() => screen.getByText('Allow Quick Access'));
    await user.click(screen.getByText('Allow Quick Access'));
    await waitFor(() => expect(chromeMock.permissions.request).toHaveBeenCalled());
    expect(screen.getByText('Allow Quick Access')).toBeInTheDocument();
  });

  it('更新ボタンで再取得すること', async () => {
    const user = setupUser();
    render(<QuickAccessWidget widgetId="qa" config={base} />);
    await waitFor(() => screen.getByText('YouTube'));
    await user.click(screen.getByTitle('Refresh'));
    await waitFor(() => expect(chromeMock.topSites.get).toHaveBeenCalledTimes(2));
  });

  it('ファビコン読み込み失敗時はプレースホルダに差し替わること', async () => {
    const { container } = render(<QuickAccessWidget widgetId="qa" config={base} />);
    await waitFor(() => screen.getByText('YouTube'));
    const img = container.querySelector('img')!;
    fireEvent.error(img);
    expect(container.querySelectorAll('img').length).toBeLessThan(3);
  });
});

describe('Quick Access in catalogue and config modal', () => {
  beforeEach(() => resetDashboardStore());

  it('カタログから追加でき、設定モーダルで各項目を保存できること', async () => {
    const user = setupUser();
    act(() => useDashboardStore.getState().openSettingsModal('addWidget'));
    const { unmount } = render(<AddWidgetModal />);
    await user.click(within(screen.getByTestId('widget-card-quickaccess')).getByRole('button', { name: 'Add Widget' }));
    unmount();

    const added = useDashboardStore.getState().widgets.at(-1)!;
    expect(added.type).toBe('quickaccess');
    // Adding the widget is the user gesture that asks for its optional permissions.
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ permissions: ['topSites', 'sessions', 'tabs'] });
    expect(added.config).toMatchObject({ defaultView: 'topSites', maxItems: 8, viewMode: 'list', openInNewTab: true });

    act(() => useDashboardStore.getState().openSettingsModal('editWidget', added.id));
    render(<WidgetConfigModal />);
    await user.click(screen.getByText('Recently closed'));
    await user.click(screen.getByText('12'));
    await user.click(screen.getByText('Grid'));
    await user.click(screen.getByRole('checkbox', { name: 'Open in a new tab' }));
    await user.click(screen.getByText('Save Changes'));

    const saved = useDashboardStore.getState().widgets.find((w) => w.id === added.id)!;
    expect(saved.config).toMatchObject({ defaultView: 'recentlyClosed', maxItems: 12, viewMode: 'grid', openInNewTab: false });
  });
});
