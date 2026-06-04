import React, { useEffect, useState, useMemo } from 'react';
import type { Note, NoteType } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { t } from '../../lib/i18n';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import {
  Plus, Grid, List, Search, Filter, StickyNote,
  FileText, Mic, Image, Video, FileType, Link, File, X, Folder, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/40">
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-2.5 right-3 w-3.5 h-3.5 text-neutral-600 ltr:right-auto ltr:left-3 pointer-events-none" />
          <input
            type="text"
            placeholder={t('search.placeholder', language)}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 placeholder-neutral-600 rounded-xl pr-9 pl-4 ltr:pr-4 ltr:pl-9 py-2 text-xs w-44 focus:outline-none focus:border-neutral-700 transition-all"
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
        <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
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
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* FAB - New note */}
      {filter === 'all' && (
        <div className="relative">
          <button
            onClick={() => setShowNewTypeMenu(!showNewTypeMenu)}
            className="fab w-12 h-12 rounded-xl"
            style={{ bottom: '5.5rem', right: '1rem' }}
          >
            {showNewTypeMenu ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>

          {showNewTypeMenu && (
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
    </div>
  );
}
