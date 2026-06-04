import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotesStore } from '../../stores/notesStore';
import { useTasksStore } from '../../stores/tasksStore';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/i18n';
import { Note } from '../../types';
import {
  StickyNote, CheckSquare, MessageSquare, HardDrive,
  TrendingUp, Clock, Pin, Brain, Sparkles, Plus,
  ArrowRight, ArrowLeft, BarChart3, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface DashboardStats {
  notes_count: number;
  tasks_count: number;
  tasks_done: number;
  files_count: number;
  storage_used: number;
  chats_count: number;
  notes_by_type: Record<string, number>;
  activity: Array<{ date: string; count: number }>;
}

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { language } = useSettingsStore();
  const { profile } = useAuthStore();
  const { notes, fetchNotes } = useNotesStore();
  const { tasks, fetchTasks } = useTasksStore();
  const isRTL = language === 'ar';
  const locale = language === 'ar' ? ar : enUS;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [stats, setStats] = useState<DashboardStats>({
    notes_count: 0,
    tasks_count: 0,
    tasks_done: 0,
    files_count: 0,
    storage_used: 0,
    chats_count: 0,
    notes_by_type: {},
    activity: [],
  });

  useEffect(() => {
    fetchNotes();
    fetchTasks();
    loadStats();
  }, []);

  const loadStats = async () => {
    const [notesRes, tasksRes, chatsRes] = await Promise.all([
      supabase.from('notes').select('id, note_type, created_at', { count: 'exact' }).eq('is_deleted', false),
      supabase.from('tasks').select('id, status', { count: 'exact' }).eq('is_deleted', false),
      supabase.from('ai_chats').select('id', { count: 'exact' }),
    ]);

    const notesData = notesRes.data || [];
    const tasksData = tasksRes.data || [];

    // Activity for last 7 days
    const activity = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = notesData.filter((n: Record<string, string>) =>
        n.created_at?.startsWith(dateStr)
      ).length;
      return {
        date: format(date, 'EEE', { locale }),
        count,
      };
    });

    // Notes by type
    const byType: Record<string, number> = {};
    notesData.forEach((n: Record<string, string>) => {
      byType[n.note_type] = (byType[n.note_type] || 0) + 1;
    });

    setStats({
      notes_count: notesRes.count || 0,
      tasks_count: tasksRes.count || 0,
      tasks_done: tasksData.filter((t: Record<string, string>) => t.status === 'done').length,
      files_count: notesData.filter((n: Record<string, string>) => ['image', 'video', 'pdf', 'file'].includes(n.note_type)).length,
      storage_used: profile?.storage_used || 0,
      chats_count: chatsRes.count || 0,
      notes_by_type: byType,
      activity,
    });
  };

  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const recentNotes = notes.slice(0, 5);
  const pendingTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').slice(0, 5);
  const taskCompletion = stats.tasks_count > 0 ? Math.round((stats.tasks_done / stats.tasks_count) * 100) : 0;

  const typeColors: Record<string, string> = {
    text: '#3B82F6',
    voice: '#22C55E',
    image: '#EC4899',
    video: '#EF4444',
    pdf: '#F97316',
    link: '#06B6D4',
    file: '#A855F7',
  };

  const pieData = Object.entries(stats.notes_by_type).map(([type, count]) => ({
    name: t(`notes.type.${type}`, language),
    value: count,
    color: typeColors[type] || '#666',
  }));

  const greeting = () => {
    const hour = new Date().getHours();
    if (language === 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 18) return 'مساء الخير';
      return 'مساء النور';
    } else {
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    }
  };

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-100">
              {greeting()}{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
            </h2>
            <p className="text-neutral-500 text-sm mt-1">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <div className="w-12 h-12 bg-primary-600/20 border border-primary-500/30 rounded-2xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-400" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: t('dashboard.total_notes', language),
              value: stats.notes_count,
              icon: StickyNote,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
              page: 'notes',
            },
            {
              label: t('dashboard.total_tasks', language),
              value: stats.tasks_count,
              icon: CheckSquare,
              color: 'text-green-400',
              bg: 'bg-green-500/10 border-green-500/20',
              page: 'tasks',
            },
            {
              label: t('nav.ai_chat', language),
              value: stats.chats_count,
              icon: MessageSquare,
              color: 'text-primary-400',
              bg: 'bg-primary-500/10 border-primary-500/20',
              page: 'ai',
            },
            {
              label: t('dashboard.storage', language),
              value: formatStorage(stats.storage_used),
              icon: HardDrive,
              color: 'text-orange-400',
              bg: 'bg-orange-500/10 border-orange-500/20',
              page: 'settings',
            },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => onNavigate(stat.page)}
              className={`${stat.bg} border rounded-2xl p-4 text-start hover:scale-[1.02] transition-all duration-200 group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <ArrowIcon className={`w-3.5 h-3.5 ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity mt-1`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Task completion + Activity chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity */}
          <div className="lg:col-span-2 glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-neutral-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-400" />
                {t('dashboard.activity', language)}
              </h3>
              <span className="text-xs text-neutral-600">{isRTL ? 'آخر 7 أيام' : 'Last 7 days'}</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={stats.activity}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#A1A1AA' }}
                  itemStyle={{ color: '#60A5FA' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="url(#actGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Task progress */}
          <div className="glass rounded-2xl p-4 flex flex-col">
            <h3 className="font-semibold text-sm text-neutral-200 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-green-400" />
              {t('dashboard.completed_tasks', language)}
            </h3>

            {/* Progress ring */}
            <div className="flex items-center justify-center flex-1">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272A" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="2.5"
                    strokeDasharray={`${taskCompletion} ${100 - taskCompletion}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-green-400">{taskCompletion}%</span>
                  <span className="text-xs text-neutral-600">{isRTL ? 'مكتمل' : 'done'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-3">
              <span className="text-neutral-500">{stats.tasks_done} {isRTL ? 'مكتمل' : 'done'}</span>
              <span className="text-neutral-500">{stats.tasks_count} {isRTL ? 'إجمالي' : 'total'}</span>
            </div>
          </div>
        </div>

        {/* Recent notes + Pending tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent notes */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-neutral-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-400" />
                {t('dashboard.recent_notes', language)}
              </h3>
              <button
                onClick={() => onNavigate('notes')}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                {isRTL ? 'الكل' : 'View all'}
                <ArrowIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {recentNotes.length === 0 ? (
                <p className="text-xs text-neutral-600 py-4 text-center">{t('notes.empty', language)}</p>
              ) : (
                recentNotes.map((note) => (
                  <div key={note.id} className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/30 rounded-xl transition-colors cursor-pointer group">
                    <div className="w-8 h-8 bg-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <StickyNote className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-300 truncate">
                        {note.title || t('notes.untitled', language)}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true, locale })}
                      </p>
                    </div>
                    {note.is_pinned && <Pin className="w-3 h-3 text-primary-400 flex-shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending tasks */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-neutral-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-400" />
                {isRTL ? 'المهام المعلقة' : 'Pending Tasks'}
              </h3>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                {isRTL ? 'الكل' : 'View all'}
                <ArrowIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-neutral-600 py-4 text-center">{t('tasks.empty', language)}</p>
              ) : (
                pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 hover:bg-neutral-800/30 rounded-xl transition-colors cursor-pointer">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'urgent' ? 'bg-red-400' :
                      task.priority === 'high' ? 'bg-orange-400' :
                      task.priority === 'medium' ? 'bg-yellow-400' : 'bg-neutral-500'
                    }`} />
                    <p className="text-xs text-neutral-300 flex-1 truncate">{task.title}</p>
                    {task.due_date && (
                      <span className="text-xs text-neutral-600 flex-shrink-0">
                        {format(new Date(task.due_date), 'MM/dd')}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notes by type pie chart */}
        {pieData.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <h3 className="font-semibold text-sm text-neutral-200 flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary-400" />
              {isRTL ? 'توزيع الملاحظات' : 'Notes Distribution'}
            </h3>
            <div className="flex items-center gap-8 flex-wrap">
              <PieChart width={140} height={140}>
                <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-2 flex-1">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-neutral-400 flex-1">{entry.name}</span>
                    <span className="text-xs font-medium text-neutral-300">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
