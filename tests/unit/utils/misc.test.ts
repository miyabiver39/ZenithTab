import { describe, it, expect, vi, afterEach } from 'vitest';
import { getComboFromEvent, isEditableElement } from '../../../src/utils/keyboardShortcuts';
import { getFaviconUrl } from '../../../src/utils/favicon';
import { formatTime, formatDate, formatRelativeTime, getIntlLocale } from '../../../src/utils/date';
import { cn } from '../../../src/utils/cn';
import { DOCK_ICON_LIBRARY, DOCK_ICON_KEYS } from '../../../src/utils/dockIcons';
import { hasHostPermission, requestHostPermission } from '../../../src/utils/permissions';
import { detectBrowserLanguage, getTranslation, resolveLanguageCode } from '../../../src/i18n/resolve';
import { chromeMock, installChromeMock, uninstallChromeMock } from '../../helpers/chrome';

const keyEvent = (init: Partial<KeyboardEvent> & { key: string }) => ({
  ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...init,
}) as KeyboardEvent;

describe('utils/keyboardShortcuts', () => {
  it('修飾キー単体やモディファイア無しは null を返すこと', () => {
    expect(getComboFromEvent(keyEvent({ key: 'Control', ctrlKey: true }))).toBeNull();
    expect(getComboFromEvent(keyEvent({ key: 'Shift', shiftKey: true }))).toBeNull();
    expect(getComboFromEvent(keyEvent({ key: 'g' }))).toBeNull();
  });

  it('修飾キーの組み合わせを Ctrl+Alt+Shift+Meta の順で並べ、単一文字は大文字化すること', () => {
    expect(getComboFromEvent(keyEvent({ key: 'g', ctrlKey: true }))).toBe('Ctrl+G');
    expect(getComboFromEvent(keyEvent({ key: 'ArrowRight', ctrlKey: true, altKey: true }))).toBe('Ctrl+Alt+ArrowRight');
    expect(getComboFromEvent(keyEvent({ key: '1', metaKey: true, shiftKey: true }))).toBe('Shift+Meta+1');
  });

  it('入力要素と contentEditable を編集中と判定すること', () => {
    expect(isEditableElement(null)).toBe(false);
    expect(isEditableElement(document.createElement('input'))).toBe(true);
    expect(isEditableElement(document.createElement('textarea'))).toBe(true);
    const div = document.createElement('div');
    expect(isEditableElement(div)).toBe(false);
    Object.defineProperty(div, 'isContentEditable', { value: true });
    expect(isEditableElement(div)).toBe(true);
  });
});

describe('utils/favicon', () => {
  afterEach(() => installChromeMock());

  it('Chrome の内部 favicon エンドポイントURLを組み立てること', () => {
    const url = getFaviconUrl('https://example.com/path', 64);
    expect(url).toBe('chrome-extension://mock-extension-id/_favicon/?pageUrl=https%3A%2F%2Fexample.com%2Fpath&size=64');
  });

  it('空・不正・非HTTPのURLでは空文字を返すこと', () => {
    expect(getFaviconUrl()).toBe('');
    expect(getFaviconUrl('not a url')).toBe('');
    expect(getFaviconUrl('javascript:alert(1)')).toBe('');
  });

  it('Chrome API が無ければ外部サービスに頼らず空文字を返すこと', () => {
    uninstallChromeMock();
    expect(getFaviconUrl('https://example.com')).toBe('');
  });
});

describe('utils/date', () => {
  it('getIntlLocale が言語コードを Intl ロケールに変換すること', () => {
    expect(getIntlLocale()).toBeUndefined();
    expect(getIntlLocale('auto')).toBeUndefined();
    expect(getIntlLocale('ja')).toBe('ja-JP');
    expect(getIntlLocale('zh')).toBe('zh-CN');
    expect(getIntlLocale('pt-BR')).toBe('pt-BR');
  });

  it('formatTime が 24h / 12h と秒の有無を切り替えること', () => {
    const date = new Date('2026-09-16T15:04:05Z');
    expect(formatTime(date, true, true, 'UTC', 'en')).toBe('15:04:05');
    expect(formatTime(date, true, false, 'UTC', 'en')).toBe('15:04');
    expect(formatTime(date, false, false, 'UTC', 'en')).toMatch(/^3:04\sPM$/);
  });

  it('formatDate がロケール別に曜日付きの日付を返すこと', () => {
    const date = new Date('2026-09-16T00:00:00Z');
    expect(formatDate(date, 'UTC', 'ja')).toContain('水曜日');
    expect(formatDate(date, 'UTC', 'en')).toContain('Wednesday');
  });

  it('formatRelativeTime が経過時間を段階的に表現すること', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-16T12:00:00Z'));
    const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

    expect(formatRelativeTime()).toBe('');
    expect(formatRelativeTime('garbage')).toBe('');
    expect(formatRelativeTime(ago(30 * 1000))).toBe('Just now');
    expect(formatRelativeTime(ago(5 * 60 * 1000))).toBe('5m ago');
    expect(formatRelativeTime(ago(3 * 60 * 60 * 1000))).toBe('3h ago');
    expect(formatRelativeTime(ago(2 * 24 * 60 * 60 * 1000))).toBe('2d ago');
    // Beyond a week it's a locale-formatted date (system locale), so only
    // assert on the day number.
    expect(formatRelativeTime(Date.now() - 30 * 24 * 60 * 60 * 1000)).toContain('17');
    vi.useRealTimers();
  });
});

describe('utils/cn', () => {
  it('clsx + tailwind-merge で後勝ちマージすること', () => {
    const hidden = false as boolean;
    expect(cn('p-2', hidden && 'hidden', 'p-4')).toBe('p-4');
    expect(cn('text-sm', { 'font-bold': true, italic: false })).toBe('text-sm font-bold');
  });
});

describe('utils/dockIcons', () => {
  it('キー一覧とライブラリが一致し、既定アイコンを含むこと', () => {
    expect(DOCK_ICON_KEYS).toEqual(Object.keys(DOCK_ICON_LIBRARY));
    for (const key of ['globe', 'mail', 'video', 'sparkles', 'map', 'book']) {
      expect(DOCK_ICON_LIBRARY[key]).toBeDefined();
    }
    expect(DOCK_ICON_KEYS.length).toBeGreaterThan(80);
  });
});

describe('utils/permissions (denied / errored)', () => {
  afterEach(() => {
    installChromeMock();
    vi.restoreAllMocks();
  });

  it('権限が拒否されたら false を返すこと', async () => {
    chromeMock.permissions.contains.mockResolvedValue(false);
    chromeMock.permissions.request.mockResolvedValue(false);
    await expect(hasHostPermission('https://example.com/feed')).resolves.toBe(false);
    await expect(requestHostPermission('https://example.com/feed')).resolves.toBe(false);
    expect(chromeMock.permissions.request).toHaveBeenCalledWith({ origins: ['https://example.com/*'] });
  });

  it('API が例外を投げたら false を返し、request は警告を出すこと', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    chromeMock.permissions.contains.mockRejectedValue(new Error('x'));
    chromeMock.permissions.request.mockRejectedValue(new Error('y'));
    await expect(hasHostPermission('https://example.com/')).resolves.toBe(false);
    await expect(requestHostPermission('https://example.com/')).resolves.toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it('拡張コンテキスト外では常に許可扱いにすること', async () => {
    uninstallChromeMock();
    await expect(hasHostPermission('https://example.com/')).resolves.toBe(true);
    await expect(requestHostPermission('https://example.com/')).resolves.toBe(true);
  });
});

describe('i18n/resolve', () => {
  afterEach(() => vi.restoreAllMocks());

  it('ブラウザ言語をサポート言語に丸めること', () => {
    const cases: Array<[string, string]> = [
      ['ja-JP', 'ja'], ['zh-TW', 'zh-CN'], ['es-MX', 'es'], ['fr-CA', 'fr'], ['de-AT', 'de'], ['ko-KR', 'ko'], ['pt-BR', 'en'],
    ];
    for (const [browser, expected] of cases) {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue(browser);
      expect(detectBrowserLanguage()).toBe(expected);
    }
  });

  it('auto は検出結果、明示指定はそのまま、未知は英語にフォールバックすること', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
    expect(resolveLanguageCode('auto')).toBe('de');
    expect(resolveLanguageCode('ko')).toBe('ko');
    expect(getTranslation('auto')).toBe(getTranslation('de'));
    expect(getTranslation('xx' as any).common.dashboard).toBe('Dashboard');
  });
});
