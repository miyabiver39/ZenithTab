import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { setupUser, literal } from '../helpers/user';
import { SettingsPanel } from '../../src/components/layout/SettingsPanel';
import { AppDrawerModal } from '../../src/components/layout/AppDrawerModal';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { wallpaperService } from '../../src/services/wallpaperService';
import { resetDashboardStore } from '../helpers/store';

const state = () => useDashboardStore.getState();

let mounted: ReturnType<typeof render> | null = null;

// One panel at a time so re-opening within a test never double-renders.
function openSettings(tab?: 'dock') {
  mounted?.unmount();
  act(() => state().openSettingsModal('settings', tab));
  mounted = render(<SettingsPanel />);
  return mounted;
}

describe('SettingsPanel', () => {
  beforeEach(() => resetDashboardStore());
  afterEach(() => {
    mounted = null;
    vi.restoreAllMocks();
  });

  it('閉じている間は描画しないこと', async () => {
    const { container } = render(<SettingsPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('壁紙タブ: ソース切替・カテゴリ・グラデーション・スライダーが store に反映されること', async () => {
    const user = setupUser();
    openSettings();
    expect(screen.getByText('ZenithTab Settings')).toBeInTheDocument();

    await user.click(screen.getByText('Gradient'));
    expect(state().wallpaper.source).toBe('gradient');
    expect(state().wallpaper.currentWallpaperUrl).toContain('linear-gradient');

    await user.click(screen.getByText('Custom File'));
    expect(state().wallpaper.source).toBe('custom');

    await user.click(screen.getByText('Unsplash HD'));
    expect(state().wallpaper.source).toBe('unsplash');
    await user.click(screen.getByText('Nature & Earth'));
    expect(state().wallpaper.category).toBe('nature');

    // user-event can't drag a range input; change it directly.
    fireEvent.change(screen.getByLabelText('Wallpaper Blur'), { target: { value: '10' } });
    expect(state().wallpaper.blur).toBe(10);
  });

  it('壁紙タブ: 画像アップロードが縮小処理を経て保存されること', async () => {
    const user = setupUser();
    vi.spyOn(wallpaperService, 'prepareUploadedWallpaper').mockResolvedValue('data:image/jpeg;base64,xyz');
    openSettings();
    await user.click(screen.getByText('Custom File'));
    const file = new File(['img'], 'wall.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Choose Local Image File'), file);
    await waitFor(() => expect(state().wallpaper.currentWallpaperUrl).toBe('data:image/jpeg;base64,xyz'));
    expect(state().wallpaper.source).toBe('custom');
  });

  it('外観タブ: ドック位置・角丸・ガラス設定を変更できること', async () => {
    const user = setupUser();
    const { container } = openSettings();
    await user.click(screen.getByText('Glass & Appearance'));
    await user.click(screen.getByText('Top'));
    expect(state().appearance.dockPosition).toBe('top');
    await user.click(screen.getByText('Hidden'));
    expect(state().appearance.dockPosition).toBe('hidden');

    const sliders = container.querySelectorAll('input[type="range"]');
    if (sliders.length > 0) {
      fireEvent.change(sliders[0], { target: { value: '24' } }); // range input
      expect(state().appearance.glassBlur).toBe(24);
    }
  });

  it('言語タブ: 言語を切り替えると UI が追従すること', async () => {
    const user = setupUser();
    openSettings();
    await user.click(screen.getByText('Language'));
    await user.click(screen.getByText('日本語'));
    expect(state().appearance.language).toBe('ja');
    expect(screen.getByText('ZenithTab 設定')).toBeInTheDocument();
  });

  it('ドックタブ: 項目の追加・並べ替え・削除ができること', async () => {
    const user = setupUser();
    openSettings('dock');
    expect(screen.getByPlaceholderText('e.g. Notion')).toBeInTheDocument();
    const initial = state().dockItems.length;

    await user.clear(screen.getByPlaceholderText('e.g. Notion'));

    await user.type(screen.getByPlaceholderText('e.g. Notion'), literal('Notion'));
    await user.clear(screen.getByPlaceholderText('example.com'));
    await user.type(screen.getByPlaceholderText('example.com'), literal('notion.so'));
    await user.clear(screen.getByPlaceholderText(/type an emoji/));
    await user.type(screen.getByPlaceholderText(/type an emoji/), literal('📝'));
    await user.click(screen.getByText('Add to Dock'));

    expect(state().dockItems).toHaveLength(initial + 1);
    const added = state().dockItems[initial];
    expect(added).toMatchObject({ label: 'Notion', url: 'https://notion.so', icon: '📝' });

    await user.click(screen.getAllByTitle('Move up')[initial]);
    expect(state().dockItems[initial - 1].id).toBe(added.id);
    await user.click(screen.getAllByTitle('Move down')[initial - 1]);
    expect(state().dockItems[initial].id).toBe(added.id);

    await user.click(screen.getAllByTitle('Delete')[initial]);
    expect(state().dockItems).toHaveLength(initial);
  });

  it('ドックタブ: ドラッグ＆ドロップで並べ替えられること', async () => {
    openSettings('dock');
    const ids = state().dockItems.map((d) => d.id);
    const handles = screen.getAllByTitle('Drag to reorder');
    // The drop targets are the rows wrapping each grip handle.
    const rows = handles.map((h) => h.parentElement as HTMLElement);
    const dataTransfer = { effectAllowed: '', dropEffect: '' };

    fireEvent.dragStart(handles[0], { dataTransfer });
    fireEvent.dragOver(rows[2], { dataTransfer });
    expect(rows[2].className).toContain('border-sky-400');
    fireEvent.dragLeave(rows[2]);
    fireEvent.dragOver(rows[2], { dataTransfer });
    fireEvent.drop(rows[2], { dataTransfer });
    fireEvent.dragEnd(handles[0]);
    expect(state().dockItems[2].id).toBe(ids[0]);
  });

  it('ショートカットキータブ: コンボを記録して追加・削除できること', async () => {
    const user = setupUser();
    openSettings();
    await user.click(screen.getByText('Keyboard Shortcuts'));
    await user.clear(screen.getByPlaceholderText('e.g. Inbox'));
    await user.type(screen.getByPlaceholderText('e.g. Inbox'), literal('Inbox'));
    await user.clear(screen.getByPlaceholderText('example.com'));
    await user.type(screen.getByPlaceholderText('example.com'), literal('mail.google.com'));
    const recorder = screen.getByPlaceholderText('Click here, then press a key combo');
    await user.click(recorder);
    await user.keyboard('{Control>}{/Control}');
    expect(recorder).toHaveValue('');
    await user.keyboard('{Control>}{Shift>}m{/Shift}{/Control}');
    expect(recorder).toHaveValue('Ctrl+Shift+M');

    await user.click(screen.getByText('Add Shortcut', { selector: 'button span, button' }));
    expect(state().keyboardShortcuts).toHaveLength(1);
    expect(state().keyboardShortcuts[0]).toMatchObject({ combo: 'Ctrl+Shift+M', url: 'https://mail.google.com' });

    await user.click(screen.getByTitle('Delete'));
    expect(state().keyboardShortcuts).toHaveLength(0);
  });

  it('バックアップタブ: エクスポート・インポート・リセットが動くこと', async () => {
    const user = setupUser();
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    openSettings();
    await user.click(screen.getByText('Backup & Sync'));

    await user.click(screen.getByText('Export Configuration JSON'));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();

    const json = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      widgets: [{ id: 'w1', type: 'clock', title: 'Imported Clock', config: {}, layout: { i: 'w1', x: 0, y: 0, w: 4, h: 2 } }],
    });
    const fileInput = screen.getByLabelText('Import JSON File');

    // A bad file keeps the modal open and reports the failure inline.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await user.upload(fileInput, new File(['{bad'], 'bad.json', { type: 'application/json' }));
    await waitFor(() => expect(screen.getByText(/Failed to import/)).toBeInTheDocument());

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByText('Reset All to Defaults'));
    expect(state().widgets[0].title).toBe('Quick Search');

    // A good file applies the config; the store closes the modal on success.
    await user.upload(fileInput, new File([json], 'config.json', { type: 'application/json' }));
    await waitFor(() => expect(state().widgets[0].title).toBe('Imported Clock'));
    expect(state().activeSettingsModal).toBeNull();

    openSettings();
    await user.click(screen.getByText('Backup & Sync'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByText('Reset All to Defaults'));
    await waitFor(() => expect(state().widgets[0].title).toBe('Quick Search'));
  });
});

describe('AppDrawerModal', () => {
  beforeEach(() => resetDashboardStore());

  it('閉じている間は描画しないこと', async () => {
    const { container } = render(<AppDrawerModal />);
    expect(container.firstChild).toBeNull();
  });

  it('既定のショートカットを検索・カテゴリで絞り込め、カスタムアプリを追加できること', async () => {
    const user = setupUser();
    act(() => state().toggleAppDrawer(true));
    render(<AppDrawerModal />);
    expect(screen.getByText('YouTube')).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search apps & tools...'));

    await user.type(screen.getByPlaceholderText('Search apps & tools...'), literal('wiki'));
    expect(screen.getByText('Wikipedia')).toBeInTheDocument();
    expect(screen.queryByText('YouTube')).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Search apps & tools...'));

    await user.click(screen.getByText('Entertainment', { selector: 'button' }));
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();

    await user.click(screen.getByText('Add Custom App'));
    await user.clear(screen.getByPlaceholderText('e.g. Discord, Netflix, Figma'));
    await user.type(screen.getByPlaceholderText('e.g. Discord, Netflix, Figma'), literal('Discord'));
    await user.clear(screen.getByPlaceholderText('https://example.com'));
    await user.type(screen.getByPlaceholderText('https://example.com'), literal('discord.com'));
    await user.click(screen.getByText('Save'));

    // Without a shortcuts widget on the page there is nowhere to persist,
    // but the modal still closes cleanly.
    expect(screen.queryByPlaceholderText('e.g. Discord, Netflix, Figma')).not.toBeInTheDocument();
  });

  it('ショートカットウィジェットがあればそこに保存されること', async () => {
    const user = setupUser();
    act(() => {
      state().addWidget('shortcuts');
      state().toggleAppDrawer(true);
    });
    const id = state().widgets[state().widgets.length - 1].id;
    render(<AppDrawerModal />);

    await user.click(screen.getByText('Add Custom App'));
    await user.clear(screen.getByPlaceholderText('e.g. Discord, Netflix, Figma'));
    await user.type(screen.getByPlaceholderText('e.g. Discord, Netflix, Figma'), literal('Discord'));
    await user.clear(screen.getByPlaceholderText('https://example.com'));
    await user.type(screen.getByPlaceholderText('https://example.com'), literal('https://discord.com'));
    await user.clear(screen.getByPlaceholderText('e.g. Work, Entertainment, AI'));
    await user.type(screen.getByPlaceholderText('e.g. Work, Entertainment, AI'), literal('Chat'));
    await user.click(screen.getByText('Save'));

    const items = state().widgets.find((w) => w.id === id)!.config.items;
    expect(items[items.length - 1]).toMatchObject({ title: 'Discord', url: 'https://discord.com', category: 'Chat' });
  });
});
