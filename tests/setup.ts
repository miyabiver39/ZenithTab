import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { installChromeMock, resetChromeMock } from './helpers/chrome';

// Every test file gets a fresh, fully-mocked `chrome` global (see
// tests/helpers/chrome.ts for the API surface and override helpers).
installChromeMock();

// jsdom ships no canvas implementation and logs "Not implemented" whenever
// one is requested (the QR widget does on render). Returning null makes
// those code paths take their normal "no context" branch quietly; tests
// that need a context spy it on the prototype themselves.
HTMLCanvasElement.prototype.getContext = function getContextStub() {
  return null;
} as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  // Unmount rendered components, wipe the fake chrome.storage and the
  // localStorage fallback, and restore every mock's default behaviour so
  // one test's overrides (denied permissions, injected failures, …)
  // can't bleed into the next.
  cleanup();
  resetChromeMock();
  localStorage.clear();
});
