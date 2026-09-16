import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IframeWidget } from '../../src/components/widgets/IframeWidget/IframeWidget';
import { resetDashboardStore } from '../helpers/store';
import { isSafeHttpUrl, normalizeHttpUrl, hostnameOf } from '../../src/utils/url';

describe('IframeWidget', () => {
  beforeEach(() => resetDashboardStore());

  it('有効なURLをサンドボックス付き iframe で埋め込むこと', async () => {
    const { container } = render(<IframeWidget config={{ url: 'https://example.com/tool', title: 'Tool', allowScroll: false }} />);
    const iframe = container.querySelector('iframe')!;
    expect(iframe).toHaveAttribute('src', 'https://example.com/tool');
    expect(iframe).toHaveAttribute('title', 'Tool');
    expect(iframe.getAttribute('sandbox')).toContain('allow-scripts');
    expect(iframe).toHaveAttribute('scrolling', 'no');
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    expect(screen.getByTitle('Open in New Tab')).toHaveAttribute('href', 'https://example.com/tool');
  });

  it('読み込み完了でローディング表示が消えること', async () => {
    const { container } = render(<IframeWidget config={{ url: 'https://example.com', title: 'T', allowScroll: true }} />);
    fireEvent.load(container.querySelector('iframe')!);
    expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
  });

  // NOTE: the "restricted by CSP / X-Frame-Options" card is driven by the
  // iframe's onError, which neither browsers nor React fire for a blocked
  // frame — so it can't be exercised from a test (or, today, reached by a
  // user). Left as a known limitation rather than faked here.

  it('スキームの無いURLは iframe にせず不正URLメッセージを出すこと（クラッシュしない）', async () => {
    const { container } = render(<IframeWidget config={{ url: 'example.com', title: '', allowScroll: true }} />);
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(screen.getByText(/No valid web address/)).toBeInTheDocument();
    expect(screen.queryByText('Open in New Tab')).not.toBeInTheDocument();
  });

  it('javascript: / data: URL を拒否すること', async () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,<h1>x</h1>', 'file:///etc/passwd']) {
      const { container, unmount } = render(<IframeWidget config={{ url, title: 'Evil', allowScroll: true }} />);
      expect(container.querySelector('iframe')).not.toBeInTheDocument();
      expect(container.querySelector('a')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('URL 未設定時は既定のURLを使うこと', async () => {
    const { container } = render(<IframeWidget config={{} as any} />);
    expect(container.querySelector('iframe')).toHaveAttribute('src', 'https://developer.mozilla.org');
  });
});

describe('utils/url', () => {
  it('http(s) 以外を拒否すること', async () => {
    expect(isSafeHttpUrl('https://a.example')).toBe(true);
    expect(isSafeHttpUrl('http://a.example')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl(undefined)).toBe(false);
    expect(isSafeHttpUrl('not a url')).toBe(false);
  });

  it('normalizeHttpUrl がスキームを補い、安全でないものは null にすること', async () => {
    expect(normalizeHttpUrl('  example.com/path ')).toBe('https://example.com/path');
    expect(normalizeHttpUrl('http://example.com')).toBe('http://example.com/');
    expect(normalizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeHttpUrl('')).toBeNull();
  });

  it('hostnameOf が解析失敗時に空文字を返すこと', async () => {
    expect(hostnameOf('https://sub.example.com/x')).toBe('sub.example.com');
    expect(hostnameOf('nope')).toBe('');
  });
});
