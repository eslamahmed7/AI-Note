import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { useNotesStore } from './stores/notesStore';
import { setLanguage } from './lib/i18n';
import { t } from './lib/i18n';
import { Toaster } from 'react-hot-toast';

// Components
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import DashboardPage from './components/dashboard/DashboardPage';
import NotesPage from './components/notes/NotesPage';
import AIChatPage from './components/ai/AIChatPage';
import TasksPage from './components/tasks/TasksPage';
import SettingsPage from './components/settings/SettingsPage';
import VaultPage from './components/vault/VaultPage';
import SearchPage from './components/shared/SearchPage';
import FoldersPage from './components/notes/FoldersPage';
import TagsPage from './components/notes/TagsPage';
import CommandPalette from './components/shared/CommandPalette';

type Page = 'dashboard' | 'notes' | 'ai' | 'tasks' | 'settings' | 'vault' | 'search' | 'pinned' | 'archive' | 'trash' | 'folders' | 'tags';

function App() {
  const { user, session, loading, setUser, setSession, setLoading, setInitialized, fetchProfile, initialized } = useAuthStore();
  const { language, theme, setTheme, setLanguage: storeSetLanguage } = useSettingsStore();
  const { fetchFolders, fetchTags, fetchNotes } = useNotesStore();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Initialize language & theme
  useEffect(() => {
    setLanguage(language);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language, theme]);

  // Global Ctrl+K for Command Palette
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (() => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          fetchProfile();
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFolders();
      fetchTags();
      fetchNotes();
    }
  }, [user?.id]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">{t('status.loading', language)}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster
          position="top-center"
          toastOptions={{
            className: '!bg-neutral-900 !text-neutral-100 !border !border-neutral-700 !rounded-2xl !text-sm',
            duration: 3000,
          }}
        />
      </>
    );
  }

  const pageTitle: Record<Page, string> = {
    dashboard: t('nav.dashboard', language),
    notes: t('nav.notes', language),
    ai: t('nav.ai_chat', language),
    tasks: t('nav.tasks', language),
    settings: t('settings.title', language),
    vault: t('vault.title', language),
    search: t('nav.search', language),
    pinned: t('nav.starred', language),
    archive: t('nav.archive', language),
    trash: t('nav.trash', language),
    folders: t('nav.folders', language),
    tags: t('nav.tags', language),
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={(p) => setCurrentPage(p as Page)} />;
      case 'notes':
        return <NotesPage filter="all" />;
      case 'pinned':
        return <NotesPage filter="pinned" />;
      case 'archive':
        return <NotesPage filter="archived" />;
      case 'trash':
        return <NotesPage filter="deleted" />;
      case 'ai':
        return <AIChatPage />;
      case 'tasks':
        return <TasksPage />;
      case 'settings':
        return <SettingsPage />;
      case 'vault':
        return <VaultPage />;
      case 'folders':
        return <FoldersPage onNavigate={(p) => setCurrentPage(p)} />;
      case 'tags':
        return <TagsPage onNavigate={(p) => setCurrentPage(p)} />;
      case 'search':
        return <SearchPage onOpenNote={(note) => {
          useNotesStore.getState().setSelectedNote(note);
          setCurrentPage('notes');
        }} />;
      default:
        return <DashboardPage onNavigate={(p) => setCurrentPage(p as Page)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(p) => setCurrentPage(p as Page)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ms-72">
        {/* Header */}
        <Header
          title={pageTitle[currentPage]}
          onMenuToggle={() => setSidebarOpen(true)}
          onNewNote={currentPage === 'notes' ? undefined : undefined}
          onSearch={() => setCurrentPage('search')}
        />

        {/* Page content */}
        <main className="flex-1 overflow-hidden pb-16 lg:pb-0">
          {renderPage()}
        </main>

        {/* Mobile bottom nav */}
        <MobileNav
          currentPage={currentPage}
          onNavigate={(p) => setCurrentPage(p as Page)}
        />
      </div>

      <Toaster
        position={language === 'ar' ? 'top-right' : 'top-left'}
        toastOptions={{
          className: '!bg-neutral-900 !text-neutral-100 !border !border-neutral-700/60 !rounded-2xl !text-sm !shadow-glass',
          duration: 3000,
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#09090B' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#09090B' },
          },
        }}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(p) => setCurrentPage(p as Page)}
        onNewNote={() => {
          setCurrentPage('notes');
          setTimeout(() => useNotesStore.getState().setSelectedNote(null), 100);
        }}
      />
    </div>
  );
}

export default App;
