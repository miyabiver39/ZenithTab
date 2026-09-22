import React, { useRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '../../../src/hooks/useFocusTrap';

const Trap: React.FC<{ isOpen: boolean; onEscape?: () => void; empty?: boolean }> = ({ isOpen, onEscape, empty }) => {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, { isOpen, onEscape });
  return (
    <div ref={ref} data-testid="trap">
      {!empty && <button type="button">only</button>}
    </div>
  );
};

describe('useFocusTrap', () => {
  it('開いている間だけ body のスクロールをロックし、複数同時に開いていれば全部閉じるまで解除しないこと', () => {
    document.body.style.overflow = '';
    const { rerender, unmount } = render(
      <>
        <Trap isOpen />
        <Trap isOpen />
      </>
    );
    expect(document.body.style.overflow).toBe('hidden');

    // Only unmount/close one of the two open traps.
    rerender(
      <>
        <Trap isOpen={false} />
        <Trap isOpen />
      </>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <>
        <Trap isOpen={false} />
        <Trap isOpen={false} />
      </>
    );
    expect(document.body.style.overflow).toBe('');
    unmount();
  });

  it('コンテナにフォーカス可能な要素が無ければ、Tab を無害に吸収すること', () => {
    render(<Trap isOpen empty />);
    // Must not throw despite there being nothing to focus.
    expect(() => fireEvent.keyDown(document, { key: 'Tab' })).not.toThrow();
  });

  it('isOpen が false の間は Escape に反応しないこと', () => {
    const onEscape = vi.fn();
    render(<Trap isOpen={false} onEscape={onEscape} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });
});
