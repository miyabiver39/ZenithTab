import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { setupUser } from '../helpers/user';
import { ConfirmDialog } from '../../src/components/common/ConfirmDialog';
import { Modal } from '../../src/components/common/Modal';

describe('ConfirmDialog', () => {
  it('alertdialog として認識され、Cancel に初期フォーカスが当たること', () => {
    render(
      <ConfirmDialog isOpen title="Remove page?" body="This cannot be undone." onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Remove page?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('Tab / Shift+Tab が Cancel と Confirm の間だけを循環すること', async () => {
    const user = setupUser();
    const outside = document.createElement('button');
    outside.textContent = 'outside';
    document.body.appendChild(outside);
    render(<ConfirmDialog isOpen title="T" body="B" onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
    expect(outside).not.toHaveFocus();
    outside.remove();
  });

  it('Escape で onCancel が呼ばれ、閉じると元の要素へフォーカスが戻ること', async () => {
    const user = setupUser();
    const onCancel = vi.fn();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { rerender } = render(<ConfirmDialog isOpen title="T" body="B" onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(<ConfirmDialog isOpen={false} title="T" body="B" onConfirm={vi.fn()} onCancel={onCancel} />);
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('背後の Modal が開いていても、Escape は上に重なった ConfirmDialog だけを閉じること', async () => {
    const user = setupUser();
    const onModalClose = vi.fn();
    const onCancel = vi.fn();
    render(
      <>
        <Modal isOpen onClose={onModalClose} title="Settings">
          <input aria-label="Name" />
        </Modal>
        <ConfirmDialog isOpen title="Reset everything?" body="B" danger onConfirm={vi.fn()} onCancel={onCancel} />
      </>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onModalClose).not.toHaveBeenCalled();
  });

  it('danger のとき確認ボタンが破壊的な見た目になること', () => {
    render(<ConfirmDialog isOpen title="T" body="B" danger confirmLabel="Delete forever" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete forever' })).toBeInTheDocument();
  });

  it('閉じているときは何も描画しないこと', () => {
    const { container } = render(<ConfirmDialog isOpen={false} title="T" body="B" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
