import React, { useEffect, useState, useMemo } from 'react';
import type { Note, NoteType } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/i18n';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import {
  Plus, Grid, List, Search, Filter, StickyNote,
  FileText, Mic, Image, Video, FileType, Link, File, X, Folder, Trash2,
  CheckSquare, Archive, RefreshCw, AlertCircle, Lock, Unlock, Copy, Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hashPassword } from '../../lib/crypto';

interface NotesPageProps {
  filter?: 'all' | 'pinned' | 'archived' | 'deleted';
  folderId?: string | null;
  tagId?: string | null;
}

const noteTypes: { type: NoteType; icon: React.ComponentType<{className?: string}>; labelKey: string }[] = [
  { type: 'text', icon: FileText, labelKey: 'notes.type.text' },
  { type: 'voice', icon: Mic, labelKey: 'notes.type.voice' },
  { type: 'image', icon: Image, labelKey: 'notes.type.image' },
  { type: 'video', icon: Video, labelKey: 'notes.type.video' },
  { type: 'pdf', icon: FileType, labelKey: 'notes.type.pdf' },
  { type: 'link', icon: Link, labelKey: 'notes.type.link' },
  { type: 'file', icon: File, labelKey: 'notes.type.file' },
];

export default function NotesPage({ filter = 'all', folderId, tagId }: NotesPageProps) {
  const { language } = useSettingsStore();
  const {
    notes, folders, loading, fetchNotes, createNote,
    viewMode, setViewMode, searchQuery, activeFolderId,
    restoreNote, permanentlyDeleteNote, deleteFolder, setActiveFolderId
  } = useNotesStore();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNewTypeMenu, setShowNewTypeMenu] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  // Bulk actions states
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [showBulkCopyModal, setShowBulkCopyModal] = useState(false);
  const [showBulkLockModal, setShowBulkLockModal] = useState(false);
  const [showBulkUnlockModal, setShowBulkUnlockModal] = useState(false);
  const [bulkLockPassword, setBulkLockPassword] = useState('');
  const [bulkUnlockPassword, setBulkUnlockPassword] = useState('');

  // Add notes to folder states
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);
  const [addNotesSelectedIds, setAddNotesSelectedIds] = useState<Set<string>>(new Set());
  const [addNotesSearch, setAddNotesSearch] = useState('');

  const handleBulkCopy = async (targetFolderId: string | null) => {
    if (selectedNoteIds.size === 0) return;
    const { copyNotes } = useNotesStore.getState();
    await copyNotes(Array.from(selectedNoteIds), targetFolderId);
    setShowBulkCopyModal(false);
    setSelectionMode(false);
    setSelectedNoteIds(new Set());
  };

  const handleBulkLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkLockPassword.trim()) return;
    const hash = await hashPassword(bulkLockPassword);
    const { bulkLockNotes } = useNotesStore.getState();
    await bulkLockNotes(Array.from(selectedNoteIds), hash);
    setShowBulkLockModal(false);
    setBulkLockPassword('');
    setSelectionMode(false);
    setSelectedNoteIds(new Set());
  };

  const handleBulkUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUnlockPassword.trim()) return;
    const hash = await hashPassword(bulkUnlockPassword);
    const { bulkUnlockNotes } = useNotesStore.getState();
    await bulkUnlockNotes(Array.from(selectedNoteIds), hash);
    setShowBulkUnlockModal(false);
    setBulkUnlockPassword('');
    setSelectionMode(false);
    setSelectedNoteIds(new Set());
  };

  const handleBulkMove = async (targetFolderId: string | null) => {
    const { moveNotes } = useNotesStore.getState();
    await moveNotes(Array.from(selectedNoteIds), targetFolderId);
    setShowBulkMoveModal(false);
    setSelectionMode(false);
    setSelectedNoteIds(new Set());
    toast.success(
      language === 'ar'
        ? 'تم نقل الملاحظات بنجاح'
        : 'Notes moved successfully'
    );
  };

  // Close FAB menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-group')) {
        setShowNewTypeMenu(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const effectiveFolderId = folderId ?? activeFolderId ?? undefined;

  useEffect(() => {
    fetchNotes({
      folderId: effectiveFolderId ?? undefined,
      tagId: tagId ?? undefined,
      archived: filter === 'archived',
      deleted: filter === 'deleted',
      pinned: filter === 'pinned',
    });
  }, [filter, effectiveFolderId, tagId]);

  const filteredNotes = useMemo(() => {
    if (!localSearch) return notes;
    const q = localSearch.toLowerCase();
    return notes.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.tags?.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [notes, localSearch]);

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.is_pinned);

  const handleCreateNote = async (type: NoteType = 'text') => {
    setShowNewTypeMenu(false);
    const newNote = await createNote({
      note_type: type,
      title: '',
      content: '',
      folder_id: effectiveFolderId || null,
    });
    if (newNote) {
      setSelectedNote(newNote);
      toast.success(language === 'ar' ? 'تم إنشاء الملاحظة' : 'Note created');
    }
  };

  const currentFolder = effectiveFolderId
    ? folders.find((f) => f.id === effectiveFolderId)
    : null;

  const pageTitle = filter === 'archived'
    ? t('nav.archive', language)
    : filter === 'deleted'
    ? t('nav.trash', language)
    : filter === 'pinned'
    ? t('nav.starred', language)
    : currentFolder
    ? currentFolder.name
    : t('notes.all', language);

  // If a note is selected, show the editor
  if (selectedNote) {
    return (
      <NoteEditor
        note={selectedNote}
        onClose={() => { setSelectedNote(null); fetchNotes({ folderId: effectiveFolderId }); }}
      />
    );
  }

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedNoteIds(new Set());
  };

  const handleSelectNote = (note: Note) => {
    const newSet = new Set(selectedNoteIds);
    if (newSet.has(note.id)) newSet.delete(note.id);
    else newSet.add(note.id);
    setSelectedNoteIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.size === filteredNotes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(filteredNotes.map(n => n.id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedNoteIds.size === 0) return;
    if (window.confirm(language === 'ar' ? `حذف ${selectedNoteIds.size} ملاحظة؟` : `Delete ${selectedNoteIds.size} notes?`)) {
      if (filter === 'deleted') {
        for (const id of selectedNoteIds) await permanentlyDeleteNote(id);
      } else {
        for (const id of selectedNoteIds) await useNotesStore.getState().deleteNote(id);
      }
      setSelectionMode(false);
      setSelectedNoteIds(new Set());
    }
  };

  const bulkRestore = async () => {
    if (selectedNoteIds.size === 0) return;
    for (const id of selectedNoteIds) await restoreNote(id);
    setSelectionMode(false);
    setSelectedNoteIds(new Set());
  };

  const bulkArchive = async () => {
    if (selectedNoteIds.size === 0) return;
    for (const id of selectedNoteIds) {
      const note = notes.find(n => n.id === id);
      if (note) await useNotesStore.getState().updateNote(id, { is_archived: !note.is_archived });
    }
    setSelectionMode(false);
    setSelectedNoteIds(new Set());
  };

  const emptyTrash = async () => {
    if (filteredNotes.length === 0) return;
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من إفراغ سلة المهملات بالكامل؟' : 'Are you sure you want to empty the trash?')) {
      for (const note of filteredNotes) {
        await permanentlyDeleteNote(note.id);
      }
    }
  };

  const BulkMoveModal = () => (
    showBulkMoveModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary-400" />
            {language === 'ar' ? 'نقل الملاحظات المحددة' : 'Move Selected Notes'}
          </h3>
          <p className="text-sm text-neutral-400 mb-4">
            {language === 'ar' ? `اختر المجلد لنقل ${selectedNoteIds.size} ملاحظة:` : `Select folder to move ${selectedNoteIds.size} notes:`}
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
            <button
              onClick={() => handleBulkMove(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              <span>{language === 'ar' ? 'بدون مجلد (ملاحظات عامة)' : 'No Folder (General)'}</span>
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => handleBulkMove(f.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkMoveModal(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    ) : null
  );

  const BulkLockModal = () => (
    showBulkLockModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-400" />
            {language === 'ar' ? 'قفل الملاحظات المحددة' : 'Lock Selected Notes'}
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            {language === 'ar' ? 'أدخل كلمة مرور جديدة لقفل الملاحظات المحددة.' : 'Enter a new password to lock the selected notes.'}
          </p>
          <form onSubmit={handleBulkLock}>
            <input
              type="password"
              placeholder={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              value={bulkLockPassword}
              onChange={(e) => setBulkLockPassword(e.target.value)}
              className="input-field mb-4 w-full text-right rtl:text-right ltr:text-left"
              autoFocus
              dir="ltr"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowBulkLockModal(false); setBulkLockPassword(''); }}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn-primary py-2 px-6">
                {language === 'ar' ? 'قفل' : 'Lock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  );

  const BulkUnlockModal = () => (
    showBulkUnlockModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2">
            <Unlock className="w-5 h-5 text-primary-400" />
            {language === 'ar' ? 'فك قفل الملاحظات المحددة' : 'Unlock Selected Notes'}
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            {language === 'ar' ? 'أدخل كلمة المرور لفك قفل الملاحظات المحددة.' : 'Enter the password to unlock the selected notes.'}
          </p>
          <form onSubmit={handleBulkUnlock}>
            <input
              type="password"
              placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
              value={bulkUnlockPassword}
              onChange={(e) => setBulkUnlockPassword(e.target.value)}
              className="input-field mb-4 w-full text-right rtl:text-right ltr:text-left"
              autoFocus
              dir="ltr"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowBulkUnlockModal(false); setBulkUnlockPassword(''); }}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn-primary py-2 px-6">
                {language === 'ar' ? 'فك القفل' : 'Unlock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  );

  const BulkCopyModal = () => (
    showBulkCopyModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary-400" />
            {language === 'ar' ? 'نسخ الملاحظات المحددة' : 'Copy Selected Notes'}
          </h3>
          <p className="text-sm text-neutral-400 mb-4">
            {language === 'ar' ? `اختر المجلد لنسخ ${selectedNoteIds.size} ملاحظة:` : `Select folder to copy ${selectedNoteIds.size} notes:`}
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
            <button
              onClick={() => handleBulkCopy(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              <span>{language === 'ar' ? 'بدون مجلد (ملاحظات عامة)' : 'No Folder (General)'}</span>
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => handleBulkCopy(f.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkCopyModal(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    ) : null
  );

  const AddNotesToFolderModal = () => {
    const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);

    useEffect(() => {
      if (!showAddNotesModal || !effectiveFolderId) return;
      
      const fetchAvailableNotes = async () => {
        setLoadingAvailable(true);
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('is_archived', false)
            .eq('is_deleted', false);
            
          if (!error && data) {
            // Filter out notes already in this folder
            const filtered = data.filter((n: any) => n.folder_id !== effectiveFolderId);
            setAvailableNotes(filtered as Note[]);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingAvailable(false);
        }
      };

      fetchAvailableNotes();
    }, [showAddNotesModal, effectiveFolderId]);

    if (!showAddNotesModal || !effectiveFolderId) return null;
    
    const filteredAvailableNotes = availableNotes.filter(
      (n) =>
        !addNotesSearch ||
        n.title?.toLowerCase().includes(addNotesSearch.toLowerCase()) ||
        n.content?.toLowerCase().includes(addNotesSearch.toLowerCase())
    );

    const handleToggleSelectAvailableNote = (id: string) => {
      const newSet = new Set(addNotesSelectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setAddNotesSelectedIds(newSet);
    };

    const handleAddNotesToFolder = async () => {
      if (addNotesSelectedIds.size === 0) return;
      const { moveNotes } = useNotesStore.getState();
      await moveNotes(Array.from(addNotesSelectedIds), effectiveFolderId);
      // RELOAD current folder notes in page
      await useNotesStore.getState().fetchNotes({ folderId: effectiveFolderId });
      setShowAddNotesModal(false);
      setAddNotesSelectedIds(new Set());
      setAddNotesSearch('');
      toast.success(
        language === 'ar'
          ? 'تم إضافة الملاحظات إلى المجلد'
          : 'Notes added to folder'
      );
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in flex flex-col max-h-[80vh]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2 flex-shrink-0">
            <Plus className="w-5 h-5 text-primary-400" />
            {language === 'ar' ? 'إضافة ملاحظات للمجلد' : 'Add Notes to Folder'}
          </h3>
          <p className="text-xs text-neutral-400 mb-4 flex-shrink-0">
            {language === 'ar'
              ? `حدد الملاحظات التي تريد نقلها إلى مجلد "${currentFolder?.name}"`
              : `Select notes to move into folder "${currentFolder?.name}"`}
          </p>

          {/* Search Input */}
          <div className="relative mb-4 flex-shrink-0">
            <Search className="absolute top-2.5 right-3 w-3.5 h-3.5 text-neutral-600 ltr:right-auto ltr:left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t('search.placeholder', language)}
              value={addNotesSearch}
              onChange={(e) => setAddNotesSearch(e.target.value)}
              className="bg-neutral-950 border border-neutral-850 text-neutral-300 placeholder-neutral-600 rounded-xl pr-9 pl-4 ltr:pr-4 ltr:pl-9 py-2 text-xs w-full focus:outline-none focus:border-neutral-700 transition-all"
            />
            {addNotesSearch && (
              <button
                onClick={() => setAddNotesSearch('')}
                className="absolute top-2.5 left-3 ltr:left-auto ltr:right-3 text-neutral-600 hover:text-neutral-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-6 min-h-[200px] pr-1">
            {loadingAvailable ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-neutral-500 text-xs">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : filteredAvailableNotes.map((note) => {
              const isSelected = addNotesSelectedIds.has(note.id);
              return (
                <div
                  key={note.id}
                  onClick={() => handleToggleSelectAvailableNote(note.id)}
                  className={`flex items-center gap-3 p-3 bg-neutral-950/40 border rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'border-primary-500/50 bg-primary-500/5' : 'border-neutral-800/40 hover:border-neutral-700/60'
                  }`}
                >
                  <div className="text-primary-400 flex-shrink-0">
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-50" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-200 truncate">
                      {note.title || t('notes.untitled', language)}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                      {note.content?.replace(/[#*`>_~\[\]]/g, '') || '...'}
                    </p>
                  </div>
                </div>
              );
            })}

            {!loadingAvailable && filteredAvailableNotes.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-600">
                {language === 'ar' ? 'لا توجد ملاحظات متاحة للإضافة' : 'No notes available to add'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end flex-shrink-0 pt-3 border-t border-neutral-850">
            <button
              type="button"
              onClick={() => {
                setShowAddNotesModal(false);
                setAddNotesSelectedIds(new Set());
                setAddNotesSearch('');
              }}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleAddNotesToFolder}
              disabled={addNotesSelectedIds.size === 0}
              className="btn-primary py-2 px-6 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'ar' ? 'إضافة المحددة' : 'Add Selected'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-neutral-800/40">
        <div className="flex items-center gap-2 flex-1">
          {currentFolder ? (
            <>
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentFolder.color }}
              />
              <h2 className="font-medium text-sm text-neutral-400">{pageTitle}</h2>
              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                     language === 'ar' 
                      ? `هل أنت متأكد من حذف مجلد "${currentFolder.name}"؟` 
                      : `Are you sure you want to delete folder "${currentFolder.name}"?`
                  );
                  if (confirmed) {
                    await deleteFolder(currentFolder.id);
                    setActiveFolderId(null);
                    toast.success(language === 'ar' ? 'تم حذف المجلد' : 'Folder deleted');
                  }
                }}
                className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-red-400 transition-colors ml-1 mr-1"
                title={language === 'ar' ? 'حذف المجلد' : 'Delete Folder'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <h2 className="font-medium text-sm text-neutral-400">{pageTitle}</h2>
          )}
          <span className="text-xs text-neutral-700 bg-neutral-800/60 px-2 py-0.5 rounded-full">
            {filteredNotes.length}
          </span>
        </div>

        {/* Sub-header Actions */}
        {selectionMode ? (
          <div className="flex items-center gap-2 text-sm text-neutral-300 ms-auto overflow-x-auto hide-scrollbar pl-2 rtl:pl-0 rtl:pr-2 max-w-[70vw]">
            <span className="hidden sm:inline shrink-0">{selectedNoteIds.size} {language === 'ar' ? 'محدد' : 'selected'}</span>
            <button onClick={handleSelectAll} className="text-primary-400 hover:text-primary-300 text-xs px-2 py-1.5 bg-primary-500/10 rounded-lg whitespace-nowrap shrink-0">
              {language === 'ar' ? 'تحديد الكل' : 'Select All'}
            </button>
            <div className="w-px h-6 bg-neutral-800 mx-1 shrink-0" />
            {filter === 'deleted' ? (
              <>
                <button onClick={bulkRestore} className="text-primary-400 hover:text-primary-300 p-1.5 bg-primary-600/10 hover:bg-primary-600/20 rounded-lg transition-colors shrink-0" title={language === 'ar' ? 'استعادة' : 'Restore'}><RefreshCw className="w-4 h-4" /></button>
                <button onClick={bulkDelete} className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors shrink-0" title={language === 'ar' ? 'حذف نهائي' : 'Permanent Delete'}><Trash2 className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowBulkMoveModal(true)}
                  className="text-neutral-400 hover:text-neutral-300 p-1.5 bg-neutral-850 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  title={language === 'ar' ? 'نقل إلى مجلد' : 'Move to Folder'}
                >
                  <Folder className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowBulkCopyModal(true)}
                  className="text-neutral-400 hover:text-neutral-300 p-1.5 bg-neutral-855 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  title={language === 'ar' ? 'نسخ إلى مجلد' : 'Copy to Folder'}
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowBulkLockModal(true)}
                  className="text-neutral-400 hover:text-neutral-300 p-1.5 bg-neutral-855 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  title={language === 'ar' ? 'قفل الملاحظات المحددة' : 'Lock Selected Notes'}
                >
                  <Lock className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowBulkUnlockModal(true)}
                  className="text-neutral-400 hover:text-neutral-300 p-1.5 bg-neutral-855 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                  title={language === 'ar' ? 'فك قفل الملاحظات' : 'Unlock Selected Notes'}
                >
                  <Unlock className="w-4 h-4" />
                </button>
                <button onClick={bulkArchive} className="text-neutral-400 hover:text-neutral-300 p-1.5 bg-neutral-800 rounded-lg transition-colors shrink-0" title={language === 'ar' ? 'أرشفة' : 'Archive'}><Archive className="w-4 h-4" /></button>
                <button onClick={bulkDelete} className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors shrink-0" title={language === 'ar' ? 'حذف' : 'Delete'}><Trash2 className="w-4 h-4" /></button>
              </>
            )}
            <div className="w-px h-6 bg-neutral-800 mx-1 shrink-0" />
            <button onClick={handleToggleSelectionMode} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 shrink-0"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {/* Selection toggle */}
            <button
              onClick={handleToggleSelectionMode}
              className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-xl transition-colors"
              title={language === 'ar' ? 'تحديد' : 'Select'}
            >
              <CheckSquare className="w-4 h-4" />
            </button>

            {/* Empty Trash Button */}
            {filter === 'deleted' && filteredNotes.length > 0 && (
              <button
                onClick={emptyTrash}
                className="p-2 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                title={language === 'ar' ? 'إفراغ سلة المهملات' : 'Empty Trash'}
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}

            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute top-2.5 right-3 w-3.5 h-3.5 text-neutral-600 ltr:right-auto ltr:left-3 pointer-events-none" />
              <input
                type="text"
                placeholder={t('search.placeholder', language)}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 placeholder-neutral-600 rounded-xl pr-9 pl-4 ltr:pr-4 ltr:pl-9 py-2 text-xs w-full sm:w-44 focus:outline-none focus:border-neutral-700 transition-all"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute top-2.5 left-3 ltr:left-auto ltr:right-3 text-neutral-600 hover:text-neutral-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View mode */}
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-neutral-700 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-neutral-700 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : ''}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`skeleton ${viewMode === 'grid' ? 'h-36 rounded-2xl' : 'h-14 rounded-lg'}`} />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-4">
              <StickyNote className="w-7 h-7 text-neutral-600" />
            </div>
            <h3 className="font-medium text-neutral-400 mb-1">{t('notes.empty', language)}</h3>
            <p className="text-sm text-neutral-600">{t('notes.empty_desc', language)}</p>
            {filter === 'all' && (
              <button
                onClick={() => handleCreateNote('text')}
                className="btn-primary mt-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('notes.new', language)}
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Pinned */}
            {pinnedNotes.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-1 h-3 bg-primary-500 rounded-full" />
                  {t('nav.starred', language)}
                </h3>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'border border-neutral-800/40 rounded-xl overflow-hidden'}>
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onOpen={setSelectedNote}
                      viewMode={viewMode}
                      selectable={selectionMode}
                      selected={selectedNoteIds.has(note.id)}
                      onSelect={handleSelectNote}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Others */}
            {unpinnedNotes.length > 0 && (
              <section>
                {pinnedNotes.length > 0 && (
                  <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                    {language === 'ar' ? 'الأخيرة' : 'Recent'}
                  </h3>
                )}
                {filter === 'deleted' ? (
                  <div className="space-y-2">
                    {unpinnedNotes.map((note) => (
                      <div key={note.id} className="flex items-center gap-3 p-3 bg-neutral-900/60 border border-neutral-800/40 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-300 truncate">
                            {note.title || t('notes.untitled', language)}
                          </p>
                        </div>
                        <button
                          onClick={() => restoreNote(note.id)}
                          className="text-xs text-primary-400 hover:text-primary-300 px-3 py-1.5 bg-primary-600/10 hover:bg-primary-600/20 rounded-lg transition-colors"
                        >
                          {t('notes.restore', language)}
                        </button>
                        <button
                          onClick={() => permanentlyDeleteNote(note.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          {t('notes.permanent_delete', language)}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'border border-neutral-800/40 rounded-xl overflow-hidden'}>
                    {unpinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onOpen={setSelectedNote}
                        viewMode={viewMode}
                        selectable={selectionMode}
                        selected={selectedNoteIds.has(note.id)}
                        onSelect={handleSelectNote}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* FAB - New note / Add existing note to folder */}
      {filter === 'all' && (
        <div className="relative dropdown-group">
          <button
            onClick={() => {
              if (effectiveFolderId) {
                setShowAddNotesModal(true);
              } else {
                setShowNewTypeMenu(!showNewTypeMenu);
              }
            }}
            className="fab w-12 h-12 rounded-xl"
            style={{ bottom: '5.5rem', right: '1rem' }}
          >
            {showNewTypeMenu ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>

          {showNewTypeMenu && !effectiveFolderId && (
            <div className="fixed bottom-36 end-4 z-50 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-xl p-2 animate-scale-in">
              {noteTypes.map(({ type, icon: Icon, labelKey }) => (
                <button
                  key={type}
                  onClick={() => handleCreateNote(type)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300"
                >
                  <Icon className={`w-4 h-4 type-${type}`} />
                  {t(labelKey, language)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <BulkMoveModal />
      <BulkCopyModal />
      <BulkLockModal />
      <BulkUnlockModal />
      <AddNotesToFolderModal />
    </div>
  );
}
