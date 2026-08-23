import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BookmarkWidget } from '../../src/components/widgets/BookmarkWidget/BookmarkWidget';

describe('BookmarkWidget', () => {
  it('ブックマークの検索バーとリストを描画できること', async () => {
    render(
      <BookmarkWidget
        config={{
          viewMode: 'grid',
          showFavicons: true,
          columns: 4,
        }}
      />
    );

    // Verify search input and bookmarks are loaded and rendered
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search bookmarks...')).toBeInTheDocument();
      expect(screen.getByText('Bookmarks bar')).toBeInTheDocument();
    });
  });
});
