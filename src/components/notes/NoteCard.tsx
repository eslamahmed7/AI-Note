import React, { useEffect, useRef, useState } from 'react';
import type { Note, NoteType } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { t } from '../../lib/i18n';
import {
  Pin, Archive, Trash2, MoreVertical, Clock, FileText,
  Mic, Image, Video, File, Link, FileType, Tag, Lock, Unlock,
  Copy, Folder, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hashPassword } from '../../lib/crypto';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';

const typeIcons: Record<NoteType, React.ReactNode> = {
  text: <FileText className="w-3.5 h-3.5" />,
  voice: <Mic className="w-3.5 h-3.5" />,
  image: <Image className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  pdf: <FileType className="w-3.5 h-3.5" />,
  link: <Link className="w-3.5 h-3.5" />,
  file: <File className="w-3.5 h-3.5" />,
};

const typeColors: Record<NoteType, string> = {
  text: 'type-text',
  voice: 'type-voice',
  image: 'type-image',
  video: 'type-video',
  pdf: 'type-pdf',
  link: 'type-link',
  file: 'type-file',
};

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  viewMode: 'grid' | 'list';
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (note: Note) => void;
}

export default function NoteCard({ note, onOpen, viewMode, selectable, selected, onSelect }: NoteCardProps) {
  const { language } = useSettingsStore();
  const { updateNote, deleteNote, folders } = useNotesStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isTemporarilyUnlocked, setIsTemporarilyUnlocked] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const isRTL = language === 'ar';
  const locale = isRTL ? ar : enUS;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const timeAgo = formatDistanceToNow(new Date(note.updated_at), {
    addSuffix: true,
    locale,
  });

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote(note.id, { is_pinned: !note.is_pinned });
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote(note.id, { is_archived: !note.is_archived });
    setMenuOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isInFolder = !!note.folder_id;
    const confirmMessage = isInFolder
      ? (isRTL ? 'هل أنت متأكد من إزالة هذه الملاحظة من المجلد؟' : 'Are you sure you want to remove this note from the folder?')
      : (isRTL ? 'هل أنت متأكد من نقل هذه الملاحظة إلى سلة المهملات؟' : 'Are you sure you want to move this note to trash?');
      
    if (window.confirm(confirmMessage)) {
      deleteNote(note.id);
    }
    setMenuOpen(false);
  };

  const previewText = note.content
    ?.replace(/[#*`>_~\[\]]/g, '')
    ?.substring(0, viewMode === 'grid' ? 120 : 80)
    ?.trim();

  const handleOpenClick = () => {
    if (selectable && onSelect) {
      onSelect(note);
      return;
    }
    if (note.is_encrypted) {
      if (isTemporarilyUnlocked) {
        setIsTemporarilyUnlocked(false);
        toast.success(isRTL ? 'تم إعادة قفل الملاحظة' : 'Note locked again');
      } else {
        setShowUnlockModal(true);
      }
    } else {
      onOpen(note);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await hashPassword(unlockPassword);
    if (hash === note.password_hash) {
      setShowUnlockModal(false);
      setUnlockPassword('');
      onOpen(note);
    } else {
      toast.error(isRTL ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
    }
  };

  const handleTogglePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note.is_encrypted) {
      // Removing password
      const hash = await hashPassword(newPassword);
      if (hash === note.password_hash) {
        updateNote(note.id, { is_encrypted: false, password_hash: null });
        setShowSetPasswordModal(false);
        setNewPassword('');
        toast.success(isRTL ? 'تم إزالة القفل' : 'Lock removed');
      } else {
        toast.error(isRTL ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
      }
    } else {
      // Setting password
      if (!newPassword.trim()) return;
      const hash = await hashPassword(newPassword);
      updateNote(note.id, { is_encrypted: true, password_hash: hash });
      setShowSetPasswordModal(false);
      setNewPassword('');
      toast.success(isRTL ? 'تم قفل الملاحظة' : 'Note locked');
    }
  };

  const UnlockModal = () => (
    showUnlockModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <h3 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-400" />
            {isRTL ? 'ملاحظة محمية' : 'Locked Note'}
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            {isRTL ? 'أدخل كلمة المرور لفتح هذه الملاحظة.' : 'Enter password to unlock this note.'}
          </p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              placeholder={isRTL ? 'كلمة المرور' : 'Password'}
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              className="input-field mb-4 w-full"
              autoFocus
              dir="ltr"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn-primary py-2 px-6">
                {isRTL ? 'فتح' : 'Unlock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  );

  const SetPasswordModal = () => (
    showSetPasswordModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
          <h3 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2">
            {note.is_encrypted ? <Unlock className="w-5 h-5 text-primary-400" /> : <Lock className="w-5 h-5 text-primary-400" />}
            {note.is_encrypted ? (isRTL ? 'إزالة قفل الملاحظة' : 'Remove Note Lock') : (isRTL ? 'قفل الملاحظة' : 'Lock Note')}
          </h3>
          <p className="text-sm text-neutral-400 mb-6">
            {note.is_encrypted 
              ? (isRTL ? 'أدخل كلمة المرور الحالية لإزالة القفل.' : 'Enter current password to remove lock.')
              : (isRTL ? 'أدخل كلمة مرور جديدة لقفل هذه الملاحظة.' : 'Enter a new password to lock this note.')}
          </p>
          <form onSubmit={handleTogglePassword}>
            <input
              type="password"
              placeholder={isRTL ? 'كلمة المرور' : 'Password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field mb-4 w-full"
              autoFocus
              dir="ltr"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowSetPasswordModal(false); setNewPassword(''); }}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn-primary py-2 px-6">
                {note.is_encrypted ? (isRTL ? 'إزالة القفل' : 'Remove Lock') : (isRTL ? 'قفل' : 'Lock')}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  );

  const MoveModal = () => (
    showMoveModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" dir={isRTL ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary-400" />
            {isRTL ? 'نقل الملاحظة إلى مجلد' : 'Move Note to Folder'}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
            <button
              onClick={async () => {
                await useNotesStore.getState().moveNotes([note.id], null);
                setShowMoveModal(false);
                toast.success(isRTL ? 'تم نقل الملاحظة إلى الملاحظات العامة' : 'Note moved to General Notes');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              <span>{isRTL ? 'بدون مجلد (ملاحظات عامة)' : 'No Folder (General)'}</span>
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={async () => {
                  await useNotesStore.getState().moveNotes([note.id], f.id);
                  setShowMoveModal(false);
                  toast.success(isRTL ? `تم نقل الملاحظة إلى ${f.name}` : `Note moved to ${f.name}`);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowMoveModal(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    ) : null
  );

  const CopyModal = () => (
    showCopyModal ? (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in" dir={isRTL ? 'rtl' : 'ltr'}>
          <h3 className="text-lg font-bold text-neutral-100 mb-4 flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary-400" />
            {isRTL ? 'نسخ الملاحظة إلى مجلد' : 'Copy Note to Folder'}
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
            <button
              onClick={async () => {
                await useNotesStore.getState().copyNotes([note.id], null);
                setShowCopyModal(false);
                toast.success(isRTL ? 'تم نسخ الملاحظة إلى الملاحظات العامة' : 'Note copied to General Notes');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
              <span>{isRTL ? 'بدون مجلد (ملاحظات عامة)' : 'No Folder (General)'}</span>
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={async () => {
                  await useNotesStore.getState().copyNotes([note.id], f.id);
                  setShowCopyModal(false);
                  toast.success(isRTL ? `تم نسخ الملاحظة إلى ${f.name}` : `Note copied to ${f.name}`);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 rounded-xl transition-colors text-sm text-neutral-300 text-right rtl:text-right ltr:text-left"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    ) : null
  );

  if (viewMode === 'list') {
    return (
      <>
      <div
        onClick={handleOpenClick}
        className={`flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/30 border-b border-neutral-800/40 cursor-pointer transition-colors group relative ${selected ? 'bg-primary-500/10' : ''}`}
      >
        {selectable && (
          <div className="absolute top-3 end-4 z-10 text-primary-400">
            {selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 opacity-50" />}
          </div>
        )}
        {/* Type icon */}
        <div className={`flex-shrink-0 ${typeColors[note.note_type]}`}>
          {typeIcons[note.note_type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-neutral-200 truncate">
              {note.title || t('notes.untitled', language)}
            </h3>
            {note.is_encrypted && (
              isTemporarilyUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              )
            )}
            {note.is_pinned && <Pin className="w-3 h-3 text-primary-400 flex-shrink-0" />}
          </div>
          {(!note.is_encrypted || isTemporarilyUnlocked) && previewText && (
            <p className="text-xs text-neutral-500 truncate mt-0.5">{previewText}</p>
          )}
        </div>

        {/* Tags */}
        <div className="hidden sm:flex items-center gap-1">
          {note.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}10` }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Time */}
        <span className="text-xs text-neutral-600 flex-shrink-0 hidden md:block">{timeAgo}</span>

        {/* Actions */}
        <div className={`flex items-center gap-1 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isTemporarilyUnlocked && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(note); }}
              className="p-1.5 rounded-lg text-primary-400 hover:text-primary-300 transition-colors"
              title={isRTL ? 'تعديل الملاحظة' : 'Edit Note'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 hover:bg-neutral-700/50 rounded-lg transition-colors text-neutral-600"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div
                className="absolute bottom-8 end-0 z-20 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl p-1.5 min-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handlePin}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  {note.is_pinned ? t('notes.unpin', language) : t('notes.pin', language)}
                </button>
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {t('notes.archive', language)}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowSetPasswordModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  {note.is_encrypted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {note.is_encrypted ? (isRTL ? 'إزالة القفل' : 'Remove Lock') : (isRTL ? 'قفل الملاحظة' : 'Lock Note')}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowMoveModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {isRTL ? 'نقل إلى مجلد' : 'Move to Folder'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowCopyModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isRTL ? 'نسخ إلى مجلد' : 'Copy to Folder'}
                </button>
                <div className="h-px bg-neutral-800 my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {note.folder_id 
                    ? (isRTL ? 'إزالة من المجلد' : 'Remove from Folder') 
                    : t('notes.delete', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <UnlockModal />
      <SetPasswordModal />
      <MoveModal />
      <CopyModal />
      </>
    );
  }

  return (
    <>
    <div
      onClick={handleOpenClick}
      className={`note-card relative group ${selected ? 'ring-2 ring-primary-500 bg-primary-500/5' : ''}`}
      style={note.color && !selected ? { borderColor: `${note.color}30` } : undefined}
    >
      {selectable && (
        <div className="absolute top-3 end-3 z-10 text-primary-400">
          {selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 opacity-50" />}
        </div>
      )}
      {/* Top bar */}
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${typeColors[note.note_type]}`}>
          {typeIcons[note.note_type]}
          <span>{t(`notes.type.${note.note_type}`, language)}</span>
        </div>
        <div className="flex items-center gap-1">
          {isTemporarilyUnlocked && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(note); }}
              className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors text-primary-400 animate-pulse"
              title={isRTL ? 'تعديل الملاحظة' : 'Edit Note'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {note.is_pinned && <Pin className="w-3.5 h-3.5 text-primary-400" />}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors text-neutral-600"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div
                className="absolute top-6 end-0 z-20 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl p-1.5 min-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handlePin}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  {note.is_pinned ? t('notes.unpin', language) : t('notes.pin', language)}
                </button>
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {t('notes.archive', language)}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowSetPasswordModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  {note.is_encrypted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {note.is_encrypted ? (isRTL ? 'إزالة القفل' : 'Remove Lock') : (isRTL ? 'قفل الملاحظة' : 'Lock Note')}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowMoveModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {isRTL ? 'نقل إلى مجلد' : 'Move to Folder'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowCopyModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isRTL ? 'نسخ إلى مجلد' : 'Copy to Folder'}
                </button>
                <div className="h-px bg-neutral-800 my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {note.folder_id 
                    ? (isRTL ? 'إزالة من المجلد' : 'Remove from Folder') 
                    : t('notes.delete', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {!note.is_encrypted && note.cover_image && (
        <div className="w-full h-24 rounded-xl overflow-hidden mb-3">
          <img
            src={note.cover_image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Media thumbnail */}
      {!note.is_encrypted && note.media_thumbnail && !note.cover_image && (
        <div className="w-full h-24 rounded-xl overflow-hidden mb-3 bg-neutral-800">
          <img
            src={note.media_thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <h3 className="font-semibold text-sm text-neutral-100 mb-1.5 line-clamp-1 flex items-center gap-2">
        {note.title || t('notes.untitled', language)}
        {note.is_encrypted && (
          isTemporarilyUnlocked ? (
            <Unlock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          )
        )}
      </h3>

      {/* Preview text */}
      {(!note.is_encrypted || isTemporarilyUnlocked) && previewText ? (
        <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-3">{previewText}</p>
      ) : note.is_encrypted && !isTemporarilyUnlocked ? (
        <div className="flex flex-col items-center justify-center py-4 bg-neutral-900/50 rounded-xl mb-3 border border-neutral-800/50">
          <Lock className="w-6 h-6 text-neutral-600 mb-2" />
          <p className="text-xs text-neutral-500">{isRTL ? 'محتوى محمي بكلمة مرور' : 'Password protected content'}</p>
        </div>
      ) : null}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}10` }}
            >
              {tag.name}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-neutral-600">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-800/40">
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
        {note.word_count > 0 && (
          <span className="text-xs text-neutral-700">
            {note.word_count} {t('notes.words', language)}
          </span>
        )}
      </div>
    </div>
    <UnlockModal />
    <SetPasswordModal />
    <MoveModal />
    <CopyModal />
    </>
  );
}
