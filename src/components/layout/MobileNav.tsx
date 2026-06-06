import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { t } from '../../lib/i18n';
import { LayoutDashboard, StickyNote, CheckSquare, MessageSquare, Folder } from 'lucide-react';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  const { language } = useSettingsStore();

  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('nav.dashboard', language) },
    { id: 'notes', icon: StickyNote, label: t('nav.notes', language) },
    { id: 'ai', icon: MessageSquare, label: t('nav.ai_chat', language) },
    { id: 'tasks', icon: CheckSquare, label: t('nav.tasks', language) },
    { id: 'folders', icon: Folder, label: t('nav.folders', language) },
  ];

  return (
    <nav className="mobile-nav lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              currentPage === item.id
                ? 'text-primary-400'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform ${currentPage === item.id ? 'scale-110' : ''}`} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
