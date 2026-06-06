import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';
import {
  Brain, LayoutDashboard, StickyNote, CheckSquare, MessageSquare,
  Folder, Tag, Pin, Archive, Trash2, Settings, Shield,
  ChevronRight, ChevronLeft, ChevronDown, Plus, Search,
  LogOut, Moon, Sun, Globe, X
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuthStore();
  const { language, theme, setTheme } = useSettingsStore();
  const { folders } = useNotesStore();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const isRTL = language === 'ar';

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('nav.dashboard', language) },
    { id: 'notes', icon: StickyNote, label: t('nav.notes', language) },
    { id: 'tasks', icon: CheckSquare, label: t('nav.tasks', language) },
    { id: 'ai', icon: MessageSquare, label: t('nav.ai_chat', language) },
  ];

  const secondaryItems = [
    { id: 'pinned', icon: Pin, label: t('nav.starred', language) },
    { id: 'archive', icon: Archive, label: t('nav.archive', language) },
    { id: 'trash', icon: Trash2, label: t('nav.trash', language) },
  ];

  const handle = (page: string) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 z-50 lg:z-auto
          w-72 flex flex-col
          bg-neutral-950 border-e border-neutral-800/60
          transition-transform duration-300 ease-in-out
          pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]
          ${isRTL ? 'right-0' : 'left-0'}
          ${isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-100">Smart Notes</div>
              <div className="text-xs text-neutral-500">{t('app.tagline', language)}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => handle('search')}
            className="w-full flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800/60 rounded-xl px-3 py-2.5 text-neutral-500 hover:text-neutral-400 transition-all duration-200 text-sm"
          >
            <Search className="w-4 h-4" />
            <span>{t('search.placeholder', language)}</span>
            <kbd className="ms-auto text-xs bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600">⌘K</kbd>
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'notes') {
                  useNotesStore.getState().setActiveFolderId(null);
                  useNotesStore.getState().setActiveTagId(null);
                }
                handle(item.id);
              }}
              className={`sidebar-item w-full ${currentPage === item.id ? 'active' : ''}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}

          {/* Divider */}
          <div className="h-px bg-neutral-800/60 my-2" />

          {/* Folders */}
          <div>
            <button
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="sidebar-item w-full"
            >
              <Folder className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-start">{t('nav.folders', language)}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${foldersExpanded ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>

            {foldersExpanded && (
              <div className="ms-4 mt-0.5 space-y-0.5 border-s border-neutral-800/40 ps-3">
                {folders.slice(0, 8).map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => { useNotesStore.getState().setActiveFolderId(folder.id); handle('notes'); }}
                    className="sidebar-item w-full text-xs py-1.5 flex items-center justify-between group/folder cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="truncate flex-1 text-start text-neutral-400 group-hover/folder:text-neutral-200 transition-colors">{folder.name}</span>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = window.confirm(
                          isRTL 
                            ? `هل أنت متأكد من حذف مجلد "${folder.name}"؟` 
                            : `Are you sure you want to delete folder "${folder.name}"?`
                        );
                        if (confirmed) {
                          await useNotesStore.getState().deleteFolder(folder.id);
                          toast.success(isRTL ? 'تم حذف المجلد' : 'Folder deleted');
                        }
                      }}
                      className="opacity-0 group-hover/folder:opacity-100 p-1 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-red-400 transition-all flex-shrink-0"
                      title={isRTL ? 'حذف المجلد' : 'Delete Folder'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handle('folders')}
                  className="sidebar-item w-full text-xs py-2 text-neutral-600 hover:text-neutral-400"
                >
                  <Plus className="w-3 h-3" />
                  {t('folders.new', language)}
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <button
            onClick={() => handle('tags')}
            className={`sidebar-item w-full ${currentPage === 'tags' ? 'active' : ''}`}
          >
            <Tag className="w-4 h-4 flex-shrink-0" />
            {t('nav.tags', language)}
          </button>

          <div className="h-px bg-neutral-800/60 my-2" />

          {secondaryItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handle(item.id)}
              className={`sidebar-item w-full ${currentPage === item.id ? 'active' : ''}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom area */}
        <div className="border-t border-neutral-800/60 p-3 space-y-1">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="sidebar-item w-full"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? t('settings.light', language) : t('settings.dark', language)}
          </button>

          {/* Settings */}
          <button
            onClick={() => handle('settings')}
            className={`sidebar-item w-full ${currentPage === 'settings' ? 'active' : ''}`}
          >
            <Settings className="w-4 h-4" />
            {t('settings.title', language)}
          </button>

          {/* User profile */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/20 flex items-center justify-center text-primary-400 font-semibold text-sm flex-shrink-0">
              {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-200 truncate">
                {profile?.display_name ?? 'User'}
              </div>
              <div className="text-xs text-neutral-600 truncate">
                {profile?.notes_count ?? 0} {t('nav.notes', language)}
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-600 hover:text-red-400"
              title={t('auth.logout', language)}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
