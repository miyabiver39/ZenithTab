import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useDashboardStore } from './store/useDashboardStore';
import { WallpaperBackground } from './components/layout/WallpaperBackground';
import { Header } from './components/layout/Header';
import { Dock } from './components/layout/Dock';
import { GridContainer } from './components/layout/GridContainer';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { AddWidgetModal } from './components/layout/AddWidgetModal';
import { WidgetConfigModal } from './components/layout/WidgetConfigModal';
import './index.css';

export const App: React.FC = () => {
  const { isInitialized, initialize, appearance } = useDashboardStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

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
      <main className="flex-1 flex flex-col">
        <GridContainer />
      </main>
      <Dock />

      {/* Modals */}
      <SettingsPanel />
      <AddWidgetModal />
      <WidgetConfigModal />
    </div>
  );
};

const rootElement = document.getElementById('zenith-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
