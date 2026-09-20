import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { Modal } from '../../src/components/common/Modal';

function renderModal(children: React.ReactNode = null, onClose = vi.fn()) {
  const utils = render(
    <>
      <button type="button">outside</button>
      <Modal isOpen onClose={onClose} title="Dialog title">
        {children}
      </Modal>
    </>
  );
  return { ...utils, onClose };
}

describe('Modal', () => {
  it('dialog として認識され、タイトルと閉じるボタンにアクセシブルな名前があること', () => {
    renderModal(<input aria-label="Name" />);
    const dialog = screen.getByRole('dialog', { name: 'Dialog title' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('開いたときに本文の最初のコントロールへフォーカスし、無ければ閉じるボタンへ', () => {
    const { unmount } = renderModal(<input aria-label="Name" />);
    expect(screen.getByLabelText('Name')).toHaveFocus();
    unmount();
    renderModal(<p>text only</p>);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('Tab / Shift+Tab がモーダルの中で循環し、外へ抜けないこと', async () => {
    const user = setupUser();
    renderModal(
      <>
        <input aria-label="First" />
        <button type="button">Last</button>
      </>
    );
    expect(screen.getByLabelText('First')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('First')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'outside' })).not.toHaveFocus();
  });

  it('Escape と閉じるボタンで onClose が呼ばれ、閉じると元の要素へフォーカスが戻ること', async () => {
    const user = setupUser();
    const onClose = vi.fn();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    const { rerender } = render(
      <Modal isOpen onClose={onClose} title="T">
        <input aria-label="Name" />
      </Modal>
    );
    expect(screen.getByLabelText('Name')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    rerender(
      <Modal isOpen={false} onClose={onClose} title="T">
        <input aria-label="Name" />
      </Modal>
    );
    expect(outside).toHaveFocus();
    outside.remove();
  });
});
