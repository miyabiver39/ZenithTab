import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { ShareSettings } from '../../src/components/layout/settings/ShareSettings';
import { useDashboardStore } from '../../src/store/useDashboardStore';
import { resetDashboardStore } from '../helpers/store';
import { chromeSyncData } from '../helpers/chrome';
import { encodeShareCode } from '../../src/services/shareService';

const state = () => useDashboardStore.getState();

describe('ShareSettings', () => {
  beforeEach(() => {
    resetDashboardStore({ activeSettingsModal: 'settings' });
    // jsdom has no canvas; the QR renderer is exercised elsewhere, and its
    // "no 2d context" warning is expected here.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('共有コードを作ってコピーでき、個人データを含まないこと', async () => {
    const user = setupUser();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    useDashboardStore.setState((s) => ({
      widgets: s.widgets.map((w) => (w.type === 'notes' ? { ...w, config: { ...w.config, content: 'TOP SECRET' } } : w)),
    }));

    render(<ShareSettings />);
    await user.click(screen.getByRole('checkbox', { name: 'Include the Dock' }));
    await user.click(screen.getByRole('button', { name: 'Create share code' }));

    const box = (await screen.findByRole('textbox', { name: 'Share code' })) as HTMLTextAreaElement;
    expect(box.value).toMatch(/^zt1\./);
    expect(box.value).not.toContain('TOP SECRET');
    expect(screen.getByText(/characters/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith(box.value);
    await screen.findByText('Copied!');
    // Let the "Copied!" label time out inside the test rather than after it.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument(), { timeout: 2500 });
  });

  it('貼り付けたコードをプレビューし、新しいページとして追加(ドック置換つき)できること', async () => {
    const user = setupUser();
    const code = await encodeShareCode({
      v: 1,
      app: '1.11.0',
      page: {
        name: 'Shared',
        widgets: [{ id: 'a', type: 'clock', title: 'Clock', config: { style: 'digital' }, layout: { i: 'a', x: 0, y: 0, w: 4, h: 2 } }],
        layouts: { lg: [{ i: 'a', x: 0, y: 0, w: 4, h: 2 }], md: [], sm: [], xs: [], xxs: [] },
      },
      dock: [{ id: 'd', label: 'Shared site', url: 'https://shared.example', icon: 'globe', openInNewTab: true }],
    });

    render(<ShareSettings />);
    await user.click(screen.getByLabelText('Got a share code? Paste it here'));
    await user.paste(code);
    await waitFor(() => expect(screen.getByTestId('share-preview')).toHaveTextContent('"Shared" · 1 widgets · Dock: 1 items'));

    await user.click(screen.getByRole('checkbox', { name: /replace my Dock/ }));
    await user.click(screen.getByRole('button', { name: 'Add as a new page' }));

    expect(state().pages).toHaveLength(2);
    expect(state().pages[1].name).toBe('Shared');
    expect(state().widgets.map((w) => w.type)).toEqual(['clock']);
    expect(state().widgets[0].id).not.toBe('a');
    expect(state().dockItems.map((d) => d.label)).toEqual(['Shared site']);
    expect(state().activeSettingsModal).toBeNull();
  });

  it('壊れたコードにはエラーを出すこと', async () => {
    const user = setupUser();
    render(<ShareSettings />);
    await user.click(screen.getByLabelText('Got a share code? Paste it here'));
    await user.paste('definitely not a code');
    await waitFor(() => expect(screen.getByText('That is not a ZenithTab share code.')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Add as a new page' })).not.toBeInTheDocument();
  });

  it('同期のトグルで設定が保存され、オフにすると sync 領域を空にすること', async () => {
    const user = setupUser();
    render(<ShareSettings />);
    const toggle = screen.getByRole('checkbox', { name: 'Sync settings' });
    expect(toggle).toBeEnabled();
    await user.click(toggle);
    expect(state().backupSettings.syncSettings).toBe(true);

    chromeSyncData.zenith_sync_appearance = { updatedAt: 1, value: {} };
    await user.click(toggle);
    expect(state().backupSettings.syncSettings).toBe(false);
    await waitFor(() => expect(chromeSyncData.zenith_sync_appearance).toBeUndefined());
  });
});
