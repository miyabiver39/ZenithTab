import { describe, it, expect, vi, afterEach } from 'vitest';
import { storageGet, storageSet, storageRemove, isChromeExtension } from '../../../src/utils/storage';
import { chromeMock, chromeStorageData, failNextStorageCall, installChromeMock, uninstallChromeMock } from '../../helpers/chrome';

describe('utils/storage', () => {
  afterEach(() => {
    installChromeMock();
    vi.restoreAllMocks();
  });

  describe('Chrome 拡張コンテキスト', () => {
    it('isChromeExtension が true を返し chrome.storage.local を使うこと', async () => {
      expect(isChromeExtension()).toBe(true);
      await storageSet('k', { a: 1 });
      expect(chromeStorageData.k).toEqual({ a: 1 });
      expect(await storageGet('k')).toEqual({ a: 1 });
      expect(localStorage.getItem('zenith_k')).toBeNull();
    });

    it('未保存キーはデフォルト値を返すこと', async () => {
      expect(await storageGet('missing', 'fallback')).toBe('fallback');
      expect(await storageGet('missing')).toBeUndefined();
    });

    it('storageRemove がキーを削除すること', async () => {
      await storageSet('k', 1);
      await storageRemove('k');
      expect(chromeStorageData.k).toBeUndefined();
    });

    it('chrome.storage が失敗したら警告して localStorage にフォールバックすること', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      failNextStorageCall('quota exceeded');
      await storageSet('k', 'v');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("chrome.storage.local.set('k') failed"), expect.any(Error));
      expect(localStorage.getItem('zenith_k')).toBe('"v"');

      failNextStorageCall();
      expect(await storageGet('k')).toBe('v');

      failNextStorageCall();
      await storageRemove('k');
      expect(localStorage.getItem('zenith_k')).toBeNull();
    });

    it('lastError が失敗中にセットされ、完了後にクリアされること', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      failNextStorageCall('boom');
      const getImpl = chromeMock.storage.local.get;
      await storageGet('k');
      expect(getImpl).toHaveBeenCalled();
      expect(chromeMock.runtime.lastError).toBeUndefined();
    });
  });

  describe('Chrome API が無い環境（Node / jsdom）', () => {
    it('isChromeExtension が false になり localStorage を使うこと', async () => {
      uninstallChromeMock();
      expect(isChromeExtension()).toBe(false);

      await storageSet('k', { nested: [1, 2] });
      expect(JSON.parse(localStorage.getItem('zenith_k')!)).toEqual({ nested: [1, 2] });
      expect(await storageGet('k')).toEqual({ nested: [1, 2] });
      expect(await storageGet('none', 42)).toBe(42);

      await storageRemove('k');
      expect(localStorage.getItem('zenith_k')).toBeNull();
    });

    it('localStorage に壊れたJSONがあってもデフォルト値を返すこと', async () => {
      uninstallChromeMock();
      localStorage.setItem('zenith_k', '{oops');
      expect(await storageGet('k', 'safe')).toBe('safe');
    });

    it('localStorage への書き込み失敗をログして例外にしないこと', async () => {
      uninstallChromeMock();
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      await expect(storageSet('k', 'v')).resolves.toBeUndefined();
      expect(error).toHaveBeenCalled();

      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('nope');
      });
      await expect(storageRemove('k')).resolves.toBeUndefined();
    });
  });
});
