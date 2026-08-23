import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { TodoWidgetConfig, TodoItem } from '../../../types/widget';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useTranslation } from '../../../i18n/i18n';

interface TodoWidgetProps {
  widgetId: string;
  config: TodoWidgetConfig;
}

export const TodoWidget: React.FC<TodoWidgetProps> = ({ widgetId, config }) => {
  const { items = [] } = config;
  const { updateWidgetConfig } = useDashboardStore();
  const { t } = useTranslation();

  const [inputVal, setInputVal] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newItem: TodoItem = {
      id: `todo-${Date.now()}`,
      text: inputVal.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    updateWidgetConfig(widgetId, {
      items: [newItem, ...items],
    });
    setInputVal('');
  };

  const handleToggle = (id: string) => {
    const updated = items.map((it) =>
      it.id === id ? { ...it, completed: !it.completed } : it
    );
    updateWidgetConfig(widgetId, { items: updated });
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    updateWidgetConfig(widgetId, { items: updated });
  };

  const handleClearCompleted = () => {
    const updated = items.filter((it) => !it.completed);
    updateWidgetConfig(widgetId, { items: updated });
  };

  const filteredItems = items.filter((it) => {
    if (filter === 'active') return !it.completed;
    if (filter === 'completed') return it.completed;
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      {/* Add Task Form */}
      <form onSubmit={handleAdd} className="flex items-center gap-1.5 pb-2 border-b border-white/5">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={t.widgets.todo.placeholder}
          className="flex-1 px-3 py-1.5 bg-slate-800/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl transition-colors"
          title="Add"
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between py-1.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`hover:text-white capitalize transition-colors ${
                filter === f ? 'text-sky-400 font-semibold' : ''
              }`}
            >
              {t.widgets.todo[f]}
            </button>
          ))}
        </div>
        {items.some((it) => it.completed) && (
          <button
            onClick={handleClearCompleted}
            className="text-[10px] text-slate-500 hover:text-rose-300 transition-colors"
          >
            {t.widgets.todo.clearCompleted}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center p-4">
            {t.widgets.todo.noTasks}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] group transition-colors"
            >
              <div
                onClick={() => handleToggle(item.id)}
                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
              >
                {item.completed ? (
                  <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle size={15} className="text-slate-400 flex-shrink-0" />
                )}
                <span
                  className={`text-xs truncate ${
                    item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                  }`}
                >
                  {item.text}
                </span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
