import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  Search, FileText, FolderOpen, Tag as TagIcon, Settings,
  Brain, LayoutDashboard, CheckSquare, Archive, Trash2,
  Pin, Star, Plus, Command, Hash, ChevronRight, Keyboard,
  Sun, Moon, Zap, Clock, X,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onNewNote: () => void;
}

interface CommandItem {
  id: string;
  type: 'note' | 'action' | 'nav' | 'setting';
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  shortcut?: string;
  action: () => void;
  keywords?: string;
}

export default function CommandPalette({ isOpen, onClose, onNavigate, onNewNote }: CommandPaletteProps) {
  const { notes } = useNotesStore();
  const { language, theme, setTheme } = useSettingsStore();
  const isRTL = language === 'ar';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navCommands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      type: 'nav',
      icon: <LayoutDashboard className="w-4 h-4 text-blue-400" />,
      label: isRTL ? 'لوحة التحكم' : 'Dashboard',
      shortcut: 'G D',
      keywords: 'dashboard home الرئيسية',
      action: () => { onNavigate('dashboard'); onClose(); },
    },
    {
      id: 'nav-notes',
      type: 'nav',
      icon: <FileText className="w-4 h-4 text-green-400" />,
      label: isRTL ? 'الملاحظات' : 'Notes',
      shortcut: 'G N',
      keywords: 'notes ملاحظات',
      action: () => { onNavigate('notes'); onClose(); },
    },
    {
      id: 'nav-ai',
      type: 'nav',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
      label: isRTL ? 'الدماغ الثاني (AI)' : 'Second Brain (AI)',
      shortcut: 'G A',
      keywords: 'ai chat brain ذكاء اصطناعي',
      action: () => { onNavigate('ai'); onClose(); },
    },
    {
      id: 'nav-tasks',
      type: 'nav',
      icon: <CheckSquare className="w-4 h-4 text-yellow-400" />,
      label: isRTL ? 'المهام' : 'Tasks',
      shortcut: 'G T',
      keywords: 'tasks todo مهام',
      action: () => { onNavigate('tasks'); onClose(); },
    },
    {
      id: 'nav-folders',
      type: 'nav',
      icon: <FolderOpen className="w-4 h-4 text-orange-400" />,
      label: isRTL ? 'المجلدات' : 'Folders',
      keywords: 'folders مجلدات',
      action: () => { onNavigate('folders'); onClose(); },
    },
    {
      id: 'nav-tags',
      type: 'nav',
      icon: <TagIcon className="w-4 h-4 text-pink-400" />,
      label: isRTL ? 'الوسوم' : 'Tags',
      keywords: 'tags وسوم',
      action: () => { onNavigate('tags'); onClose(); },
    },
    {
      id: 'nav-pinned',
      type: 'nav',
      icon: <Pin className="w-4 h-4 text-cyan-400" />,
      label: isRTL ? 'الملاحظات المثبتة' : 'Pinned Notes',
      keywords: 'pinned starred مثبتة',
      action: () => { onNavigate('pinned'); onClose(); },
    },
    {
      id: 'nav-archive',
      type: 'nav',
      icon: <Archive className="w-4 h-4 text-neutral-400" />,
      label: isRTL ? 'الأرشيف' : 'Archive',
      keywords: 'archive أرشيف',
      action: () => { onNavigate('archive'); onClose(); },
    },
    {
      id: 'nav-trash',
      type: 'nav',
      icon: <Trash2 className="w-4 h-4 text-red-400" />,
      label: isRTL ? 'سلة المهملات' : 'Trash',
      keywords: 'trash delete سلة',
      action: () => { onNavigate('trash'); onClose(); },
    },
    {
      id: 'nav-settings',
      type: 'nav',
      icon: <Settings className="w-4 h-4 text-neutral-400" />,
      label: isRTL ? 'الإعدادات' : 'Settings',
      shortcut: 'G S',
      keywords: 'settings اعدادات',
      action: () => { onNavigate('settings'); onClose(); },
    },
  ];

  const actionCommands: CommandItem[] = [
    {
      id: 'action-new-note',
      type: 'action',
      icon: <Plus className="w-4 h-4 text-primary-400" />,
      label: isRTL ? 'إنشاء ملاحظة جديدة' : 'Create New Note',
      shortcut: 'Ctrl+N',
      keywords: 'new note create جديد ملاحظة',
      action: () => { onNewNote(); onClose(); },
    },
    {
      id: 'action-toggle-theme',
      type: 'action',
      icon: theme === 'dark'
        ? <Sun className="w-4 h-4 text-yellow-400" />
        : <Moon className="w-4 h-4 text-blue-400" />,
      label: theme === 'dark'
        ? (isRTL ? 'تفعيل الوضع الفاتح' : 'Switch to Light Mode')
        : (isRTL ? 'تفعيل الوضع الداكن' : 'Switch to Dark Mode'),
      keywords: 'theme dark light وضع داكن فاتح',
      action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); onClose(); },
    },
    {
      id: 'action-search',
      type: 'action',
      icon: <Search className="w-4 h-4 text-primary-400" />,
      label: isRTL ? 'البحث المتقدم' : 'Advanced Search',
      shortcut: 'Ctrl+F',
      keywords: 'search بحث',
      action: () => { onNavigate('search'); onClose(); },
    },
  ];

  // Build all commands including live note results
  const allCommands: CommandItem[] = [...actionCommands, ...navCommands];

  const noteCommands: CommandItem[] = notes
    .filter((n) => !n.is_deleted)
    .slice(0, 50)
    .map((note) => ({
      id: `note-${note.id}`,
      type: 'note' as const,
      icon: <FileText className="w-4 h-4 text-neutral-400" />,
      label: note.title || (isRTL ? 'ملاحظة بدون عنوان' : 'Untitled Note'),
      sublabel: note.content
        ? note.content.replace(/<[^>]+>/g, '').substring(0, 60)
        : undefined,
      keywords: `${note.title} ${note.content?.replace(/<[^>]+>/g, '')}`.toLowerCase(),
      action: () => {
        useNotesStore.getState().setSelectedNote(note);
        onNavigate('notes');
        onClose();
      },
    }));

  // Fuzzy filter
  const filtered = useCallback(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return [
        { groupLabel: isRTL ? '⚡ إجراءات سريعة' : '⚡ Quick Actions', items: actionCommands.slice(0, 4) },
        { groupLabel: isRTL ? '🧭 التنقل' : '🧭 Navigation', items: navCommands.slice(0, 6) },
        { groupLabel: isRTL ? '📝 الملاحظات الأخيرة' : '📝 Recent Notes', items: noteCommands.slice(0, 5) },
      ];
    }

    const matchAll = [...allCommands, ...noteCommands].filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.keywords || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    const notes_ = matchAll.filter((c) => c.type === 'note').slice(0, 8);
    const actions_ = matchAll.filter((c) => c.type === 'action' || c.type === 'nav').slice(0, 6);

    const groups = [];
    if (actions_.length > 0) groups.push({ groupLabel: isRTL ? 'الإجراءات' : 'Actions & Pages', items: actions_ });
    if (notes_.length > 0) groups.push({ groupLabel: isRTL ? 'الملاحظات' : 'Notes', items: notes_ });
    return groups;
  }, [query, notes, isRTL]);

  const groups = filtered();
  const flatItems = groups.flatMap((g) => g.items);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatItems[selectedIndex]?.action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, selectedIndex, flatItems, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Palette container */}
      <div
        className="relative w-full max-w-xl mx-4 bg-neutral-900/95 backdrop-blur-2xl border border-neutral-700/60 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.7)] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-800/60">
          <div className="w-8 h-8 bg-primary-600/20 border border-primary-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Command className="w-4 h-4 text-primary-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isRTL ? 'اكتب لتبحث... (الإجراءات، الملاحظات، الصفحات)' : 'Search notes, actions, pages...'}
            className="flex-1 bg-transparent text-neutral-100 placeholder-neutral-600 text-sm outline-none font-medium"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-600 hover:text-neutral-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-neutral-600 bg-neutral-800 border border-neutral-700 rounded-md px-1.5 py-0.5 font-mono hidden sm:flex">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2"
        >
          {flatItems.length === 0 ? (
            <div className="text-center py-12 text-neutral-600">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{isRTL ? 'لا توجد نتائج لـ' : 'No results for'} "{query}"</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.groupLabel} className="mb-2">
                <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider px-3 py-1.5">
                  {group.groupLabel}
                </p>
                {group.items.map((item) => {
                  const idx = globalIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-start group ${
                        isSelected
                          ? 'bg-primary-600/15 border border-primary-500/20'
                          : 'hover:bg-neutral-800/60 border border-transparent'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-primary-600/20' : 'bg-neutral-800'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-neutral-100' : 'text-neutral-300'}`}>
                          {item.label}
                        </p>
                        {item.sublabel && (
                          <p className="text-xs text-neutral-600 truncate mt-0.5">{item.sublabel}</p>
                        )}
                      </div>
                      {item.shortcut && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.shortcut.split('+').map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="text-neutral-700 text-[10px]">+</span>}
                              <kbd className="text-[10px] text-neutral-600 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 font-mono">
                                {key}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                      {item.type === 'note' && (
                        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${isSelected ? 'text-neutral-400 opacity-100' : 'opacity-0'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-neutral-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-neutral-700">
            <span className="flex items-center gap-1">
              <kbd className="bg-neutral-800 border border-neutral-700 rounded px-1 font-mono">↑↓</kbd>
              {isRTL ? 'للتنقل' : 'navigate'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-neutral-800 border border-neutral-700 rounded px-1 font-mono">↵</kbd>
              {isRTL ? 'لتنفيذ' : 'select'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-neutral-700">
            <Keyboard className="w-3 h-3" />
            <span>Ctrl+K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
