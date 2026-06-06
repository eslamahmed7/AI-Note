import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTasksStore } from '../../stores/tasksStore';
import { useAuthStore } from '../../stores/authStore';
import { t } from '../../lib/i18n';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import {
  Plus, CheckSquare, Clock, AlertCircle, Circle,
  CheckCircle2, XCircle, List, Columns, Trash2,
  Calendar, Flag, ChevronDown, X, Edit3, Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { playNotificationSound, requestNotificationPermission, startAlarmSound, stopAlarmSound, DEFAULT_ALARM_SETTINGS } from '../../lib/notifications';
import type { AlarmSettings, AlarmTone } from '../../lib/notifications';

const priorityConfig: Record<TaskPriority, { label: string; class: string; icon: React.ReactNode }> = {
  urgent: { label: 'عاجل', class: 'priority-urgent', icon: <AlertCircle className="w-3 h-3" /> },
  high: { label: 'عالي', class: 'priority-high', icon: <Flag className="w-3 h-3" /> },
  medium: { label: 'متوسط', class: 'priority-medium', icon: <Flag className="w-3 h-3" /> },
  low: { label: 'منخفض', class: 'priority-low', icon: <Flag className="w-3 h-3" /> },
};

const statusColumns: { status: TaskStatus; labelKey: string; color: string }[] = [
  { status: 'todo', labelKey: 'tasks.todo', color: 'bg-neutral-500/20 text-neutral-400' },
  { status: 'in_progress', labelKey: 'tasks.in_progress', color: 'bg-blue-500/20 text-blue-400' },
  { status: 'done', labelKey: 'tasks.done', color: 'bg-green-500/20 text-green-400' },
  { status: 'cancelled', labelKey: 'tasks.cancelled', color: 'bg-red-500/20 text-red-400' },
];

export default function TasksPage() {
  const { language } = useSettingsStore();
  const { user } = useAuthStore();
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, completeTask, setShowSettingsModal } = useTasksStore();
  const isRTL = language === 'ar';
  const locale = language === 'ar' ? ar : enUS;

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDue, setEditDue] = useState('');

  const formatToLocalDatetimeLocal = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditDue(formatToLocalDatetimeLocal(task.due_date));
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editTitle.trim()) return;
    await updateTask(editingTask.id, {
      title: editTitle,
      description: editDescription || null,
      priority: editPriority,
      due_date: editDue ? new Date(editDue).toISOString() : null,
    });
    setEditingTask(null);
    toast.success(isRTL ? 'تم تحديث المهمة' : 'Task updated');
  };

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return 'Notification' in window ? Notification.permission : 'default';
  });

  const handleRemindersClick = async () => {
    if (permission !== 'granted') {
      const result = await requestNotificationPermission();
      setPermission(result);
      
      let volume = 0.8;
      try {
        const stored = localStorage.getItem('smart_notes_alarm_settings');
        if (stored) volume = JSON.parse(stored).volume;
      } catch {}
      
      playNotificationSound(volume);
      if (result === 'granted') {
        toast.success(isRTL ? 'تم تفعيل التنبيهات وتشغيل صوت تجريبي!' : 'Notifications enabled & test chime played!');
        setShowSettingsModal(true);
      } else if (result === 'denied') {
        toast.error(isRTL ? 'تم رفض إذن التنبيهات. يرجى تفعيلها من إعدادات المتصفح.' : 'Notifications permission denied. Please enable them in browser settings.');
      }
    } else {
      setShowSettingsModal(true);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    await createTask({
      user_id: user.id,
      title: newTaskTitle,
      priority: newTaskPriority,
      due_date: newTaskDue ? new Date(newTaskDue).toISOString() : null,
      status: 'todo',
    });
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskDue('');
    setShowNewTask(false);
    toast.success(isRTL ? 'تم إنشاء المهمة' : 'Task created');
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return <Circle className="w-4 h-4 text-neutral-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'done': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    overdue: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    return (
      <div className={`flex items-start gap-3 p-3 bg-neutral-900/60 hover:bg-neutral-900/80 border border-neutral-800/40 rounded-xl transition-all group ${task.status === 'done' ? 'opacity-60' : ''}`}>
        {/* Status toggle */}
        <button
          onClick={() => task.status !== 'done' ? completeTask(task.id) : updateTask(task.id, { status: 'todo', completed_at: null })}
          className="flex-shrink-0 mt-0.5"
        >
          {getStatusIcon(task.status)}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-neutral-200 ${task.status === 'done' ? 'line-through text-neutral-500' : ''}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-neutral-600 mt-0.5 truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Priority */}
            <span className={`tag-chip ${priorityConfig[task.priority].class}`}>
              {priorityConfig[task.priority].icon}
              <span>{isRTL ? priorityConfig[task.priority].label : t(`tasks.priority.${task.priority}`, language)}</span>
            </span>

            {/* Due date */}
            {task.due_date && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-neutral-600'}`}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), 'MMM d, h:mm a', { locale })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleOpenEdit(task)}
            className="p-1.5 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-600 hover:text-primary-400"
            title={isRTL ? 'تعديل المهمة' : 'Edit task'}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1.5 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-600 hover:text-red-400"
            title={isRTL ? 'حذف المهمة' : 'Delete task'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-neutral-800/40">
        {[
          { label: isRTL ? 'الكل' : 'Total', value: stats.total, color: 'text-neutral-400' },
          { label: isRTL ? 'قيد التنفيذ' : 'In Progress', value: stats.in_progress, color: 'text-blue-400' },
          { label: isRTL ? 'مكتمل' : 'Done', value: stats.done, color: 'text-green-400' },
          { label: isRTL ? 'متأخرة' : 'Overdue', value: stats.overdue, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-neutral-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-neutral-800/40">
        {/* Filter tabs */}
        <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
          {(['all', 'todo', 'in_progress', 'done', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                filterStatus === s
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/50'
              }`}
            >
              {s === 'all' ? (isRTL ? 'الكل' : 'All') : t(`tasks.${s}`, language)}
            </button>
          ))}
        </div>

        {/* Enable Reminders Button */}
        <button
          onClick={handleRemindersClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex-shrink-0 ${
            permission === 'granted'
              ? 'bg-green-500/10 text-green-400 border-green-500/30'
              : 'bg-primary-600/10 text-primary-400 border-primary-500/30 hover:bg-primary-600/20'
          }`}
          title={isRTL ? 'إعدادات المنبه وتفعيل الإشعارات' : 'Alarm settings & enable notifications'}
        >
          <Bell className={`w-3.5 h-3.5 ${permission !== 'granted' ? 'animate-bounce' : ''}`} />
          <span className="hidden sm:inline">
            {permission === 'granted'
              ? (isRTL ? 'إعدادات المنبه' : 'Alarm Settings')
              : (isRTL ? 'تفعيل التنبيهات' : 'Enable Reminders')}
          </span>
        </button>

        {/* View mode */}
        <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-neutral-700 text-neutral-200' : 'text-neutral-600'}`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-neutral-700 text-neutral-200' : 'text-neutral-600'}`}
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* New task form */}
        {showNewTask && (
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 mb-4 animate-scale-in">
            <input
              type="text"
              placeholder={isRTL ? 'عنوان المهمة...' : 'Task title...'}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
              className="input-field text-sm mb-3"
              autoFocus
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <div className="flex flex-wrap items-center gap-2">
              {/* Priority */}
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{t(`tasks.priority.${p}`, language)}</option>
                ))}
              </select>

              {/* Due date */}
              <input
                type="datetime-local"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />

              <div className="flex gap-2 ms-auto">
                <button
                  onClick={() => setShowNewTask(false)}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  {t('action.cancel', language)}
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="btn-primary text-xs px-3 py-2"
                >
                  {t('action.add', language)}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CheckSquare className="w-10 h-10 text-neutral-700 mb-3" />
            <h3 className="font-medium text-neutral-500 mb-1">{t('tasks.empty', language)}</h3>
            <p className="text-sm text-neutral-700">{t('tasks.empty_desc', language)}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        ) : (
          /* Kanban view */
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {statusColumns.map(({ status, labelKey, color }) => {
              const colTasks = tasks.filter((t) => t.status === status);
              return (
                <div key={status} className="kanban-col min-w-[85vw] sm:min-w-0 snap-center shrink-0 sm:shrink">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
                      {t(labelKey, language)}
                    </span>
                    <span className="text-xs text-neutral-700 bg-neutral-800 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-neutral-900 border border-neutral-800/60 rounded-xl p-3 hover:border-neutral-700 transition-colors group relative"
                      >
                        <p className="text-xs text-neutral-300 mb-1 pr-12">{task.title}</p>
                        {task.description && (
                          <p className="text-[10px] text-neutral-600 mb-2 truncate">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`tag-chip text-[10px] px-1.5 py-0.5 ${priorityConfig[task.priority].class}`}>
                            {t(`tasks.priority.${task.priority}`, language)}
                          </span>
                          {task.due_date && (
                            <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                              <span>{format(new Date(task.due_date), 'MMM d, h:mm a', { locale })}</span>
                            </span>
                          )}
                        </div>

                        {/* Hover actions in Kanban card */}
                        <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 pl-1 rounded-lg">
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1 hover:bg-neutral-800 rounded text-neutral-600 hover:text-primary-400"
                            title={isRTL ? 'تعديل المهمة' : 'Edit task'}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 hover:bg-neutral-800 rounded text-neutral-600 hover:text-red-400"
                            title={isRTL ? 'حذف المهمة' : 'Delete task'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNewTask(true)}
        className="fab"
        style={{ bottom: '5.5rem' }}
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md text-right shadow-2xl animate-scale-in" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary-400" />
                <span>{isRTL ? 'تعديل المهمة' : 'Edit Task'}</span>
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-left" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {/* Task Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400 font-medium text-right">
                  {isRTL ? 'عنوان المهمة' : 'Task Title'}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={isRTL ? 'مثال: مراجعة الكود الجديد...' : 'e.g. Review code...'}
                  className="input-field text-sm w-full"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Task Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400 font-medium text-right">
                  {isRTL ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={isRTL ? 'اكتب تفاصيل إضافية للمهمة...' : 'Add details...'}
                  rows={3}
                  className="bg-neutral-850 border border-neutral-750 text-neutral-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 w-full resize-none"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400 font-medium text-right">
                    {isRTL ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none w-full"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <option value="urgent">{isRTL ? 'عاجل' : 'Urgent'}</option>
                    <option value="high">{isRTL ? 'عالي' : 'High'}</option>
                    <option value="medium">{isRTL ? 'متوسط' : 'Medium'}</option>
                    <option value="low">{isRTL ? 'منخفض' : 'Low'}</option>
                  </select>
                </div>

                {/* Due Date & Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-neutral-400 font-medium text-right">
                    {isRTL ? 'تاريخ ووقت الاستحقاق' : 'Due Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={editDue}
                    onChange={(e) => setEditDue(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-none w-full"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditingTask(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                className="btn-primary text-xs px-4 py-2"
              >
                {isRTL ? 'حفظ التغيرات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
