import React, { Suspense, lazy, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useDashboardStore } from './store/useDashboardStore';
import { WallpaperBackground } from './components/layout/WallpaperBackground';
import { Header } from './components/layout/Header';
import { PageSwitcher } from './components/layout/PageSwitcher';
import { Dock } from './components/layout/Dock';
import { GridContainer } from './components/layout/GridContainer';

// The dialogs are big (SettingsPanel alone is the largest component) and
// not needed to paint the page, so they load on first open.
const SettingsPanel = lazy(() => import('./components/layout/SettingsPanel').then((m) => ({ default: m.SettingsPanel })));
const AddWidgetModal = lazy(() => import('./components/layout/AddWidgetModal').then((m) => ({ default: m.AddWidgetModal })));
const WidgetConfigModal = lazy(() => import('./components/layout/WidgetConfigModal').then((m) => ({ default: m.WidgetConfigModal })));
const AppDrawerModal = lazy(() => import('./components/layout/AppDrawerModal').then((m) => ({ default: m.AppDrawerModal })));
import { UndoToast } from './components/common/UndoToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { useStorageSync } from './hooks/useStorageSync';
import { useAutoSnapshot } from './hooks/useAutoSnapshot';
import './index.css';

export const App: React.FC = () => {
  const isInitialized = useDashboardStore((s) => s.isInitialized);
  const initialize = useDashboardStore((s) => s.initialize);
  const appearance = useDashboardStore((s) => s.appearance);
  const activeSettingsModal = useDashboardStore((s) => s.activeSettingsModal);
  const isAppDrawerOpen = useDashboardStore((s) => s.isAppDrawerOpen);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useGlobalKeyboardShortcuts();
  useStorageSync();
  useAutoSnapshot();

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <span className="font-medium tracking-wide">Loading ZenithTab...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col relative ${appearance.theme === 'light' ? 'theme-light' : 'dark'}`}>
      <WallpaperBackground />
      <Header />
      <PageSwitcher />
      <main className="flex-1 flex flex-col">
        <GridContainer />
      </main>
      <Dock />

      {/* Modals — mounted only while open so their code is fetched lazily. */}
      <Suspense fallback={null}>
        {activeSettingsModal === 'settings' && <SettingsPanel />}
        {activeSettingsModal === 'addWidget' && <AddWidgetModal />}
        {activeSettingsModal === 'editWidget' && <WidgetConfigModal />}
        {isAppDrawerOpen && <AppDrawerModal />}
      </Suspense>
      <UndoToast />
    </div>
  );
};

const rootElement = document.getElementById('zenith-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
