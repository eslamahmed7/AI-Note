import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Note, Folder, Tag } from '../types';
import { useAuthStore } from './authStore';
import { useSettingsStore } from './settingsStore';
import toast from 'react-hot-toast';

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
  createFolder: (name: string, parentId?: string | null, color?: string, emoji?: string | null, password_hash?: string | null) => Promise<Folder | null>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createTag: (name: string, color?: string, emoji?: string | null, password_hash?: string | null) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<void>;
  moveNotes: (ids: string[], folderId: string | null) => Promise<void>;
  copyNotes: (ids: string[], folderId: string | null) => Promise<void>;
  bulkLockNotes: (ids: string[], passwordHash: string) => Promise<void>;
  bulkUnlockNotes: (ids: string[], passwordHash: string) => Promise<void>;
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
    const { tags, ...rest } = data;
    
    // Update basic note fields
    if (Object.keys(rest).length > 0) {
      const { data: updated, error } = await supabase
        .from('notes')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error(error);
        toast.error('Failed to update note: ' + error.message);
        return;
      }
      if (updated) {
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, ...updated, tags: tags !== undefined ? tags : n.tags } as Note : n)),
          selectedNote: state.selectedNote?.id === id ? { ...state.selectedNote, ...updated, tags: tags !== undefined ? tags : state.selectedNote.tags } as Note : state.selectedNote,
        }));
      }
    }

    // Update note-tag relations if tags are provided
    if (tags !== undefined) {
      // 1. Delete all existing relations for this note
      const { error: deleteError } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', id);
        
      if (deleteError) {
        console.error(deleteError);
        toast.error('Failed to update tags: ' + deleteError.message);
        return;
      }
      
      // 2. Insert new relations
      if (tags.length > 0) {
        const relations = tags.map(tag => ({ note_id: id, tag_id: tag.id }));
        const { error: tagError } = await supabase
          .from('note_tags')
          .insert(relations);
          
        if (tagError) {
          console.error(tagError);
          toast.error('Failed to add tags: ' + tagError.message);
          return;
        }
      }
      
      // 3. Update store state
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, tags } as Note : n)),
        selectedNote: state.selectedNote?.id === id ? { ...state.selectedNote, tags } as Note : state.selectedNote,
      }));
    }
  },

  deleteNote: async (id) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    const isRTL = useSettingsStore.getState().language === 'ar';
    
    if (note && note.folder_id) {
      // If the note is inside a folder, remove it from the folder (set folder_id = null)
      const { error } = await supabase
        .from('notes')
        .update({ folder_id: null, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error(error);
        toast.error(isRTL ? 'فشل إزالة الملاحظة من المجلد: ' + error.message : 'Failed to remove note from folder: ' + error.message);
        return;
      }
      
      set((state) => {
        // If we are currently viewing this folder, remove it from the active notes list.
        // Otherwise (viewing all notes, tags, etc.), keep it but set folder_id to null.
        const shouldRemoveFromList = state.activeFolderId === note.folder_id;
        const updatedNotes = shouldRemoveFromList
          ? state.notes.filter((n) => n.id !== id)
          : state.notes.map((n) => n.id === id ? { ...n, folder_id: null } as Note : n);
          
        return {
          notes: updatedNotes,
          selectedNote: state.selectedNote?.id === id ? { ...state.selectedNote, folder_id: null } as Note : state.selectedNote,
        };
      });
      
      toast.success(isRTL ? 'تمت إزالة الملاحظة من المجلد' : 'Note removed from folder');
    } else {
      // Otherwise, trash it normally
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) {
        console.error(error);
        toast.error(isRTL ? 'فشل نقل الملاحظة إلى سلة المحذوفات: ' + error.message : 'Failed to move note to trash: ' + error.message);
        return;
      }
      
      set((state) => ({ 
        notes: state.notes.filter((n) => n.id !== id),
        selectedNote: state.selectedNote?.id === id ? null : state.selectedNote
      }));
      toast.success(isRTL ? 'تم نقل الملاحظة إلى سلة المحذوفات' : 'Note moved to trash');
    }
  },

  permanentlyDeleteNote: async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      console.error(error);
      toast.error('Failed to permanently delete note: ' + error.message);
      return;
    }
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  restoreNote: async (id) => {
    await supabase
      .from('notes')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  createFolder: async (name, parentId, color = '#3B82F6', emoji = null, password_hash = null) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    
    // Attempt insert with new columns
    let { data, error } = await supabase
      .from('folders')
      .insert({ name, parent_id: parentId || null, color, emoji, password_hash, is_encrypted: !!password_hash, user_id: user.id })
      .select()
      .single();
      
    // Fallback if missing columns (migration not applied)
    if (error && error.message.includes('does not exist')) {
      const fallbackResult = await supabase
        .from('folders')
        .insert({ name, parent_id: parentId || null, color, user_id: user.id })
        .select()
        .single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (!error && data) {
      set((state) => ({ folders: [...state.folders, data as Folder] }));
      return data as Folder;
    }
    
    if (error) {
      console.error(error);
      toast.error('Failed to create folder: ' + error.message);
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

  createTag: async (name, color = '#10B981', emoji = null, _password_hash = null) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    
    let { data, error } = await supabase
      .from('tags')
      .insert({ name, color, emoji, user_id: user.id })
      .select()
      .single();
      
    if (error && error.message.includes('does not exist')) {
      const fallbackResult = await supabase
        .from('tags')
        .insert({ name, color, user_id: user.id })
        .select()
        .single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (!error && data) {
      set((state) => ({ tags: [...state.tags, data as Tag] }));
      return data as Tag;
    }
    
    if (error) {
      console.error(error);
      toast.error('Failed to create tag: ' + error.message);
    }
    return null;
  },

  deleteTag: async (id) => {
    await supabase.from('tags').delete().eq('id', id);
    set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
  },

  moveNotes: async (ids: string[], folderId: string | null) => {
    const { error } = await supabase
      .from('notes')
      .update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      console.error(error);
      toast.error('Failed to move notes: ' + error.message);
      return;
    }
    set((state) => ({
      notes: state.notes.map((n) => ids.includes(n.id) ? { ...n, folder_id: folderId } as Note : n),
      selectedNote: state.selectedNote && ids.includes(state.selectedNote.id) ? { ...state.selectedNote, folder_id: folderId } as Note : state.selectedNote,
    }));
  },

  copyNotes: async (ids: string[], folderId: string | null) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const { notes } = get();
    const copiedNotes: Note[] = [];

    for (const id of ids) {
      const sourceNote = notes.find((n) => n.id === id);
      if (!sourceNote) continue;

      const { tags, id: sourceId, created_at, updated_at, folder, user_id, ...noteFields } = sourceNote;
      
      const { data: newNote, error } = await supabase
        .from('notes')
        .insert({
          ...noteFields,
          folder_id: folderId,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error('Failed to copy note: ' + error.message);
        continue;
      }

      if (newNote) {
        // Copy tags if any
        let newNoteTags: Tag[] = [];
        if (tags && tags.length > 0) {
          const relations = tags.map(tag => ({ note_id: newNote.id, tag_id: tag.id }));
          const { error: tagError } = await supabase.from('note_tags').insert(relations);
          if (!tagError) {
            newNoteTags = tags;
          } else {
            console.error(tagError);
          }
        }
        
        const noteWithTags = { ...newNote, tags: newNoteTags } as Note;
        copiedNotes.push(noteWithTags);
      }
    }

    if (copiedNotes.length > 0) {
      set((state) => ({ notes: [...copiedNotes, ...state.notes] }));
      toast.success(
        useSettingsStore.getState().language === 'ar'
          ? `تم نسخ ${copiedNotes.length} ملاحظة بنجاح`
          : `Successfully copied ${copiedNotes.length} notes`
      );
    }
  },

  bulkLockNotes: async (ids: string[], passwordHash: string) => {
    const { error } = await supabase
      .from('notes')
      .update({ is_encrypted: true, password_hash: passwordHash, updated_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      console.error(error);
      toast.error('Failed to lock notes: ' + error.message);
      return;
    }
    set((state) => ({
      notes: state.notes.map((n) => ids.includes(n.id) ? { ...n, is_encrypted: true, password_hash: passwordHash } as Note : n),
      selectedNote: state.selectedNote && ids.includes(state.selectedNote.id) ? { ...state.selectedNote, is_encrypted: true, password_hash: passwordHash } as Note : state.selectedNote,
    }));
    toast.success(
      useSettingsStore.getState().language === 'ar'
        ? 'تم قفل الملاحظات المحددة بنجاح'
        : 'Selected notes locked successfully'
    );
  },

  bulkUnlockNotes: async (ids: string[], passwordHash: string) => {
    const { notes } = get();
    const notesToUnlock = notes.filter(n => ids.includes(n.id) && (!n.is_encrypted || n.password_hash === passwordHash));
    const idsToUnlock = notesToUnlock.map(n => n.id);
    
    if (idsToUnlock.length === 0) {
      toast.error(useSettingsStore.getState().language === 'ar' ? 'كلمة المرور غير صحيحة لأي من الملاحظات المحددة' : 'Incorrect password for all selected notes');
      return;
    }
    
    const { error } = await supabase
      .from('notes')
      .update({ is_encrypted: false, password_hash: null, updated_at: new Date().toISOString() })
      .in('id', idsToUnlock);
      
    if (error) {
      console.error(error);
      toast.error('Failed to unlock notes: ' + error.message);
      return;
    }
    
    set((state) => ({
      notes: state.notes.map((n) => idsToUnlock.includes(n.id) ? { ...n, is_encrypted: false, password_hash: null } as Note : n),
      selectedNote: state.selectedNote && idsToUnlock.includes(state.selectedNote.id) ? { ...state.selectedNote, is_encrypted: false, password_hash: null } as Note : state.selectedNote,
    }));
    
    const failedCount = ids.length - idsToUnlock.length;
    if (failedCount > 0) {
      toast.success(
        useSettingsStore.getState().language === 'ar'
          ? `تم فك قفل ${idsToUnlock.length} ملاحظات. فشل فك قفل ${failedCount} (كلمة مرور خاطئة)`
          : `Unlocked ${idsToUnlock.length} notes. Failed to unlock ${failedCount} (incorrect password)`
      );
    } else {
      toast.success(
        useSettingsStore.getState().language === 'ar'
          ? 'تم فك قفل الملاحظات بنجاح'
          : 'Notes unlocked successfully'
      );
    }
  },

  setSelectedNote: (note) => set({ selectedNote: note }),
  setActiveFolderId: (id) => set({ activeFolderId: id }),
  setActiveTagId: (id) => set({ activeTagId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
