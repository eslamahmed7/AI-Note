import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { t } from '../../lib/i18n';
import { Search, X, StickyNote, Tag, Folder, FileText, Mic, Image, Video, FileType, Link, File } from 'lucide-react';
import type { Note, NoteType } from '../../types';

const typeIcons: Record<NoteType, React.ReactNode> = {
  text: <FileText className="w-4 h-4" />,
  voice: <Mic className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  pdf: <FileType className="w-4 h-4" />,
  link: <Link className="w-4 h-4" />,
  file: <File className="w-4 h-4" />,
};

interface SearchPageProps {
  onOpenNote: (note: Note) => void;
}

export default function SearchPage({ onOpenNote }: SearchPageProps) {
  const { language } = useSettingsStore();
  const { notes, tags, folders } = useNotesStore();
  const isRTL = language === 'ar';
  const [query, setQuery] = useState('');

  const results = query.trim().length > 1
    ? notes.filter((n) => {
        const q = query.toLowerCase();
        return (
          !n.is_deleted &&
          (n.title?.toLowerCase().includes(q) ||
           n.content?.toLowerCase().includes(q) ||
           n.tags?.some((t) => t.name.toLowerCase().includes(q)) ||
           n.ai_summary?.toLowerCase().includes(q))
        );
      })
    : [];

  const highlight = (text: string, q: string) => {
    if (!q || !text) return text;
    const regex = new RegExp(`(${q})`, 'gi');
    return text.replace(regex, '<mark class="bg-primary-500/30 text-primary-300 rounded px-0.5">$1</mark>');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-4 border-b border-neutral-800/40">
        <div className="relative">
          <Search className="absolute top-3.5 right-4 ltr:right-auto ltr:left-4 w-4 h-4 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder', language)}
            className="input-field text-sm pr-11 pl-11 ltr:pr-11 ltr:pl-11"
            autoFocus
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-3.5 left-4 ltr:left-auto ltr:right-4 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!query.trim() ? (
          <div className="space-y-4">
            {/* Quick filters */}
            <div>
              <h3 className="text-xs text-neutral-600 uppercase tracking-wider mb-2">
                {isRTL ? 'الوسوم' : 'Tags'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setQuery(tag.name)}
                    className="tag-chip border"
                    style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}10` }}
                  >
                    <Tag className="w-3 h-3" />
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent folders */}
            {folders.length > 0 && (
              <div>
                <h3 className="text-xs text-neutral-600 uppercase tracking-wider mb-2">
                  {isRTL ? 'المجلدات' : 'Folders'}
                </h3>
                <div className="space-y-1">
                  {folders.slice(0, 5).map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setQuery(folder.name)}
                      className="flex items-center gap-2 w-full text-start px-3 py-2 hover:bg-neutral-800/50 rounded-xl transition-colors"
                    >
                      <Folder className="w-4 h-4" style={{ color: folder.color }} />
                      <span className="text-sm text-neutral-400">{folder.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Search className="w-8 h-8 text-neutral-700 mb-3" />
            <p className="text-neutral-500 text-sm">{t('search.no_results', language)}</p>
            <p className="text-neutral-700 text-xs mt-1">
              {isRTL ? `لا نتائج لـ "${query}"` : `No results for "${query}"`}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-neutral-600 mb-3">
              {results.length} {isRTL ? 'نتيجة' : 'results'}
            </p>
            <div className="space-y-2">
              {results.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onOpenNote(note)}
                  className="w-full text-start p-3 bg-neutral-900/60 hover:bg-neutral-900/80 border border-neutral-800/40 hover:border-neutral-700/40 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`type-${note.note_type}`}>
                      {typeIcons[note.note_type]}
                    </span>
                    <h4
                      className="text-sm font-medium text-neutral-200"
                      dangerouslySetInnerHTML={{
                        __html: highlight(note.title || t('notes.untitled', language), query)
                      }}
                    />
                  </div>
                  {note.content && (
                    <p
                      className="text-xs text-neutral-500 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: highlight(note.content.substring(0, 200), query)
                      }}
                    />
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {note.tags.map((tag) => (
                        <span key={tag.id} className="text-xs" style={{ color: tag.color }}>
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
