import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FilePlus2, Copy, LayoutTemplate } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useTranslation } from '../../i18n/i18n';
import { PageTemplateModal } from './PageTemplateModal';
import { buildTemplatePage, type PageTemplateId } from '../../config/templates/pageTemplates';

interface AddPageMenuProps {
  /** The trigger; it receives the onClick that opens the menu. */
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  align?: 'left' | 'right';
}

const MENU_WIDTH = 240;

/**
 * Wraps an "add page" trigger with a two-option popover: start empty, or
 * duplicate the current page. Adding a page used to jump straight to a
 * blank page, which first-time users read as "all my widgets vanished";
 * spelling the choice out makes the outcome predictable.
 *
 * The popover is portaled to <body> (positioned from the trigger's rect)
 * because one of its triggers lives inside the page strip, whose
 * `overflow-x-auto` would otherwise clip it.
 */
export const AddPageMenu: React.FC<AddPageMenuProps> = ({ children, align = 'left' }) => {
  const addPage = useDashboardStore((s) => s.addPage);
  const { t, activeLanguageCode } = useTranslation();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = position !== null;

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setPosition(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPosition(null);
    };
    const close = () => setPosition(null);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [isOpen]);

  const toggle = () => {
    if (isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const left = align === 'right' ? rect.right - MENU_WIDTH : rect.left;
    setPosition({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8)),
    });
  };

  const choose = (mode: 'empty' | 'duplicate' | 'template') => {
    setPosition(null);
    if (mode === 'template') {
      setTemplatesOpen(true);
      return;
    }
    addPage({ duplicateCurrent: mode === 'duplicate' });
  };

  const pickTemplate = (id: PageTemplateId) => {
    setTemplatesOpen(false);
    addPage({ name: t.templates.items[id].name, template: buildTemplatePage(id, t, activeLanguageCode) });
  };

  const trigger = React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      toggle();
    },
  });

  const options = [
    { icon: FilePlus2, label: t.pages.addEmpty, sub: t.pages.addEmptySub, mode: 'empty' as const },
    { icon: LayoutTemplate, label: t.pages.addFromTemplate, sub: t.pages.addFromTemplateSub, mode: 'template' as const },
    { icon: Copy, label: t.pages.duplicateCurrent, sub: t.pages.duplicateCurrentSub, mode: 'duplicate' as const },
  ];

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        {trigger}
      </div>
      {position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: position.top, left: position.left, width: MENU_WIDTH }}
            className="z-[9999] p-1.5 rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl animate-fade-in"
          >
            {options.map(({ icon: Icon, label, sub, mode }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => choose(mode)}
                className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/10 transition-colors"
              >
                <Icon size={15} className="mt-0.5 text-sky-400 flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-white">{label}</span>
                  <span className="block text-[11px] text-slate-400 leading-snug">{sub}</span>
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
      {templatesOpen && <PageTemplateModal isOpen onClose={() => setTemplatesOpen(false)} onPick={pickTemplate} />}
    </>
  );
};
