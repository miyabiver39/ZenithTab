import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { installChromeMock, resetChromeMock } from './helpers/chrome';

// Every test file gets a fresh, fully-mocked `chrome` global (see
// tests/helpers/chrome.ts for the API surface and override helpers).
installChromeMock();

afterEach(() => {
  // Unmount rendered components, wipe the fake chrome.storage and the
  // localStorage fallback, and restore every mock's default behaviour so
  // one test's overrides (denied permissions, injected failures, …)
  // can't bleed into the next.
  cleanup();
  resetChromeMock();
  localStorage.clear();
});
