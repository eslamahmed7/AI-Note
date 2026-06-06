import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTasksStore } from '../../stores/tasksStore';
import { t } from '../../lib/i18n';
import { Menu, Search, Bell, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
  onNewNote?: () => void;
  onSearch?: () => void;
}

export default function Header({ title, onMenuToggle, onNewNote, onSearch }: HeaderProps) {
  const { language } = useSettingsStore();
  const { tasks, setShowSettingsModal } = useTasksStore();
  const isRTL = language === 'ar';

  // Check if we have active/overdue tasks with reminders to show the notification dot
  const hasOverdueOrPendingTasks = tasks.some(
    (t) => t.due_date && t.status !== 'done' && t.status !== 'cancelled'
  );

  return (
    <header className="min-h-14 h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-4 border-b border-neutral-800/60 bg-neutral-950/90 backdrop-blur-xl sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-neutral-800/60 rounded-xl transition-colors text-neutral-400 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-neutral-100 text-base truncate">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        {onSearch && (
          <button
            onClick={onSearch}
            className="p-2 hover:bg-neutral-800/60 rounded-xl transition-colors text-neutral-500 hover:text-neutral-300"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        )}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 hover:bg-neutral-800/60 rounded-xl transition-colors text-neutral-500 hover:text-neutral-300 relative"
          title={isRTL ? 'إعدادات المنبه والتنبيهات' : 'Alarm & Notifications Settings'}
        >
          <Bell className="w-4.5 h-4.5" />
          {hasOverdueOrPendingTasks && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
          )}
        </button>
        {onNewNote && (
          <button
            onClick={onNewNote}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium px-3 py-2 rounded-xl transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('notes.new', language)}</span>
          </button>
        )}
      </div>
    </header>
  );
}
