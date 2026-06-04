import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Note, Folder, Tag } from '../types';
import { useAuthStore } from './authStore';

interface NotesState {
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  loading: boolean;
  selectedNote: Note | null;
  activeFolderId: string | null;
  activeTagId: string | null;
  searchQuery: string;
  viewMode: 'grid' | 'list';
  fetchNotes: (opts?: { folderId?: string; tagId?: string; archived?: boolean; deleted?: boolean; pinned?: boolean }) => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchTags: () => Promise<void>;
  createNote: (data: Partial<Note>) => Promise<Note | null>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  createFolder: (name: string, parentId?: string | null, color?: string) => Promise<Folder | null>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<void>;
  setSelectedNote: (note: Note | null) => void;
  setActiveFolderId: (id: string | null) => void;
  setActiveTagId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  tags: [],
  loading: false,
  selectedNote: null,
  activeFolderId: null,
  activeTagId: null,
  searchQuery: '',
  viewMode: 'grid',

  fetchNotes: async (opts = {}) => {
    set({ loading: true });
    try {
      let query = supabase
        .from('notes')
        .select('*, tags:note_tags(tag:tags(*))')
        .order('updated_at', { ascending: false });

      if (opts.folderId) {
        query = query.eq('folder_id', opts.folderId);
      }
      if (opts.archived) {
        query = query.eq('is_archived', true).eq('is_deleted', false);
      } else if (opts.deleted) {
        query = query.eq('is_deleted', true);
      } else if (opts.pinned) {
        query = query.eq('is_pinned', true).eq('is_archived', false).eq('is_deleted', false);
      } else {
        query = query.eq('is_archived', false).eq('is_deleted', false);
      }

      if (opts.tagId) {
        const { data: noteTags } = await supabase
          .from('note_tags')
          .select('note_id')
          .eq('tag_id', opts.tagId);
        const noteIds = noteTags?.map((nt) => nt.note_id) || [];
        query = query.in('id', noteIds);
      }

      const { data, error } = await query;
      if (!error && data) {
        const notes = data.map((n: Record<string, unknown>) => ({
          ...n,
          tags: (n.tags as Array<{ tag: Tag }> | null)?.map((t) => t.tag).filter(Boolean) ?? [],
        })) as Note[];
        set({ notes });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchFolders: async () => {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .order('position', { ascending: true });
    if (data) set({ folders: data as Folder[] });
  },

  fetchTags: async () => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });
    if (data) set({ tags: data as Tag[] });
  },

  createNote: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    const { data: note, error } = await supabase
      .from('notes')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (!error && note) {
      set((state) => ({ notes: [note as Note, ...state.notes] }));
      return note as Note;
    }
    return null;
  },

  updateNote: async (id, data) => {
    const { data: updated, error } = await supabase
      .from('notes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error && updated) {
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...updated } as Note : n)),
        selectedNote: state.selectedNote?.id === id ? { ...state.selectedNote, ...updated } as Note : state.selectedNote,
      }));
    }
  },

  deleteNote: async (id) => {
    await supabase
      .from('notes')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  permanentlyDeleteNote: async (id) => {
    await supabase.from('notes').delete().eq('id', id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  restoreNote: async (id) => {
    await supabase
      .from('notes')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  createFolder: async (name, parentId, color = '#3B82F6') => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    const { data, error } = await supabase
      .from('folders')
      .insert({ name, parent_id: parentId || null, color, user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      set((state) => ({ folders: [...state.folders, data as Folder] }));
      return data as Folder;
    }
    return null;
  },

  updateFolder: async (id, data) => {
    const { data: updated } = await supabase
      .from('folders')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (updated) {
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? { ...f, ...updated } as Folder : f)),
      }));
    }
  },

  deleteFolder: async (id) => {
    await supabase.from('folders').delete().eq('id', id);
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
  },

  createTag: async (name, color = '#10B981') => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    const { data, error } = await supabase
      .from('tags')
      .insert({ name, color, user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      set((state) => ({ tags: [...state.tags, data as Tag] }));
      return data as Tag;
    }
    return null;
  },

  deleteTag: async (id) => {
    await supabase.from('tags').delete().eq('id', id);
    set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
  },

  setSelectedNote: (note) => set({ selectedNote: note }),
  setActiveFolderId: (id) => set({ activeFolderId: id }),
  setActiveTagId: (id) => set({ activeTagId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
