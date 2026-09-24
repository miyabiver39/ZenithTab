import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * i18n/resolve.ts's lazy-loading mechanics (#77): only `en` is bundled
 * eagerly, the rest load through `import()` on first use. `tests/setup.ts`
 * preloads every locale once for the whole suite so the rest of the tests
 * can keep reading `LOCALES.<lang>` synchronously — this file instead
 * gets a *fresh*, unpreloaded module instance per test (`vi.resetModules`)
 * to exercise the "not loaded yet" path itself.
 */

async function freshResolve() {
  vi.resetModules();
  return import('../../../src/i18n/resolve');
}

describe('i18n/resolve: lazy locale loading', () => {
  afterEach(() => {
    vi.doUnmock('../../../src/i18n/locales/ja');
    vi.restoreAllMocks();
  });

  it('en はモジュール読み込み時からすでに使えること', async () => {
    const { LOCALES, getTranslation, isLocaleLoaded } = await freshResolve();
    expect(isLocaleLoaded('en')).toBe(true);
    expect(LOCALES.en).toBeDefined();
    expect(getTranslation('en').common.dashboard).toBe('Dashboard');
  });

  it('未読み込みの言語には en を返しつつ、裏で読み込みを開始すること', async () => {
    const { getTranslation, isLocaleLoaded, ensureLocaleLoaded } = await freshResolve();
    expect(isLocaleLoaded('ja')).toBe(false);

    const first = getTranslation('ja');
    expect(first.common.dashboard).toBe('Dashboard'); // en フォールバック

    const loaded = await ensureLocaleLoaded('ja');
    expect(loaded.common.dashboard).toBe('ダッシュボード');
    expect(isLocaleLoaded('ja')).toBe(true);
    // 読み込み後は本来の翻訳を同期的に返す。
    expect(getTranslation('ja').common.dashboard).toBe('ダッシュボード');
  });

  it('同時に呼んでも1回の import() だけを共有すること', async () => {
    const mod = await freshResolve();
    const first = mod.ensureLocaleLoaded('de');
    const second = mod.ensureLocaleLoaded('de');
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b); // 同じ Translation オブジェクト
  });

  it('resolveLanguageCode で auto を解決してから読み込むこと(preloadLocale)', async () => {
    const mod = await freshResolve();
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ko-KR');
    const loaded = await mod.preloadLocale('auto');
    expect(loaded.common.dashboard).toBe('대시보드');
    expect(mod.isLocaleLoaded('ko')).toBe(true);
  });

  it('中国語は zh-CN と素の zh の両方のキーにキャッシュされること', async () => {
    const mod = await freshResolve();
    await mod.ensureLocaleLoaded('zh-CN');
    expect(mod.LOCALES['zh-CN']).toBeDefined();
    expect(mod.LOCALES.zh).toBe(mod.LOCALES['zh-CN']);
  });

  it('読み込みに失敗しても en にフォールバックし、例外を投げないこと', async () => {
    vi.doMock('../../../src/i18n/locales/ja', () => {
      throw new Error('chunk failed to load');
    });
    const mod = await freshResolve();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const loaded = await mod.ensureLocaleLoaded('ja');
    expect(loaded.common.dashboard).toBe('Dashboard');
    expect(mod.getTranslation('ja').common.dashboard).toBe('Dashboard');
  });

  it('読み込みに失敗した言語は getTranslation から再試行せず、明示的な preloadLocale でだけ再試行すること (#83)', async () => {
    let attempts = 0;
    vi.doMock('../../../src/i18n/locales/ja', () => {
      attempts += 1;
      throw new Error('chunk failed to load');
    });
    const mod = await freshResolve();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    mod.getTranslation('ja'); // 初回は裏で読み込みを試みる
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(1));

    // レンダーのたびに呼ばれる想定: 何度呼んでも再試行もログも増えない。
    for (let i = 0; i < 5; i += 1) expect(mod.getTranslation('ja').common.dashboard).toBe('Dashboard');
    await new Promise((r) => setTimeout(r, 0));
    expect(attempts).toBe(1);
    expect(error).toHaveBeenCalledTimes(1);

    // 言語切り替えなど明示的な読み込みは再試行する。
    await mod.preloadLocale('ja');
    expect(attempts).toBe(2);
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('onLocaleLoaded は読み込み完了のたびに通知し、購読解除後は呼ばれないこと', async () => {
    const mod = await freshResolve();
    const versionBefore = mod.getLocaleLoadVersion();
    const listener = vi.fn();
    const unsubscribe = mod.onLocaleLoaded(listener);

    await mod.ensureLocaleLoaded('fr');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(mod.getLocaleLoadVersion()).toBe(versionBefore + 1);

    unsubscribe();
    await mod.ensureLocaleLoaded('es');
    expect(listener).toHaveBeenCalledTimes(1); // 追加で呼ばれない
  });

  it('resolveLanguageCode / detectBrowserLanguage は既存どおり動くこと', async () => {
    const { resolveLanguageCode } = await freshResolve();
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    expect(resolveLanguageCode('auto')).toBe('fr');
    expect(resolveLanguageCode('ja')).toBe('ja');
    expect(resolveLanguageCode(undefined)).toBe('fr');
  });
});
