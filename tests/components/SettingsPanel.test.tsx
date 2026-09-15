import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

  it('閉じている間は描画しないこと', () => {
    const { container } = render(<SettingsPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('壁紙タブ: ソース切替・カテゴリ・グラデーション・スライダーが store に反映されること', () => {
    const { container } = openSettings();
    expect(screen.getByText('ZenithTab Settings')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Gradient'));
    expect(state().wallpaper.source).toBe('gradient');
    expect(state().wallpaper.currentWallpaperUrl).toContain('linear-gradient');

    fireEvent.click(screen.getByText('Custom File'));
    expect(state().wallpaper.source).toBe('custom');

    fireEvent.click(screen.getByText('Unsplash HD'));
    expect(state().wallpaper.source).toBe('unsplash');
    fireEvent.click(screen.getByText('Nature & Earth'));
    expect(state().wallpaper.category).toBe('nature');

    const sliders = container.querySelectorAll('input[type="range"]');
    fireEvent.change(sliders[0], { target: { value: '10' } });
    expect(state().wallpaper.blur).toBe(10);
  });

  it('壁紙タブ: 画像アップロードが縮小処理を経て保存されること', async () => {
    vi.spyOn(wallpaperService, 'prepareUploadedWallpaper').mockResolvedValue('data:image/jpeg;base64,xyz');
    const { container } = openSettings();
    fireEvent.click(screen.getByText('Custom File'));
    const fileInput = container.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement;
    const file = new File(['img'], 'wall.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(state().wallpaper.currentWallpaperUrl).toBe('data:image/jpeg;base64,xyz'));
    expect(state().wallpaper.source).toBe('custom');
  });

  it('外観タブ: ドック位置・角丸・ガラス設定を変更できること', () => {
    const { container } = openSettings();
    fireEvent.click(screen.getByText('Glass & Appearance'));
    fireEvent.click(screen.getByText('Top'));
    expect(state().appearance.dockPosition).toBe('top');
    fireEvent.click(screen.getByText('Hidden'));
    expect(state().appearance.dockPosition).toBe('hidden');

    const sliders = container.querySelectorAll('input[type="range"]');
    if (sliders.length > 0) {
      fireEvent.change(sliders[0], { target: { value: '24' } });
      expect(state().appearance.glassBlur).toBe(24);
    }
  });

  it('言語タブ: 言語を切り替えると UI が追従すること', () => {
    openSettings();
    fireEvent.click(screen.getByText('Language'));
    fireEvent.click(screen.getByText('日本語'));
    expect(state().appearance.language).toBe('ja');
    expect(screen.getByText('ZenithTab 設定')).toBeInTheDocument();
  });

  it('ドックタブ: 項目の追加・並べ替え・削除ができること', () => {
    openSettings('dock');
    expect(screen.getByPlaceholderText('e.g. Notion')).toBeInTheDocument();
    const initial = state().dockItems.length;

    fireEvent.change(screen.getByPlaceholderText('e.g. Notion'), { target: { value: 'Notion' } });
    fireEvent.change(screen.getByPlaceholderText('example.com'), { target: { value: 'notion.so' } });
    fireEvent.change(screen.getByPlaceholderText(/type an emoji/), { target: { value: '📝' } });
    fireEvent.click(screen.getByText('Add to Dock'));

    expect(state().dockItems).toHaveLength(initial + 1);
    const added = state().dockItems[initial];
    expect(added).toMatchObject({ label: 'Notion', url: 'https://notion.so', icon: '📝' });

    fireEvent.click(screen.getAllByTitle('Move up')[initial]);
    expect(state().dockItems[initial - 1].id).toBe(added.id);
    fireEvent.click(screen.getAllByTitle('Move down')[initial - 1]);
    expect(state().dockItems[initial].id).toBe(added.id);

    fireEvent.click(screen.getAllByTitle('Delete')[initial]);
    expect(state().dockItems).toHaveLength(initial);
  });

  it('ドックタブ: ドラッグ＆ドロップで並べ替えられること', () => {
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

  it('ショートカットキータブ: コンボを記録して追加・削除できること', () => {
    openSettings();
    fireEvent.click(screen.getByText('Keyboard Shortcuts'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Inbox'), { target: { value: 'Inbox' } });
    fireEvent.change(screen.getByPlaceholderText('example.com'), { target: { value: 'mail.google.com' } });
    const recorder = screen.getByPlaceholderText('Click here, then press a key combo');
    fireEvent.keyDown(recorder, { key: 'Control', ctrlKey: true });
    expect(recorder).toHaveValue('');
    fireEvent.keyDown(recorder, { key: 'm', ctrlKey: true, shiftKey: true });
    expect(recorder).toHaveValue('Ctrl+Shift+M');

    fireEvent.click(screen.getByText('Add Shortcut', { selector: 'button span, button' }));
    expect(state().keyboardShortcuts).toHaveLength(1);
    expect(state().keyboardShortcuts[0]).toMatchObject({ combo: 'Ctrl+Shift+M', url: 'https://mail.google.com' });

    fireEvent.click(screen.getByTitle('Delete'));
    expect(state().keyboardShortcuts).toHaveLength(0);
  });

  it('バックアップタブ: エクスポート・インポート・リセットが動くこと', async () => {
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const { container } = openSettings();
    fireEvent.click(screen.getByText('Backup & Sync'));

    fireEvent.click(screen.getByText('Export Configuration JSON'));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();

    const json = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      widgets: [{ id: 'w1', type: 'clock', title: 'Imported Clock', config: {}, layout: { i: 'w1', x: 0, y: 0, w: 4, h: 2 } }],
    });
    const fileInput = container.querySelector('input[type="file"][accept*="json"]') as HTMLInputElement;

    // A bad file keeps the modal open and reports the failure inline.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fireEvent.change(fileInput, { target: { files: [new File(['{bad'], 'bad.json')] } });
    await waitFor(() => expect(screen.getByText(/Failed to import/)).toBeInTheDocument());

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByText('Reset All to Defaults'));
    expect(state().widgets[0].title).toBe('Quick Search');

    // A good file applies the config; the store closes the modal on success.
    fireEvent.change(fileInput, { target: { files: [new File([json], 'config.json', { type: 'application/json' })] } });
    await waitFor(() => expect(state().widgets[0].title).toBe('Imported Clock'));
    expect(state().activeSettingsModal).toBeNull();

    openSettings();
    fireEvent.click(screen.getByText('Backup & Sync'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByText('Reset All to Defaults'));
    await waitFor(() => expect(state().widgets[0].title).toBe('Quick Search'));
  });
});

describe('AppDrawerModal', () => {
  beforeEach(() => resetDashboardStore());

  it('閉じている間は描画しないこと', () => {
    const { container } = render(<AppDrawerModal />);
    expect(container.firstChild).toBeNull();
  });

  it('既定のショートカットを検索・カテゴリで絞り込め、カスタムアプリを追加できること', () => {
    act(() => state().toggleAppDrawer(true));
    render(<AppDrawerModal />);
    expect(screen.getByText('YouTube')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search apps & tools...'), { target: { value: 'wiki' } });
    expect(screen.getByText('Wikipedia')).toBeInTheDocument();
    expect(screen.queryByText('YouTube')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search apps & tools...'), { target: { value: '' } });

    fireEvent.click(screen.getByText('Media', { selector: 'button' }));
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Add Custom App'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Discord, Netflix, Figma'), { target: { value: 'Discord' } });
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'discord.com' } });
    fireEvent.click(screen.getByText('Save'));

    // Without a shortcuts widget on the page there is nowhere to persist,
    // but the modal still closes cleanly.
    expect(screen.queryByPlaceholderText('e.g. Discord, Netflix, Figma')).not.toBeInTheDocument();
  });

  it('ショートカットウィジェットがあればそこに保存されること', () => {
    act(() => {
      state().addWidget('shortcuts');
      state().toggleAppDrawer(true);
    });
    const id = state().widgets[state().widgets.length - 1].id;
    render(<AppDrawerModal />);

    fireEvent.click(screen.getByText('Add Custom App'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Discord, Netflix, Figma'), { target: { value: 'Discord' } });
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://discord.com' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Work, Entertainment, AI'), { target: { value: 'Chat' } });
    fireEvent.click(screen.getByText('Save'));

    const items = state().widgets.find((w) => w.id === id)!.config.items;
    expect(items[items.length - 1]).toMatchObject({ title: 'Discord', url: 'https://discord.com', category: 'Chat' });
  });
});
