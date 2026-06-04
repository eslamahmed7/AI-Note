import React from 'react';
import type { Note, NoteType } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { t } from '../../lib/i18n';
import {
  Pin, Archive, Trash2, MoreVertical, Clock, FileText,
  Mic, Image, Video, File, Link, FileType, Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

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
}

export default function NoteCard({ note, onOpen, viewMode }: NoteCardProps) {
  const { language } = useSettingsStore();
  const { updateNote, deleteNote } = useNotesStore();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const locale = language === 'ar' ? ar : enUS;

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
    deleteNote(note.id);
    setMenuOpen(false);
  };

  const previewText = note.content
    ?.replace(/[#*`>_~\[\]]/g, '')
    ?.substring(0, viewMode === 'grid' ? 120 : 80)
    ?.trim();

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpen(note)}
        className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/30 border-b border-neutral-800/40 cursor-pointer transition-colors group"
      >
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
            {note.is_pinned && <Pin className="w-3 h-3 text-primary-400 flex-shrink-0" />}
          </div>
          {previewText && (
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
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePin}
            className={`p-1.5 rounded-lg transition-colors ${note.is_pinned ? 'text-primary-400' : 'text-neutral-600 hover:text-neutral-300'}`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpen(note)}
      className="note-card relative group"
      style={note.color ? { borderColor: `${note.color}30` } : undefined}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${typeColors[note.note_type]}`}>
          {typeIcons[note.note_type]}
          <span>{t(`notes.type.${note.note_type}`, language)}</span>
        </div>
        <div className="flex items-center gap-1">
          {note.is_pinned && <Pin className="w-3.5 h-3.5 text-primary-400" />}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors text-neutral-600 opacity-0 group-hover:opacity-100"
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
                <div className="h-px bg-neutral-800 my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('notes.delete', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {note.cover_image && (
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
      {note.media_thumbnail && !note.cover_image && (
        <div className="w-full h-24 rounded-xl overflow-hidden mb-3 bg-neutral-800">
          <img
            src={note.media_thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-sm text-neutral-100 mb-1.5 line-clamp-1">
        {note.title || t('notes.untitled', language)}
      </h3>

      {/* Preview text */}
      {previewText && (
        <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-3">{previewText}</p>
      )}

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
  );
}
