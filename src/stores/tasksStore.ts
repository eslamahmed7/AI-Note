import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { useAuthStore } from './authStore';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: (opts?: { archived?: boolean }) => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (opts = {}) => {
    set({ loading: true });
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('is_deleted', false)
        .order('position', { ascending: true });

      if (opts.archived) {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('is_archived', false);
      }

      const { data } = await query;
      if (data) set({ tasks: data as Task[] });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (!error && task) {
      set((state) => ({ tasks: [...state.tasks, task as Task] }));
      return task as Task;
    }
    return null;
  },

  updateTask: async (id, data) => {
    const { data: updated } = await supabase
      .from('tasks')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } as Task : t)),
      }));
    }
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').update({ is_deleted: true }).eq('id', id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  completeTask: async (id) => {
    const { data: updated } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } as Task : t)),
      }));
    }
  },
}));
