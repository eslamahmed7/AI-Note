import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { useNotesStore } from './stores/notesStore';
import { useTasksStore } from './stores/tasksStore';
import { setLanguage } from './lib/i18n';
import { t } from './lib/i18n';
import toast, { Toaster } from 'react-hot-toast';
import { triggerNotification, startAlarmSound, stopAlarmSound, playNotificationSound, playTonePreview, DEFAULT_ALARM_SETTINGS } from './lib/notifications';
import type { AlarmSettings } from './lib/notifications';
import { BellRing, Check, Clock, X } from 'lucide-react';
import type { Task } from './types';

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
import SearchPage from './components/shared/SearchPage';
import FoldersPage from './components/notes/FoldersPage';
import TagsPage from './components/notes/TagsPage';
import CommandPalette from './components/shared/CommandPalette';

type Page = 'dashboard' | 'notes' | 'ai' | 'tasks' | 'settings' | 'search' | 'pinned' | 'archive' | 'trash' | 'folders' | 'tags' | 'vault';

function App() {
  const { user, session, loading, setUser, setSession, setLoading, setInitialized, fetchProfile, initialized } = useAuthStore();
  const { language, theme, setTheme, setLanguage: storeSetLanguage } = useSettingsStore();
  const { fetchFolders, fetchTags, fetchNotes } = useNotesStore();
  const { tasks, fetchTasks, showSettingsModal, setShowSettingsModal } = useTasksStore();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('notified_task_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);

  const [alarmSettings, setAlarmSettings] = useState<AlarmSettings>(() => {
    try {
      const stored = localStorage.getItem('smart_notes_alarm_settings');
      return stored ? JSON.parse(stored) : DEFAULT_ALARM_SETTINGS;
    } catch {
      return DEFAULT_ALARM_SETTINGS;
    }
  });

  const updateAlarmSetting = (updates: Partial<AlarmSettings>) => {
    setAlarmSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('smart_notes_alarm_settings', JSON.stringify(next));
      return next;
    });
  };

  const handleCloseSettingsModal = () => {
    stopAlarmSound();
    setShowSettingsModal(false);
  };

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
      fetchTasks();
    }
  }, [user?.id]);

  // Synchronize refs for background timer to avoid resetting interval
  const tasksRef = useRef(tasks);
  const notifiedTaskIdsRef = useRef(notifiedTaskIds);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    notifiedTaskIdsRef.current = notifiedTaskIds;
  }, [notifiedTaskIds]);

  // Read alarm settings from localStorage
  const getLatestAlarmSettings = (): AlarmSettings => {
    try {
      const stored = localStorage.getItem('smart_notes_alarm_settings');
      return stored ? JSON.parse(stored) : DEFAULT_ALARM_SETTINGS;
    } catch {
      return DEFAULT_ALARM_SETTINGS;
    }
  };

  // Background task reminder check
  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const currentTasks = tasksRef.current;
      const currentNotified = notifiedTaskIdsRef.current;
      const now = new Date();

      const dueTasks = currentTasks.filter((task) => {
        if (task.status === 'done' || task.status === 'cancelled' || !task.due_date) {
          return false;
        }
        const dueDate = new Date(task.due_date);
        return dueDate <= now && !currentNotified.has(task.id);
      });

      if (dueTasks.length > 0) {
        const updated = new Set(currentNotified);
        const settings = getLatestAlarmSettings();

        // Show push notification and toast for all due tasks
        dueTasks.forEach((task) => {
          updated.add(task.id);
          triggerNotification(
            language === 'ar' ? 'تنبيه بمهمة' : 'Task Reminder',
            task.title,
            language === 'ar'
          );
        });

        // Trigger continuous alarm or single play depending on settings
        if (settings.loop) {
          setActiveAlarmTask(dueTasks[0]);
          startAlarmSound(settings.volume, settings.tone);
        } else {
          playNotificationSound(settings.volume);
        }

        setNotifiedTaskIds(updated);
        localStorage.setItem('notified_task_ids', JSON.stringify(Array.from(updated)));
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [user, language]);

  // Clean up notified IDs of tasks that are completed, cancelled, or no longer in tasks list
  useEffect(() => {
    if (tasks.length === 0) return;
    const activePendingTaskIds = new Set(
      tasks
        .filter((t) => t.status !== 'done' && t.status !== 'cancelled' && t.due_date && new Date(t.due_date) <= new Date())
        .map((t) => t.id)
    );

    let changed = false;
    const cleaned = new Set<string>();
    notifiedTaskIds.forEach((id) => {
      if (activePendingTaskIds.has(id)) {
        cleaned.add(id);
      } else {
        changed = true;
      }
    });

    if (changed) {
      setNotifiedTaskIds(cleaned);
      localStorage.setItem('notified_task_ids', JSON.stringify(Array.from(cleaned)));
    }
  }, [tasks]);

  // Alarm action handlers
  const handleSnoozeAlarm = async () => {
    if (!activeAlarmTask) return;
    stopAlarmSound();
    
    // Add 5 minutes to due_date
    const newDueDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // Remove from notifiedTaskIds so it can trigger again in 5 minutes
    const updatedNotified = new Set(notifiedTaskIds);
    updatedNotified.delete(activeAlarmTask.id);
    setNotifiedTaskIds(updatedNotified);
    localStorage.setItem('notified_task_ids', JSON.stringify(Array.from(updatedNotified)));
    
    // Update task in state and DB
    await useTasksStore.getState().updateTask(activeAlarmTask.id, { due_date: newDueDate });
    
    setActiveAlarmTask(null);
    toast.success(language === 'ar' ? 'تم تأجيل التنبيه لـ 5 دقائق' : 'Alarm snoozed for 5 minutes');
  };

  const handleCompleteAlarm = async () => {
    if (!activeAlarmTask) return;
    stopAlarmSound();
    
    // Mark task as completed
    await useTasksStore.getState().completeTask(activeAlarmTask.id);
    
    setActiveAlarmTask(null);
    toast.success(language === 'ar' ? 'تمت المهمة بنجاح!' : 'Task completed successfully!');
  };

  const handleDismissAlarm = () => {
    stopAlarmSound();
    setActiveAlarmTask(null);
  };

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
    search: t('nav.search', language),
    pinned: t('nav.starred', language),
    archive: t('nav.archive', language),
    trash: t('nav.trash', language),
    folders: t('nav.folders', language),
    tags: t('nav.tags', language),
    vault: t('nav.vault', language),
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

      {/* Global Alarm Overlay */}
      {activeAlarmTask && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md text-center shadow-2xl animate-scale-in">
            {/* Animated pulsating alarm bell */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                <div className="relative bg-red-500/10 border border-red-500/30 p-5 rounded-full text-red-400">
                  <BellRing className="w-10 h-10 animate-bounce" />
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-neutral-100 mb-2">
              {language === 'ar' ? 'منبه المهمة' : 'Task Alarm'}
            </h3>
            
            <p className="text-neutral-300 text-lg font-semibold mb-6 px-4 py-3 bg-neutral-950/60 rounded-2xl border border-neutral-800/40 break-words">
              {activeAlarmTask.title}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleSnoozeAlarm}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-750/80 border border-neutral-700/40 text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs font-semibold">
                  {language === 'ar' ? 'غفوة 5 د' : 'Snooze 5m'}
                </span>
              </button>
              
              <button
                onClick={handleCompleteAlarm}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-5 h-5" />
                <span className="text-xs font-semibold">
                  {language === 'ar' ? 'تمت المهمة' : 'Done'}
                </span>
              </button>
              
              <button
                onClick={handleDismissAlarm}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-750/80 border border-neutral-700/40 text-neutral-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <X className="w-5 h-5 text-red-400" />
                <span className="text-xs font-semibold">
                  {language === 'ar' ? 'إغلاق' : 'Dismiss'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alarm Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm text-right shadow-2xl animate-scale-in" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-primary-400 animate-pulse" />
                <span>{language === 'ar' ? 'إعدادات تنبيهات المهام' : 'Task Alarm Settings'}</span>
              </h3>
              <button
                onClick={handleCloseSettingsModal}
                className="p-1 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Volume Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-neutral-400 font-medium">
                  <span>{language === 'ar' ? 'مستوى الصوت' : 'Volume'}</span>
                  <span>{Math.round(alarmSettings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={alarmSettings.volume}
                  onChange={(e) => updateAlarmSetting({ volume: parseFloat(e.target.value) })}
                  onMouseUp={() => playTonePreview(alarmSettings.volume, alarmSettings.tone)}
                  onTouchEnd={() => playTonePreview(alarmSettings.volume, alarmSettings.tone)}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>

              {/* Tone Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-neutral-400 font-medium">
                  {language === 'ar' ? 'نغمة التنبيه' : 'Alarm Tone'}
                </label>
                <select
                  value={alarmSettings.tone}
                  onChange={(e) => {
                    const newTone = e.target.value as any;
                    updateAlarmSetting({ tone: newTone });
                    playTonePreview(alarmSettings.volume, newTone);
                  }}
                  className="bg-neutral-850 border border-neutral-750 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none w-full"
                >
                  <option value="digital">{language === 'ar' ? 'نغمة رقمية (منبه)' : 'Digital Beep (Alarm)'}</option>
                  <option value="chime">{language === 'ar' ? 'نغمة رنين (تناغم)' : 'Chime Chord (Arpeggio)'}</option>
                  <option value="soothing">{language === 'ar' ? 'نغمة هادئة (جرس)' : 'Soothing Bell (Sweep)'}</option>
                  <option value="retro">{language === 'ar' ? 'نغمة كلاسيكية (Retro)' : 'Retro Gaming (Bleeps)'}</option>
                  <option value="pulse">{language === 'ar' ? 'نبض الرادار (Pulse)' : 'Radar Pulse (Warning)'}</option>
                  <option value="gentle">{language === 'ar' ? 'نغمة لطيفة' : 'Gentle (Soft)'}</option>
                  <option value="urgent">{language === 'ar' ? 'تنبيه عاجل' : 'Urgent (Fast Beeps)'}</option>
                  <option value="echo">{language === 'ar' ? 'صدى (Echo)' : 'Echo (Resonant)'}</option>
                  <option value="crystal">{language === 'ar' ? 'كريستال (Crystal)' : 'Crystal (Clear)'}</option>
                </select>
              </div>

              {/* Loop alarm toggle */}
              <div className="flex items-center justify-between bg-neutral-950/40 border border-neutral-800/40 p-3 rounded-2xl">
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-xs font-semibold text-neutral-200">
                    {language === 'ar' ? 'تكرار التنبيه كمنبه مستمر' : 'Loop Alarm continuously'}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {language === 'ar' ? 'سيستمر الصوت بالعمل حتى تغلقه يدوياً' : 'Will play repeatedly until dismissed'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={alarmSettings.loop}
                  onChange={(e) => updateAlarmSetting({ loop: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-750 text-primary-600 focus:ring-primary-500/20 bg-neutral-850"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseSettingsModal}
                className="btn-primary text-xs px-4 py-2 w-full sm:w-auto"
              >
                {language === 'ar' ? 'موافق' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
