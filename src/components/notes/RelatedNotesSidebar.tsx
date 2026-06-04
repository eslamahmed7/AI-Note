import React, { useMemo } from 'react';
import { FileText, Sparkles, ChevronRight, X, Lightbulb } from 'lucide-react';
import type { Note } from '../../types';
import { useNotesStore } from '../../stores/notesStore';

interface RelatedNotesSidebarProps {
  currentNote: Note;
  isOpen: boolean;
  onClose: () => void;
  onOpenNote: (note: Note) => void;
  language: string;
}

// --- Simple TF-IDF similarity ---
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '') // Strip HTML
    .replace(/[^a-zA-Z\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function computeTfIdf(
  targetTokens: string[],
  allDocs: string[][],
): Record<string, number> {
  const N = allDocs.length;
  const tf: Record<string, number> = {};
  for (const token of targetTokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  // Normalize TF
  const maxTf = Math.max(...Object.values(tf), 1);
  for (const key of Object.keys(tf)) {
    tf[key] = tf[key] / maxTf;
  }

  const idf: Record<string, number> = {};
  const uniqueTokens = [...new Set(targetTokens)];
  for (const token of uniqueTokens) {
    const docCount = allDocs.filter((doc) => doc.includes(token)).length;
    idf[token] = Math.log((N + 1) / (docCount + 1)) + 1;
  }

  const tfidf: Record<string, number> = {};
  for (const token of uniqueTokens) {
    tfidf[token] = (tf[token] || 0) * (idf[token] || 1);
  }
  return tfidf;
}

function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  const keysA = Object.keys(vecA);
  if (keysA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key of keysA) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dotProduct += a * b;
    normA += a * a;
  }

  for (const key of Object.keys(vecB)) {
    normB += vecB[key] * vecB[key];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function similarityScore(
  targetText: string,
  candidateText: string,
  allTexts: string[],
): number {
  const allDocs = allTexts.map(tokenize);
  const targetTokens = tokenize(targetText);
  const candidateTokens = tokenize(candidateText);

  const targetVec = computeTfIdf(targetTokens, allDocs);
  const candidateVec = computeTfIdf(candidateTokens, allDocs);

  return cosineSimilarity(targetVec, candidateVec);
}

// --- Component ---
export default function RelatedNotesSidebar({
  currentNote,
  isOpen,
  onClose,
  onOpenNote,
  language,
}: RelatedNotesSidebarProps) {
  const { notes } = useNotesStore();
  const isRTL = language === 'ar';

  const related = useMemo(() => {
    const candidates = notes.filter(
      (n) => n.id !== currentNote.id && !n.is_deleted && !n.is_archived,
    );

    if (candidates.length === 0) return [];

    const targetText = `${currentNote.title} ${currentNote.content}`;
    const allTexts = [targetText, ...candidates.map((n) => `${n.title} ${n.content}`)];

    const scored = candidates.map((note) => ({
      note,
      score: similarityScore(targetText, `${note.title} ${note.content}`, allTexts),
    }));

    return scored
      .filter((s) => s.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [currentNote, notes]);

  const getScoreColor = (score: number) => {
    if (score > 0.4) return 'text-green-400 bg-green-500/10';
    if (score > 0.2) return 'text-yellow-400 bg-yellow-500/10';
    return 'text-neutral-500 bg-neutral-500/10';
  };

  const getScoreLabel = (score: number) => {
    if (score > 0.4) return isRTL ? 'صلة عالية' : 'High';
    if (score > 0.2) return isRTL ? 'صلة متوسطة' : 'Medium';
    return isRTL ? 'صلة خفيفة' : 'Low';
  };

  return (
    <div
      className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-s border-neutral-800/40 bg-neutral-950/80 ${
        isOpen ? 'w-64' : 'w-0'
      }`}
    >
      <div className="w-64 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-neutral-300">
              {isRTL ? 'ملاحظات مشابهة' : 'Related Notes'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {related.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <div className="w-10 h-10 bg-neutral-800 rounded-2xl flex items-center justify-center mb-3">
                <Lightbulb className="w-5 h-5 text-neutral-600" />
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {isRTL
                  ? 'لم يتم العثور على ملاحظات ذات صلة. اكتب المزيد لاكتشاف الروابط!'
                  : 'No related notes found. Write more to discover connections!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-neutral-700 uppercase tracking-wider px-1 mb-3">
                {isRTL ? `${related.length} ملاحظة ذات صلة` : `${related.length} related notes found`}
              </p>
              {related.map(({ note, score }) => (
                <button
                  key={note.id}
                  onClick={() => onOpenNote(note)}
                  className="w-full text-start p-3 bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/60 hover:border-neutral-700 rounded-2xl transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-3 h-3 text-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-300 truncate group-hover:text-neutral-100 transition-colors">
                        {note.title || (isRTL ? 'بدون عنوان' : 'Untitled')}
                      </p>
                      {note.content && (
                        <p className="text-[10px] text-neutral-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {note.content.replace(/<[^>]+>/g, '').substring(0, 80)}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getScoreColor(score)}`}>
                          {getScoreLabel(score)} ({Math.round(score * 100)}%)
                        </span>
                        <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-neutral-800/60 flex-shrink-0">
          <p className="text-[9px] text-neutral-700 text-center">
            {isRTL ? 'يُحدَّث تلقائياً أثناء الكتابة' : 'Auto-updates as you type'}
          </p>
        </div>
      </div>
    </div>
  );
}
