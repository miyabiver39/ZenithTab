import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShortcutsWidget } from '../../src/components/widgets/ShortcutsWidget/ShortcutsWidget';

describe('ShortcutsWidget', () => {
  it('ショートカットアイテムを描画できること', () => {
    const mockItems = [
      { id: '1', title: 'GitHub', url: 'https://github.com', category: 'Dev' },
      { id: '2', title: 'YouTube', url: 'https://youtube.com', category: 'Media' },
    ];

    render(
      <ShortcutsWidget
        widgetId="test-shortcuts-1"
        config={{
          items: mockItems,
          columns: 4,
          openInNewTab: true,
          viewMode: 'grid',
        }}
      />
    );

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });
});
