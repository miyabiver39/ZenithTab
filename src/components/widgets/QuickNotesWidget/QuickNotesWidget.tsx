import React, { useState, useEffect, useRef } from 'react';
import { QuickNotesWidgetConfig } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { cn } from '../../../utils/cn';

interface QuickNotesWidgetProps {
  widgetId: string;
  config: QuickNotesWidgetConfig;
}

export const QuickNotesWidget: React.FC<QuickNotesWidgetProps> = ({ widgetId, config }) => {
  const { content = '', fontSize = 'base', fontFamily = 'sans' } = config;
  const { updateWidgetConfig } = useDashboardStore();
  const [text, setText] = useState(content);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setText(content);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateWidgetConfig(widgetId, { content: val });
    }, 400);
  };

  const fontSizes = {
    sm: 'text-xs leading-relaxed',
    base: 'text-sm leading-relaxed',
    lg: 'text-base leading-relaxed',
  }[fontSize || 'base'];

  const fontFamilies = {
    sans: 'font-sans',
    mono: 'font-mono',
    serif: 'font-serif',
  }[fontFamily || 'sans'];

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Type quick notes, markdown, tasks..."
        className={cn(
          'w-full h-full p-2 bg-transparent resize-none focus:outline-none text-slate-100 placeholder-slate-500 custom-scrollbar',
          fontSizes,
          fontFamilies
        )}
      />
    </div>
  );
};
