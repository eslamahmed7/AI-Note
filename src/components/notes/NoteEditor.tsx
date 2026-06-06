import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Note, Tag } from '../../types';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { t } from '../../lib/i18n';
import {
  X, Tag as TagIcon, Pin, Trash2, Sparkles, Bold,
  Italic, Underline, List, ListOrdered, Quote, Code,
  Heading1, Heading2, Minus, AlignLeft, Link as LinkIcon,
  CheckSquare, Table, ArrowLeft, ArrowRight,
  Strikethrough, Subscript, Superscript, Palette, Highlighter,
  AlignCenter, AlignRight, AlignJustify, Undo, Redo,
  Search, Download, Printer, Maximize2, Minimize2, MoreVertical,
  Mic, Square, Video, Image as ImageIcon, FileUp, Volume2,
  Music, Pen, Calculator, Lock, Unlock,
  PanelLeft, PanelRight, Plus, Wind, LayoutTemplate,
} from 'lucide-react';
import { hashPassword } from '../../lib/crypto';
import toast from 'react-hot-toast';
import RelatedNotesSidebar from './RelatedNotesSidebar';
import AIPromptTemplates from '../ai/AIPromptTemplates';
import DrawingCanvas from './DrawingCanvas';
import { evaluateFormula, isFormula } from '../../lib/formulaEvaluator';

interface NoteEditorProps {
  note: Note | null;
  onClose: () => void;
  onAISummarize?: (note: Note) => void;
}

// 50+ color palette (text colors)
const colors = [
  // Neutral
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Gray', value: '#9ca3af' },
  { name: 'Dark Gray', value: '#4b5563' },
  { name: 'Black', value: '#111827' },
  // Red family
  { name: 'Red 400', value: '#f87171' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Red 700', value: '#b91c1c' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Crimson', value: '#dc2626' },
  // Orange/Amber family
  { name: 'Orange 400', value: '#fb923c' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber 400', value: '#fbbf24' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Gold', value: '#f59e0b' },
  // Green family
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green 400', value: '#4ade80' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Green 700', value: '#15803d' },
  // Teal/Cyan
  { name: 'Teal 400', value: '#2dd4bf' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan 400', value: '#22d3ee' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  // Blue family
  { name: 'Blue 400', value: '#60a5fa' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Blue 700', value: '#1d4ed8' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cobalt', value: '#2563eb' },
  // Purple family
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Purple 400', value: '#c084fc' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Purple 700', value: '#7e22ce' },
  { name: 'Fuchsia', value: '#d946ef' },
  // Pink/Red
  { name: 'Pink 400', value: '#f472b6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Hot Pink', value: '#db2777' },
  // Warm tones
  { name: 'Coral', value: '#ff6b6b' },
  { name: 'Salmon', value: '#fa8072' },
  { name: 'Peach', value: '#ffb347' },
  { name: 'Lavender', value: '#967bb6' },
  { name: 'Mint', value: '#98ff98' },
];

// 40+ highlight/background colors
const bgColors = [
  { name: 'None', value: 'transparent' },
  { name: 'Yellow', value: 'rgba(234, 179, 8, 0.30)' },
  { name: 'Orange', value: 'rgba(249, 115, 22, 0.25)' },
  { name: 'Red', value: 'rgba(239, 68, 68, 0.20)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.20)' },
  { name: 'Purple', value: 'rgba(168, 85, 247, 0.20)' },
  { name: 'Indigo', value: 'rgba(99, 102, 241, 0.20)' },
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.20)' },
  { name: 'Cyan', value: 'rgba(6, 182, 212, 0.20)' },
  { name: 'Teal', value: 'rgba(20, 184, 166, 0.20)' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.20)' },
  { name: 'Lime', value: 'rgba(132, 204, 22, 0.25)' },
  { name: 'Amber', value: 'rgba(245, 158, 11, 0.25)' },
  { name: 'Rose', value: 'rgba(244, 63, 94, 0.20)' },
  { name: 'Fuchsia', value: 'rgba(217, 70, 239, 0.20)' },
  { name: 'Violet', value: 'rgba(124, 58, 237, 0.20)' },
  { name: 'Sky', value: 'rgba(14, 165, 233, 0.20)' },
  { name: 'Emerald', value: 'rgba(16, 185, 129, 0.20)' },
  { name: 'Coral', value: 'rgba(255, 107, 107, 0.25)' },
  { name: 'Gold', value: 'rgba(255, 215, 0, 0.30)' },
  { name: 'Mint', value: 'rgba(152, 255, 152, 0.25)' },
  { name: 'Lavender', value: 'rgba(150, 123, 182, 0.25)' },
  { name: 'Salmon', value: 'rgba(250, 128, 114, 0.25)' },
  { name: 'Peach', value: 'rgba(255, 179, 71, 0.25)' },
  { name: 'Light Blue', value: 'rgba(173, 216, 230, 0.35)' },
];

const fonts = [
  { name: 'Default', value: 'inherit' },
  { name: 'Cairo (Arabic)', value: 'Cairo, Noto Sans Arabic, sans-serif' },
  { name: 'Tajawal (Arabic)', value: 'Tajawal, sans-serif' },
  { name: 'Almarai (Arabic)', value: 'Almarai, sans-serif' },
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Outfit', value: 'Outfit, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Palatino', value: 'Palatino Linotype, Book Antiqua, Palatino, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Monaco', value: 'Monaco, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { name: 'Impact', value: 'Impact, Charcoal, sans-serif' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive, sans-serif' },
];

const fontSizes = [
  { name: 'Small', value: '2' },
  { name: 'Normal', value: '3' },
  { name: 'Large', value: '5' },
  { name: 'Title', value: '6' },
  { name: 'Huge', value: '7' },
];

export default function NoteEditor({ note, onClose, onAISummarize }: NoteEditorProps) {
  const { language } = useSettingsStore();
  const { updateNote, deleteNote, tags: allTags } = useNotesStore();
  const isRTL = language === 'ar';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  // Password Lock
  const [showLockModal, setShowLockModal] = useState(false);
  const [notePassword, setNotePassword] = useState('');

  // Advanced Editor States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [zenAmbient, setZenAmbient] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Advanced Editor States
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // New features state
  const [showDrawing, setShowDrawing] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [formulaInput, setFormulaInput] = useState('=');
  const [formulaResult, setFormulaResult] = useState('');

  // Active typography states (Word-like)
  const [activeFont, setActiveFont] = useState(isRTL ? 'الخط الافتراضي' : 'Default');
  const [activeSize, setActiveSize] = useState(isRTL ? 'عادي' : 'Normal');
  const [customFontSize, setCustomFontSize] = useState('16');
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [customBgColor, setCustomBgColor] = useState('#ffff00');

  // Table build hover coordinates
  const [hoverRow, setHoverRow] = useState(-1);
  const [hoverCol, setHoverCol] = useState(-1);
  const [tableRowsInput, setTableRowsInput] = useState('3');
  const [tableColsInput, setTableColsInput] = useState('3');
  
  // Search & Replace
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  // Audio Recorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Statistics
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);

  // Mobile active tool category
  const [activeCategory, setActiveCategory] = useState<'text' | 'paragraph' | 'insert' | 'tools' | null>(null);

  const closeAllDropdowns = useCallback(() => {
    setShowTextColor(false);
    setShowBgColor(false);
    setShowTablePicker(false);
    setShowFontPicker(false);
    setShowSizePicker(false);
    setShowMoreActions(false);
    setShowTagPicker(false);
  }, []);

  // Close all dropdown menus and active mobile category when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-group')) {
        closeAllDropdowns();
        setActiveCategory(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [closeAllDropdowns]);

  // DOM Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Zen Mode ambient audio refs
  const zenAudioRef = useRef<OscillatorNode | null>(null);
  const zenAudioCtxRef = useRef<AudioContext | null>(null);

  // Interactive resizing states & refs
  const [activeResizeElement, setActiveResizeElement] = useState<HTMLElement | null>(null);
  const [resizeRect, setResizeRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const updateActiveStyles = useCallback(() => {
    if (!editorRef.current) return;
    const font = document.queryCommandValue('fontName') || 'inherit';
    const size = document.queryCommandValue('fontSize') || '3';
    const matchedFont = fonts.find(f => f.value.includes(font) || font.includes(f.value))?.name || (isRTL ? 'الافتراضي' : 'Default');
    const matchedSize = fontSizes.find(fs => fs.value === size)?.name || (isRTL ? 'عادي' : 'Normal');
    setActiveFont(matchedFont);
    setActiveSize(matchedSize);
  }, [isRTL]);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setSelectedTags(note.tags || []);
      
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content || '';
        const text = editorRef.current.innerText || '';
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
        setCharCount(text.length);
        setParagraphCount(text.split(/\n+/).filter(Boolean).length);
        setSentenceCount(text.split(/[.!?]+/).filter(Boolean).length);
        updateActiveStyles();
      }
    }
  }, [note?.id, updateActiveStyles]);

  const updateResizeRect = useCallback(() => {
    if (!activeResizeElement || !scrollContainerRef.current) {
      setResizeRect(null);
      return;
    }
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const elemRect = activeResizeElement.getBoundingClientRect();
    setResizeRect({
      top: elemRect.top - containerRect.top + scrollContainerRef.current.scrollTop,
      left: elemRect.left - containerRect.left + scrollContainerRef.current.scrollLeft,
      width: elemRect.width,
      height: elemRect.height,
    });
  }, [activeResizeElement]);

  useEffect(() => {
    if (!activeResizeElement) {
      setResizeRect(null);
      return;
    }
    updateResizeRect();
    const handleScrollOrResize = () => updateResizeRect();
    window.addEventListener('resize', handleScrollOrResize);
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScrollOrResize, { passive: true });
    }
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      if (container) {
        container.removeEventListener('scroll', handleScrollOrResize);
      }
    };
  }, [activeResizeElement, updateResizeRect]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeResizeElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        activeResizeElement.remove();
        setActiveResizeElement(null);
        handleContentInput();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeResizeElement]);

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeResizeElement) return;

    const startX = e.clientX;
    const startWidth = activeResizeElement.getBoundingClientRect().width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth;

      if (handle === 'br' || handle === 'tr') {
        newWidth = startWidth + deltaX;
      } else if (handle === 'bl' || handle === 'tl') {
        newWidth = startWidth - deltaX;
      }

      if (newWidth < 50) newWidth = 50;

      activeResizeElement.style.width = `${newWidth}px`;
      activeResizeElement.style.height = 'auto';

      updateResizeRect();
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      handleContentInput();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      setActiveResizeElement(target);
    } else {
      setActiveResizeElement(null);
    }
  };

  const autoSave = useCallback((newTitle: string, newContent: string) => {
    if (!note) return;
    setSaved(false);
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      const text = editorRef.current?.innerText || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      await updateNote(note.id, {
        title: newTitle,
        content: newContent,
        word_count: words,
        char_count: text.length,
        reading_time: Math.ceil(words / 200),
      });
      setSaving(false);
      setSaved(true);
      setWordCount(words);
      setCharCount(text.length);
      setParagraphCount(text.split(/\n+/).filter(Boolean).length);
      setSentenceCount(text.split(/[.!?]+/).filter(Boolean).length);
    }, 1000);
  }, [note, updateNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    autoSave(e.target.value, content);
  };

  const handleContentInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      autoSave(title, editorRef.current.innerHTML);
    }
  };

  const execFormat = (command: string, value?: string) => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleContentInput();
    updateActiveStyles();
  };

  const handleCustomFontSize = (size: string) => {
    setCustomFontSize(size);
    execFormat('fontSize', '7');
    if (editorRef.current) {
      const fontElements = editorRef.current.getElementsByTagName('font');
      for (let i = 0; i < fontElements.length; i++) {
        if (fontElements[i].getAttribute('size') === '7') {
          fontElements[i].removeAttribute('size');
          fontElements[i].style.fontSize = `${size}px`;
          fontElements[i].style.lineHeight = 'normal';
        }
      }
      handleContentInput();
      setActiveSize(`${size}px`);
    }
  };

  const handleDeleteNote = async () => {
    if (!note) return;
    const isInFolder = !!note.folder_id;
    const confirmMessage = isInFolder
      ? (isRTL ? 'هل أنت متأكد من إزالة هذه الملاحظة من المجلد؟' : 'Are you sure you want to remove this note from the folder?')
      : (isRTL ? 'هل أنت متأكد من نقل هذه الملاحظة إلى سلة المهملات؟' : 'Are you sure you want to move this note to trash?');
      
    const confirmDelete = window.confirm(confirmMessage);
    if (confirmDelete) {
      await deleteNote(note.id);
      onClose();
    }
  };

  const handleTagToggle = async (tag: Tag) => {
    if (!note) return;
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    let newTags: Tag[];
    if (isSelected) {
      newTags = selectedTags.filter((t) => t.id !== tag.id);
    } else {
      newTags = [...selectedTags, tag];
    }
    setSelectedTags(newTags);
    await updateNote(note.id, { tags: newTags });
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;
    const pwdHash = notePassword ? await hashPassword(notePassword) : null;
    await updateNote(note.id, { password_hash: pwdHash, is_encrypted: !!pwdHash });
    setShowLockModal(false);
    toast.success(isRTL ? (pwdHash ? 'تم قفل الملاحظة بنجاح' : 'تم إزالة القفل') : (pwdHash ? 'Note locked successfully' : 'Lock removed'));
  };

  // Media File uploads (Base64)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'pdf' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الملف يتجاوز 10 ميجابايت' : 'File exceeds 10MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      let html = '';
      if (type === 'image') {
        html = `<img src="${base64}" alt="${file.name}" class="max-w-full rounded-xl my-3 border border-neutral-800" /><p><br></p>`;
      } else if (type === 'video') {
        html = `<video controls class="w-full rounded-xl my-3 border border-neutral-800" src="${base64}"></video><p><br></p>`;
      } else if (type === 'audio') {
        html = `<audio controls class="w-full my-3" src="${base64}"></audio><p><br></p>`;
      } else {
        const isPdf = type === 'pdf' || file.name.endsWith('.pdf');
        const iconName = isPdf ? '📄' : '📁';
        const typeLabel = isPdf ? 'PDF' : file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const sizeLabel = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        html = `
          <div class="my-3" contenteditable="false">
            <a href="${base64}" download="${file.name}" class="file-attachment-card">
              <span class="text-xl">${iconName}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-300 truncate m-0">${file.name}</p>
                <p class="text-xs text-neutral-500 m-0">${sizeLabel} (${typeLabel})</p>
              </div>
            </a>
          </div>
          <p><br></p>
        `;
      }
      execFormat('insertHTML', html);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Inline Audio Recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const audioHtml = `<audio controls src="${base64data}" class="w-full my-3"></audio><p><br></p>`;
          execFormat('insertHTML', audioHtml);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل الوصول للميكروفون' : 'Failed to access microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Table Builder
  const handleInsertTable = (rows = 3, cols = 3) => {
    let html = '<table class="w-full border-collapse my-3">';
    html += '<thead><tr>';
    for (let j = 0; j < cols; j++) {
      html += `<th class="bg-neutral-800 border border-neutral-700 px-3 py-2 font-semibold text-neutral-200">${isRTL ? 'عنوان' : 'Header'} ${j + 1}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        html += `<td class="border border-neutral-700 px-3 py-2 text-neutral-300">${isRTL ? 'خلية' : 'Cell'} ${i + 1}-${j + 1}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    execFormat('insertHTML', html);
    setShowTablePicker(false);
  };

  // Search & Replace actions
  const handleSearch = () => {
    if (!searchQuery) return;
    // Native window.find(string, caseSensitive, backwards, wrapAround, wholeWord, searchInFrames, showDialog)
    const found = (window as any).find(searchQuery, false, false, true, false, false, false);
    if (!found) {
      toast.error(isRTL ? 'لا توجد مطابقة' : 'No matches found');
    }
  };

  const handleReplace = () => {
    if (!searchQuery) return;
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === searchQuery.toLowerCase()) {
      document.execCommand('insertText', false, replaceQuery);
      (window as any).find(searchQuery, false, false, true, false, false, false);
      handleContentInput();
    } else {
      handleSearch();
    }
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !searchQuery) return;
    let count = 0;
    window.getSelection()?.removeAllRanges();
    while ((window as any).find(searchQuery, false, false, true, false, false, false)) {
      document.execCommand('insertText', false, replaceQuery);
      count++;
      if (count > 250) break;
    }
    if (count > 0) {
      toast.success(isRTL ? `تم استبدال ${count} تطابق` : `Replaced ${count} occurrences`);
      handleContentInput();
    } else {
      toast.error(isRTL ? 'لم يتم العثور على أي تطابقات لاستبدالها' : 'No matches found to replace');
    }
  };

  // Export options
  const handleExportTxt = () => {
    const text = editorRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'Untitled Note'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHtml = () => {
    const html = editorRef.current?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html>
<html lang="${language}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${title || 'Note'}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; background: #09090b; color: #f4f4f5; }
    h1 { border-bottom: 1px solid #27272a; padding-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th { background-color: #27272a; border: 1px solid #3f3f46; padding: 8px; text-align: ${isRTL ? 'right' : 'left'}; color: #fff; }
    td { border: 1px solid #3f3f46; padding: 8px; }
    img, video { max-width: 100%; border-radius: 8px; margin: 12px 0; }
    blockquote { border-${isRTL ? 'right' : 'left'}: 4px solid #3b82f6; padding: 0 1rem; margin: 1rem 0; color: #a1a1aa; font-style: italic; }
    .file-attachment-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; text-decoration: none; color: #60a5fa; }
  </style>
</head>
<body>
  <h1>${title || 'Untitled Note'}</h1>
  <div>${html}</div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'Untitled Note'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html>
<head>
  <title>${title || 'Note'}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th { background-color: #f4f4f5; border: 1px solid #e4e4e7; padding: 8px; text-align: ${isRTL ? 'right' : 'left'}; }
    td { border: 1px solid #e4e4e7; padding: 8px; }
    img, video { max-width: 100%; border-radius: 8px; margin: 12px 0; }
    blockquote { border-${isRTL ? 'right' : 'left'}: 4px solid #3b82f6; padding: 0 1rem; margin: 1rem 0; color: #71717a; font-style: italic; }
  </style>
</head>
<body onload="window.print();window.close();">
  <h1>${title || 'Untitled Note'}</h1>
  <div>${editorRef.current?.innerHTML || ''}</div>
</body>
</html>`);
    printWindow.document.close();
  };

  // Markdown Shortcut Handler
  const handleMarkdownShortcut = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (!editorRef.current) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent || '';
    const offset = range.startOffset;
    const lineText = text.substring(0, offset);

    const patterns: { regex: RegExp; action: () => void }[] = [
      { regex: /^# $/, action: () => { document.execCommand('formatBlock', false, 'h1'); document.execCommand('delete'); } },
      { regex: /^## $/, action: () => { document.execCommand('formatBlock', false, 'h2'); document.execCommand('delete'); document.execCommand('delete'); } },
      { regex: /^### $/, action: () => { document.execCommand('formatBlock', false, 'h3'); document.execCommand('delete'); document.execCommand('delete'); document.execCommand('delete'); } },
      { regex: /^---$/, action: () => { document.execCommand('delete'); document.execCommand('delete'); document.execCommand('delete'); document.execCommand('insertHorizontalRule'); } },
      { regex: /^- $/, action: () => { document.execCommand('insertUnorderedList'); document.execCommand('delete'); document.execCommand('delete'); } },
      { regex: /^\* $/, action: () => { document.execCommand('insertUnorderedList'); document.execCommand('delete'); document.execCommand('delete'); } },
      { regex: /^1\. $/, action: () => { document.execCommand('insertOrderedList'); document.execCommand('delete'); document.execCommand('delete'); document.execCommand('delete'); } },
      { regex: /^> $/, action: () => { document.execCommand('formatBlock', false, 'blockquote'); document.execCommand('delete'); document.execCommand('delete'); } },
    ];

    for (const { regex, action } of patterns) {
      if (regex.test(lineText)) {
        e.preventDefault();
        action();
        handleContentInput();
        return;
      }
    }
  }, [handleContentInput]);

  // Zen Mode ambient audio
  const toggleZenAmbient = () => {
    if (zenAmbient) {
      zenAudioCtxRef.current?.close();
      zenAudioCtxRef.current = null;
      zenAudioRef.current = null;
      setZenAmbient(false);
    } else {
      try {
        const ctx = new AudioContext();
        zenAudioCtxRef.current = ctx;
        // Binaural beat: 40Hz alpha waves
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        osc2.frequency.setValueAtTime(210, ctx.currentTime); // 10Hz difference = alpha
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc1.start();
        osc2.start();
        zenAudioRef.current = osc1;
        setZenAmbient(true);
        toast.success(isRTL ? '🎵 النغمات المحيطية نشطة' : '🎵 Ambient tones active', { duration: 2000 });
      } catch {
        toast.error(isRTL ? 'فشل تشغيل الصوت' : 'Audio failed');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      zenAudioCtxRef.current?.close();
    };
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!note) return null;

  return (
    <div className={`flex flex-col h-full bg-neutral-950 dark:bg-neutral-950 animate-fade-in max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:h-[100dvh] max-lg:w-screen ${
      isZenMode ? 'zen-mode' : (isFullscreen ? 'editor-fullscreen' : '')
    }`}>
      {/* Hidden Upload Inputs */}
      <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'image')} />
      <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'video')} />
      <input type="file" ref={audioInputRef} accept="audio/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'audio')} />
      <input type="file" ref={fileInputRef} accept="*" className="hidden" onChange={(e) => handleMediaUpload(e, 'file')} />

      {/* Top Header */}
      <div className="flex items-center gap-3 px-4 min-h-14 h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] border-b border-neutral-800/60 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500 hover:text-neutral-300"
        >
          <BackIcon className="w-4 h-4" />
        </button>

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs">
          {saving ? (
            <div className="flex items-center gap-1 text-neutral-500">
              <div className="loading-dots"><span /><span /><span /></div>
              <span>{t('status.saving', language)}</span>
            </div>
          ) : saved ? (
            <span className="text-neutral-600">{t('notes.saved', language)}</span>
          ) : null}
        </div>

          {/* Zen Mode Controls (only in zen mode) */}
          {isZenMode && (
            <button
              onClick={toggleZenAmbient}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                zenAmbient
                  ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                  : 'text-neutral-500 hover:text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800'
              }`}
              title={isRTL ? 'نغمات مُحيطية' : 'Ambient Tones'}
            >
              <Music className="w-3.5 h-3.5" />
              <span>{isRTL ? (zenAmbient ? 'إيقاف الصوت' : 'نغمات هادئة') : (zenAmbient ? 'Stop Audio' : 'Ambient Sound')}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 ms-auto">
            {/* Related Notes Toggle */}
            <button
              onClick={() => setShowRelated(!showRelated)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                showRelated
                  ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
                  : 'text-neutral-500 hover:text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800'
              }`}
              title={isRTL ? 'ملاحظات مشابهة' : 'Related Notes'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRTL ? 'مشابهة' : 'Related'}</span>
            </button>

            {/* Tag picker */}
            <div className="relative dropdown-group">
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{selectedTags.length > 0 ? `${selectedTags.length}` : t('nav.tags', language)}</span>
            </button>
            {showTagPicker && (
              <div className="absolute top-9 end-0 z-20 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl p-3 min-w-[180px]">
                <p className="text-xs text-neutral-500 mb-2">{t('tags.manage', language)}</p>
                {allTags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-neutral-800 rounded-lg px-2">
                    <input
                      type="checkbox"
                      checked={selectedTags.some((t) => t.id === tag.id)}
                      onChange={() => handleTagToggle(tag)}
                      className="rounded accent-primary-500"
                    />
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-xs text-neutral-300">{tag.name}</span>
                  </label>
                ))}
                {allTags.length === 0 && <p className="text-xs text-neutral-600 py-2">{t('tags.empty', language)}</p>}
              </div>
            )}
          </div>

          {/* AI Summarize */}
          {onAISummarize && (
            <button
              onClick={() => onAISummarize(note)}
              className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 bg-primary-600/10 hover:bg-primary-600/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('ai.summarize', language)}</span>
            </button>
          )}

            {/* Desktop secondary buttons (hidden on mobile, inline on desktop) */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Zen Mode */}
              <button
                onClick={() => { setIsZenMode(!isZenMode); setIsFullscreen(false); }}
                className={`p-2 rounded-lg transition-colors ${
                  isZenMode
                    ? 'text-green-400 bg-green-500/10'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                }`}
                title={isRTL ? 'وضع التركيز الهادئ' : 'Zen Focus Mode'}
              >
                <Wind className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                title={isRTL ? 'ملء الشاشة' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Lock Note */}
              <button
                onClick={() => setShowLockModal(true)}
                className={`p-2 rounded-lg transition-colors ${note.is_encrypted ? 'text-amber-500 bg-amber-500/10' : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800'}`}
                title={isRTL ? 'قفل الملاحظة' : 'Lock Note'}
              >
                {note.is_encrypted ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>

              {/* Print & Export */}
              <div className="relative group">
                <button className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <div className="absolute top-9 end-0 hidden group-hover:block hover:block z-20 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl p-1.5 min-w-[150px]">
                  <button onClick={handleExportTxt} className="w-full text-right ltr:text-left px-3 py-1.5 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300">
                    {isRTL ? 'تحميل كملف نصي TXT' : 'Export as TXT'}
                  </button>
                  <button onClick={handleExportHtml} className="w-full text-right ltr:text-left px-3 py-1.5 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300">
                    {isRTL ? 'تحميل كملف HTML' : 'Export as HTML'}
                  </button>
                  <button onClick={handlePrint} className="w-full text-right ltr:text-left px-3 py-1.5 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 border-t border-neutral-800 mt-1 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-neutral-500" />
                    {isRTL ? 'طباعة الملاحظة' : 'Print Note'}
                  </button>
                </div>
              </div>

              {/* Pin */}
              <button
                onClick={() => updateNote(note.id, { is_pinned: !note.is_pinned })}
                className={`p-2 rounded-lg transition-colors ${note.is_pinned ? 'text-primary-400 bg-primary-600/10' : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800'}`}
              >
                <Pin className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={handleDeleteNote}
                className="p-2 text-neutral-600 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                title={isRTL ? 'نقل إلى سلة المهملات' : 'Move to Trash'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile secondary actions (collapsed under a three-dots menu on mobile) */}
            <div className="relative md:hidden dropdown-group">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className={`p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors ${
                  showMoreActions ? 'bg-neutral-800 text-neutral-200' : ''
                }`}
                title={isRTL ? 'المزيد من الخيارات' : 'More Actions'}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMoreActions && (
                <div className="absolute top-9 end-0 z-30 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl p-1.5 min-w-[200px] animate-scale-in">
                  {/* Zen Mode */}
                  <button
                    onClick={() => {
                      setIsZenMode(!isZenMode);
                      setIsFullscreen(false);
                      setShowMoreActions(false);
                    }}
                    className={`w-full text-right ltr:text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-xs flex items-center gap-2 ${
                      isZenMode ? 'text-green-400 font-semibold' : 'text-neutral-300'
                    }`}
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>{isRTL ? (isZenMode ? 'إيقاف وضع التركيز' : 'وضع التركيز الهادئ') : (isZenMode ? 'Exit Zen Mode' : 'Zen Focus Mode')}</span>
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={() => {
                      setIsFullscreen(!isFullscreen);
                      setShowMoreActions(false);
                    }}
                    className="w-full text-right ltr:text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 flex items-center gap-2"
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isRTL ? (isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة') : (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen')}</span>
                  </button>

                  {/* Lock/Unlock */}
                  <button
                    onClick={() => {
                      setShowLockModal(true);
                      setShowMoreActions(false);
                    }}
                    className={`w-full text-right ltr:text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-xs flex items-center gap-2 ${
                      note.is_encrypted ? 'text-amber-500 font-semibold' : 'text-neutral-300'
                    }`}
                  >
                    {note.is_encrypted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{isRTL ? (note.is_encrypted ? 'تعديل كلمة المرور' : 'قفل الملاحظة') : (note.is_encrypted ? 'Edit Password' : 'Lock Note')}</span>
                  </button>

                  {/* Pin/Unpin */}
                  <button
                    onClick={() => {
                      updateNote(note.id, { is_pinned: !note.is_pinned });
                      setShowMoreActions(false);
                    }}
                    className={`w-full text-right ltr:text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-xs flex items-center gap-2 ${
                      note.is_pinned ? 'text-primary-400 font-semibold' : 'text-neutral-300'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{isRTL ? (note.is_pinned ? 'إلغاء التثبيت' : 'تثبيت الملاحظة') : (note.is_pinned ? 'Unpin Note' : 'Pin Note')}</span>
                  </button>

                  <div className="h-px bg-neutral-800 my-1" />

                  {/* Export Options label */}
                  <div className="px-3 py-1 text-[10px] text-neutral-500 font-semibold">{isRTL ? 'تصدير وتحميل' : 'Export & Print'}</div>
                  
                  <button
                    onClick={() => {
                      handleExportTxt();
                      setShowMoreActions(false);
                    }}
                    className="w-full text-right ltr:text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'تحميل كملف نصي TXT' : 'Export as TXT'}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleExportHtml();
                      setShowMoreActions(false);
                    }}
                    className="w-full text-right ltr:text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'تحميل كملف HTML' : 'Export as HTML'}</span>
                  </button>

                  <button
                    onClick={() => {
                      handlePrint();
                      setShowMoreActions(false);
                    }}
                    className="w-full text-right ltr:text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 flex items-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'طباعة الملاحظة' : 'Print Note'}</span>
                  </button>

                  <div className="h-px bg-neutral-800 my-1" />

                  {/* Delete */}
                  <button
                    onClick={() => {
                      handleDeleteNote();
                      setShowMoreActions(false);
                    }}
                    className="w-full text-right ltr:text-left px-3 py-2 hover:bg-red-950/30 text-red-400 hover:text-red-300 rounded-lg text-xs flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {isRTL
                        ? (note.folder_id ? 'إزالة من المجلد' : 'حذف الملاحظة')
                        : (note.folder_id ? 'Remove from Folder' : 'Delete Note')}
                    </span>
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Unified Mobile-Friendly Toolbar (Desktop Mode) */}
      <div className={`hidden md:flex items-center gap-1.5 px-3 py-2 border-b border-neutral-800/40 flex-shrink-0 bg-neutral-900/40 select-none md:flex-wrap md:overflow-visible ${(showFontPicker || showSizePicker || showTextColor || showBgColor || showTablePicker) ? 'overflow-visible' : ''}`}>
        
        {/* Group 1: السجل (History) */}
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('undo'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'تراجع' : 'Undo'}><Undo className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('redo'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'إعادة' : 'Redo'}><Redo className="w-3.5 h-3.5" /></button>

        <div className="w-px h-5 bg-neutral-800 self-center mx-1 flex-shrink-0" />

        {/* Group 2: الخط (Font) */}
        {/* Font Family Dropdown */}
        <div className="relative flex-shrink-0 dropdown-group">
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              setShowFontPicker(!showFontPicker);
              setShowSizePicker(false);
              setShowTextColor(false);
              setShowBgColor(false);
              setShowTablePicker(false);
            }} 
            className="text-xs text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1 min-w-[90px] justify-between transition-colors"
          >
            <span className="truncate max-w-[70px]">{activeFont}</span>
            <span className="text-[8px] text-neutral-500">▼</span>
          </button>
          {showFontPicker && (
            <div className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2 min-w-[180px] max-h-64 overflow-y-auto custom-scrollbar animate-scale-in">
              {fonts.map((f) => (
                <button
                  key={f.value}
                  onMouseDown={(e) => { 
                    e.preventDefault(); 
                    execFormat('fontName', f.value); 
                    setShowFontPicker(false); 
                  }}
                  className="w-full text-right ltr:text-left px-3 py-1.5 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300"
                  style={{ fontFamily: f.value }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative flex-shrink-0 dropdown-group">
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              setShowSizePicker(!showSizePicker);
              setShowFontPicker(false);
              setShowTextColor(false);
              setShowBgColor(false);
              setShowTablePicker(false);
            }} 
            className="text-xs text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1 min-w-[65px] justify-between transition-colors"
          >
            <span>{activeSize}</span>
            <span className="text-[8px] text-neutral-500">▼</span>
          </button>
          {showSizePicker && (
            <div className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-3 min-w-[240px] animate-scale-in" onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName !== 'INPUT') {
                e.preventDefault();
              }
            }}>
              <p className="text-[10px] text-neutral-500 mb-2 px-1">{isRTL ? `حجم الخط: ${customFontSize}px` : `Font Size: ${customFontSize}px`}</p>
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="range" 
                  min="6" max="200" 
                  value={customFontSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomFontSize(val);
                    handleCustomFontSize(val);
                  }}
                  className="flex-1 accent-primary-500 cursor-pointer"
                />
                <input 
                  type="number" 
                  min="6" max="200" 
                  value={customFontSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomFontSize(val);
                    handleCustomFontSize(val);
                  }}
                  className="w-14 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-300 outline-none focus:border-primary-500 text-center"
                />
                <span className="text-xs text-neutral-500">px</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-neutral-800/60">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.value}
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      execFormat('fontSize', fs.value); 
                      setShowSizePicker(false); 
                    }}
                    className="w-full text-center px-1 py-1 hover:bg-neutral-800 rounded text-[10px] text-neutral-400"
                  >
                    {fs.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-neutral-800 self-center mx-1 flex-shrink-0" />

        {/* Group 3: التنسيق (Formatting) */}
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'عريض' : 'Bold'}><Bold className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'مائل' : 'Italic'}><Italic className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'تسطير' : 'Underline'}><Underline className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('strikeThrough'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'شطب' : 'Strikethrough'}><Strikethrough className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('subscript'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'سفلي' : 'Subscript'}><Subscript className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('superscript'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'علوي' : 'Superscript'}><Superscript className="w-3.5 h-3.5" /></button>

        {/* Text color picker */}
        <div className="relative flex-shrink-0 dropdown-group">
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              setShowTextColor(!showTextColor);
              setShowBgColor(false);
              setShowFontPicker(false);
              setShowSizePicker(false);
              setShowTablePicker(false);
            }} 
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5 transition-colors" 
            title={isRTL ? 'لون النص' : 'Text Color'}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          </button>
          {showTextColor && (
            <div className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-3 w-[260px] animate-scale-in flex flex-col gap-3">
              <div className="grid grid-cols-8 gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      execFormat('foreColor', c.value); 
                      setShowTextColor(false); 
                    }}
                    className="w-7 h-7 rounded-lg border border-neutral-800 hover:scale-110 hover:border-white/40 transition-all shadow-md"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800/60">
                <label className="text-[10px] text-neutral-500 px-1">{isRTL ? 'لون مخصص (عجلة الألوان)' : 'Custom Color Wheel'}</label>
                <div className="relative w-full h-8 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors">
                  <input
                    type="color"
                    value={customTextColor}
                    onChange={(e) => {
                      setCustomTextColor(e.target.value);
                      execFormat('foreColor', e.target.value);
                    }}
                    className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Highlight (background color) */}
        <div className="relative flex-shrink-0 dropdown-group">
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              setShowBgColor(!showBgColor);
              setShowTextColor(false);
              setShowFontPicker(false);
              setShowSizePicker(false);
              setShowTablePicker(false);
            }} 
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5 transition-colors" 
            title={isRTL ? 'لون التظليل' : 'Highlight Color'}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          </button>
          {showBgColor && (
            <div className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-3 w-[260px] animate-scale-in flex flex-col gap-3">
              <div className="grid grid-cols-8 gap-1.5">
                {bgColors.map((c) => (
                  <button
                    key={c.value}
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      execFormat('hiliteColor', c.value); 
                      setShowBgColor(false); 
                    }}
                    className="w-7 h-7 rounded-lg border border-neutral-700 hover:scale-110 hover:border-white/40 transition-all flex items-center justify-center text-[9px] font-bold text-neutral-300 shadow-md"
                    style={{ backgroundColor: c.value === 'transparent' ? '#27272a' : c.value }}
                    title={c.name}
                  >
                    {c.value === 'transparent' && '✕'}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800/60">
                <label className="text-[10px] text-neutral-500 px-1">{isRTL ? 'لون مخصص (عجلة الألوان)' : 'Custom Color Wheel'}</label>
                <div className="relative w-full h-8 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      execFormat('hiliteColor', e.target.value);
                    }}
                    className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button onMouseDown={(e) => { e.preventDefault(); execFormat('removeFormat'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition-colors flex-shrink-0" title={isRTL ? 'مسح التنسيق' : 'Clear Formatting'}><Trash2 className="w-3.5 h-3.5 text-neutral-600" /></button>

        <div className="w-px h-5 bg-neutral-800 self-center mx-1 flex-shrink-0" />

        {/* Group 4: الفقرة والهيكل (Paragraph & Structure) */}
        {/* Alignment */}
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyLeft'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'محاذاة لليسار' : 'Align Left'}><AlignLeft className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyCenter'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'توسيط' : 'Center'}><AlignCenter className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyRight'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'محاذاة لليمين' : 'Align Right'}><AlignRight className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyFull'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'ضبط الهوامش' : 'Justify'}><AlignJustify className="w-3.5 h-3.5" /></button>

        <div className="w-px h-3 bg-neutral-800 self-center mx-1 flex-shrink-0" />

        {/* Text Direction */}
        <button
          onClick={() => { if(editorRef.current) { editorRef.current.dir = 'ltr'; editorRef.current.style.direction = 'ltr'; handleContentInput(); }}}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 text-[10px] font-bold transition-colors flex-shrink-0"
          title={isRTL ? 'اتجاه النص من اليسار (LTR)' : 'Left to Right (LTR)'}
        >
          <span className="flex items-center gap-0.5"><PanelLeft className="w-3 h-3" /><span className="text-[8px]">LTR</span></span>
        </button>
        <button
          onClick={() => { if(editorRef.current) { editorRef.current.dir = 'rtl'; editorRef.current.style.direction = 'rtl'; handleContentInput(); }}}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 text-[10px] font-bold transition-colors flex-shrink-0"
          title={isRTL ? 'اتجاه النص من اليمين (RTL)' : 'Right to Left (RTL)'}
        >
          <span className="flex items-center gap-0.5"><span className="text-[8px]">RTL</span><PanelRight className="w-3 h-3" /></span>
        </button>

        <div className="w-px h-3 bg-neutral-800 self-center mx-1 flex-shrink-0" />

        {/* Structure blocks */}
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'h1'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'h2'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertUnorderedList'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'قائمة نقطية' : 'Bullet List'}><List className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertOrderedList'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'قائمة مرقمة' : 'Numbered List'}><ListOrdered className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertHTML', '<ul><li><input type="checkbox" /> </li></ul>'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'قائمة مهام' : 'Checklist'}><CheckSquare className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'blockquote'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'اقتباس' : 'Blockquote'}><Quote className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'pre'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'كود برمجى' : 'Code Block'}><Code className="w-3.5 h-3.5" /></button>
        <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertHorizontalRule'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'خط فاصل' : 'Divider'}><Minus className="w-3.5 h-3.5" /></button>

        <div className="w-px h-5 bg-neutral-800 self-center mx-1 flex-shrink-0" />

        {/* Group 5: إدراج (Insert) */}
        {/* Table builder */}
        <div className="relative flex-shrink-0 dropdown-group">
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              setShowTablePicker(!showTablePicker);
              setShowFontPicker(false);
              setShowSizePicker(false);
              setShowTextColor(false);
              setShowBgColor(false);
            }} 
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" 
            title={isRTL ? 'جدول' : 'Table'}
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          {showTablePicker && (
            <div 
              className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-4 min-w-[280px] animate-scale-in"
              onMouseLeave={() => { setHoverRow(-1); setHoverCol(-1); }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT') {
                  e.preventDefault();
                }
              }}
            >
              <p className="text-xs text-neutral-400 mb-2 font-medium">{isRTL ? 'إدراج جدول:' : 'Insert Table:'} {hoverRow >= 0 ? `${hoverRow + 1}x${hoverCol + 1}` : ''}</p>
              <div className="grid grid-cols-10 gap-1 mb-3">
                {Array.from({ length: 10 }).map((_, r) => (
                  <React.Fragment key={r}>
                    {Array.from({ length: 10 }).map((_, c) => {
                      const isActive = r <= hoverRow && c <= hoverCol;
                      return (
                        <div
                          key={c}
                          onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleInsertTable(r + 1, c + 1);
                          }}
                          className={`w-4 h-4 border rounded-[3px] cursor-pointer transition-colors ${
                            isActive 
                              ? 'bg-primary-500/40 border-primary-500' 
                              : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                          }`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-neutral-800/60 pt-2.5 gap-2">
                <div className="flex gap-1.5 items-center">
                  <input type="number" min="1" max="100" value={tableRowsInput} onChange={e => setTableRowsInput(e.target.value)} className="w-12 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-xs text-neutral-300 outline-none focus:border-primary-500" placeholder={isRTL ? 'صفوف' : 'Rows'} />
                  <span className="text-neutral-500 text-xs">x</span>
                  <input type="number" min="1" max="100" value={tableColsInput} onChange={e => setTableColsInput(e.target.value)} className="w-12 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-xs text-neutral-300 outline-none focus:border-primary-500" placeholder={isRTL ? 'أعمدة' : 'Cols'} />
                </div>
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleInsertTable(parseInt(tableRowsInput) || 3, parseInt(tableColsInput) || 3); }}
                  className="px-3 py-1.5 text-center bg-primary-600 hover:bg-primary-500 text-[10px] rounded-lg text-white font-medium transition-all"
                >
                  {isRTL ? 'إدراج' : 'Insert'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hyperlink */}
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt(isRTL ? 'أدخل رابط URL:' : 'Enter URL:');
            if (url) execFormat('createLink', url);
          }}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0"
          title={isRTL ? 'رابط متشعب' : 'Insert Link'}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* Media Inserts */}
        <button onClick={() => imageInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'إدراج صورة' : 'Insert Image'}><ImageIcon className="w-3.5 h-3.5 text-pink-400" /></button>
        <button onClick={() => videoInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'إدراج فيديو' : 'Insert Video'}><Video className="w-3.5 h-3.5 text-red-400" /></button>
        <button onClick={() => audioInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'إدراج ملف صوتي' : 'Insert Audio'}><Volume2 className="w-3.5 h-3.5 text-green-400" /></button>
        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0" title={isRTL ? 'إرفاق ملف / PDF' : 'Attach File / PDF'}><FileUp className="w-3.5 h-3.5 text-orange-400" /></button>

        {/* Voice Recorder */}
        {isRecording ? (
          <button
            onClick={handleStopRecording}
            className="flex items-center gap-1 px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded-lg text-[10px] font-semibold text-white animate-pulse flex-shrink-0"
            title={isRTL ? 'إيقاف التسجيل' : 'Stop Recording'}
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>{formatDuration(recordingTime)}</span>
          </button>
        ) : (
          <button
            onClick={handleStartRecording}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors flex-shrink-0"
            title={isRTL ? 'سجل صوتك' : 'Record Audio'}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-450" />
          </button>
        )}

        {/* Drawing Canvas */}
        <button
          onClick={() => setShowDrawing(true)}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-purple-400/80 hover:text-purple-400 transition-colors flex-shrink-0"
          title={isRTL ? 'لوحة الرسم الحر' : 'Free Drawing Canvas'}
        >
          <Pen className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-neutral-800 self-center mx-1 flex-shrink-0" />

        {/* Group 6: أدوات ذكية (Tools) */}
        {/* Formula Calculator */}
        <button
          onClick={() => { setShowFormula(!showFormula); setFormulaInput('='); setFormulaResult(''); }}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            showFormula ? 'text-green-400 bg-green-500/10' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
          }`}
          title={isRTL ? 'آلة حاسبة بالدوال (Excel)' : 'Formula Calculator (Excel-like)'}
        >
          <Calculator className="w-3.5 h-3.5" />
        </button>

        {/* AI Prompt Templates */}
        <button
          onClick={() => setShowTemplates(true)}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-purple-500/70 hover:text-purple-400 transition-colors flex-shrink-0"
          title={isRTL ? 'قوالب الذكاء الاصطناعي' : 'AI Prompt Templates'}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
        </button>

        {/* Search tool */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${showSearch ? 'text-primary-455 bg-primary-600/10' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'}`}
          title={isRTL ? 'بحث واستبدال الكلمات' : 'Search & Replace'}
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grouped Mobile Toolbar (Visible only on mobile) */}
      <div className="md:hidden flex flex-col border-b border-neutral-800/40 bg-neutral-900/40 select-none flex-shrink-0 dropdown-group">
        {/* Mobile Sub-Toolbar */}
        {activeCategory && (
          <div className="px-3 py-2 border-b border-neutral-800/30 bg-neutral-950/85 backdrop-blur-md animate-scale-in">
            {activeCategory === 'text' && (
              <div className="flex flex-col gap-2">
                {/* Row 1: Font and Size Pickers */}
                <div className="flex items-center gap-2">
                  {/* Font Family Dropdown */}
                  <div className="relative dropdown-group flex-1">
                    <button 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowFontPicker(!showFontPicker);
                        setShowSizePicker(false);
                        setShowTextColor(false);
                        setShowBgColor(false);
                        setShowTablePicker(false);
                      }} 
                      className="w-full text-xs text-neutral-300 hover:text-neutral-100 bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors"
                    >
                      <span className="truncate max-w-[120px]">{activeFont}</span>
                      <span className="text-[8px] text-neutral-500">▼</span>
                    </button>
                    {showFontPicker && (
                      <div className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2 min-w-[180px] max-h-48 overflow-y-auto custom-scrollbar animate-scale-in">
                        {fonts.map((f) => (
                          <button
                            key={f.value}
                            onMouseDown={(e) => { 
                              e.preventDefault(); 
                              execFormat('fontName', f.value); 
                              setShowFontPicker(false); 
                            }}
                            className="w-full text-right ltr:text-left px-3 py-1.5 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300"
                            style={{ fontFamily: f.value }}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Font Size Dropdown */}
                  <div className="relative dropdown-group flex-1">
                    <button 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowSizePicker(!showSizePicker);
                        setShowFontPicker(false);
                        setShowTextColor(false);
                        setShowBgColor(false);
                        setShowTablePicker(false);
                      }} 
                      className="w-full text-xs text-neutral-300 hover:text-neutral-100 bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors"
                    >
                      <span>{activeSize}</span>
                      <span className="text-[8px] text-neutral-500">▼</span>
                    </button>
                    {showSizePicker && (
                      <div className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-3 min-w-[220px] animate-scale-in" onMouseDown={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.tagName !== 'INPUT') {
                          e.preventDefault();
                        }
                      }}>
                        <p className="text-[10px] text-neutral-500 mb-2 px-1">{isRTL ? `حجم الخط: ${customFontSize}px` : `Font Size: ${customFontSize}px`}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="range" 
                            min="6" max="100" 
                            value={customFontSize}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomFontSize(val);
                              handleCustomFontSize(val);
                            }}
                            className="flex-1 accent-primary-500 cursor-pointer"
                          />
                          <input 
                            type="number" 
                            min="6" max="100" 
                            value={customFontSize}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomFontSize(val);
                              handleCustomFontSize(val);
                            }}
                            className="w-12 bg-neutral-900 border border-neutral-800 rounded-md px-1.5 py-0.5 text-xs text-neutral-305 text-center font-semibold"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-neutral-850">
                          {fontSizes.map((fs) => (
                            <button
                              key={fs.value}
                              onMouseDown={(e) => { 
                                e.preventDefault(); 
                                execFormat('fontSize', fs.value); 
                                setShowSizePicker(false); 
                              }}
                              className="w-full text-center py-1 hover:bg-neutral-800 rounded text-[10px] text-neutral-400"
                            >
                              {fs.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Formatting Buttons */}
                <div className="flex items-center justify-between bg-neutral-950/40 border border-neutral-800/60 px-2 py-1 rounded-xl">
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'عريض' : 'Bold'}><Bold className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'مائل' : 'Italic'}><Italic className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'تسطير' : 'Underline'}><Underline className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('strikeThrough'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'شطب' : 'Strikethrough'}><Strikethrough className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('subscript'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'سفلي' : 'Subscript'}><Subscript className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('superscript'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'علوي' : 'Superscript'}><Superscript className="w-3.5 h-3.5" /></button>
                  
                  {/* Text Color Picker */}
                  <div className="relative dropdown-group">
                    <button 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowTextColor(!showTextColor);
                        setShowBgColor(false);
                        setShowFontPicker(false);
                        setShowSizePicker(false);
                        setShowTablePicker(false);
                      }} 
                      className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5 transition-colors" 
                      title={isRTL ? 'لون النص' : 'Text Color'}
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    {showTextColor && (
                      <div className="absolute top-full mt-2 end-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2.5 w-[220px] animate-scale-in flex flex-col gap-2">
                        <div className="grid grid-cols-6 gap-1">
                          {colors.slice(0, 18).map((c) => (
                            <button
                              key={c.value}
                              onMouseDown={(e) => { 
                                e.preventDefault(); 
                                execFormat('foreColor', c.value); 
                                setShowTextColor(false); 
                              }}
                              className="w-6 h-6 rounded-md border border-neutral-800 hover:scale-110 transition-transform shadow-md"
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                            />
                          ))}
                        </div>
                        <div className="flex flex-col gap-1 pt-1.5 border-t border-neutral-800/60">
                          <label className="text-[9px] text-neutral-500 px-1">{isRTL ? 'لون مخصص' : 'Custom'}</label>
                          <input
                            type="color"
                            value={customTextColor}
                            onChange={(e) => {
                              setCustomTextColor(e.target.value);
                              execFormat('foreColor', e.target.value);
                            }}
                            className="w-full h-6 cursor-pointer bg-transparent border-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Highlight Color Picker */}
                  <div className="relative dropdown-group">
                    <button 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowBgColor(!showBgColor);
                        setShowTextColor(false);
                        setShowFontPicker(false);
                        setShowSizePicker(false);
                        setShowTablePicker(false);
                      }} 
                      className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 flex items-center gap-0.5 transition-colors" 
                      title={isRTL ? 'لون التظليل' : 'Highlight Color'}
                    >
                      <Highlighter className="w-3.5 h-3.5" />
                    </button>
                    {showBgColor && (
                      <div className="absolute top-full mt-2 end-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2.5 w-[220px] animate-scale-in flex flex-col gap-2">
                        <div className="grid grid-cols-6 gap-1">
                          {bgColors.slice(0, 12).map((c) => (
                            <button
                              key={c.value}
                              onMouseDown={(e) => { 
                                e.preventDefault(); 
                                execFormat('hiliteColor', c.value); 
                                setShowBgColor(false); 
                              }}
                              className="w-6 h-6 rounded-md border border-neutral-800 hover:scale-110 transition-transform flex items-center justify-center text-[9px] font-bold text-neutral-300 shadow-md"
                              style={{ backgroundColor: c.value === 'transparent' ? '#27272a' : c.value }}
                              title={c.name}
                            >
                              {c.value === 'transparent' && '✕'}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1 pt-1.5 border-t border-neutral-800/60">
                          <label className="text-[9px] text-neutral-500 px-1">{isRTL ? 'تظليل مخصص' : 'Custom'}</label>
                          <input
                            type="color"
                            value={customBgColor}
                            onChange={(e) => {
                              setCustomBgColor(e.target.value);
                              execFormat('hiliteColor', e.target.value);
                            }}
                            className="w-full h-6 cursor-pointer bg-transparent border-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('removeFormat'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-red-400 transition-colors" title={isRTL ? 'مسح التنسيق' : 'Clear Formatting'}><Trash2 className="w-3.5 h-3.5 text-neutral-650" /></button>
                </div>
              </div>
            )}

            {activeCategory === 'paragraph' && (
              <div className="flex flex-col gap-2">
                {/* Row 1: Alignment and Directions */}
                <div className="flex justify-around bg-neutral-950/40 border border-neutral-800/60 p-1 rounded-xl">
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyLeft'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'محاذاة لليسار' : 'Align Left'}><AlignLeft className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyCenter'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'توسيط' : 'Center'}><AlignCenter className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyRight'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'محاذاة لليمين' : 'Align Right'}><AlignRight className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('justifyFull'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'ضبط الهوامش' : 'Justify'}><AlignJustify className="w-3.5 h-3.5" /></button>
                  
                  <div className="w-px h-5 bg-neutral-800 self-center mx-1" />
                  
                  <button onClick={() => { if(editorRef.current) { editorRef.current.dir = 'ltr'; editorRef.current.style.direction = 'ltr'; handleContentInput(); }}} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-405 hover:text-neutral-200 transition-colors" title="LTR"><PanelLeft className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if(editorRef.current) { editorRef.current.dir = 'rtl'; editorRef.current.style.direction = 'rtl'; handleContentInput(); }}} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-405 hover:text-neutral-200 transition-colors" title="RTL"><PanelRight className="w-3.5 h-3.5" /></button>
                </div>

                {/* Row 2: Headings and lists */}
                <div className="flex justify-between bg-neutral-950/40 border border-neutral-800/60 p-1 rounded-xl flex-wrap gap-1">
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'h1'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'h2'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertUnorderedList'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'قائمة نقطية' : 'Bullet List'}><List className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertOrderedList'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'قائمة مرقمة' : 'Numbered List'}><ListOrdered className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertHTML', '<ul><li><input type="checkbox" /> </li></ul>'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'قائمة مهام' : 'Checklist'}><CheckSquare className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'blockquote'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'اقتباس' : 'Blockquote'}><Quote className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'pre'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'كود برمجى' : 'Code Block'}><Code className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertHorizontalRule'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'خط فاصل' : 'Divider'}><Minus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}

            {activeCategory === 'insert' && (
              <div className="flex items-center justify-around bg-neutral-950/40 border border-neutral-800/60 p-1 rounded-xl">
                {/* Table builder */}
                <div className="relative dropdown-group">
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowTablePicker(!showTablePicker);
                      setShowFontPicker(false);
                      setShowSizePicker(false);
                      setShowTextColor(false);
                      setShowBgColor(false);
                    }} 
                    className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" 
                    title={isRTL ? 'جدول' : 'Table'}
                  >
                    <Table className="w-3.5 h-3.5" />
                  </button>
                  {showTablePicker && (
                    <div 
                      className="absolute top-full mt-2 start-0 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-3 min-w-[200px] animate-scale-in"
                      onMouseLeave={() => { setHoverRow(-1); setHoverCol(-1); }}
                      onMouseDown={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.tagName !== 'INPUT') {
                          e.preventDefault();
                        }
                      }}
                    >
                      <p className="text-xs text-neutral-400 mb-1.5 font-medium">{isRTL ? 'إدراج جدول:' : 'Insert Table:'} {hoverRow >= 0 ? `${hoverRow + 1}x${hoverCol + 1}` : ''}</p>
                      <div className="grid grid-cols-5 gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, r) => (
                          <React.Fragment key={r}>
                            {Array.from({ length: 5 }).map((_, c) => {
                              const isActive = r <= hoverRow && c <= hoverCol;
                              return (
                                <div
                                  key={c}
                                  onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleInsertTable(r + 1, c + 1);
                                  }}
                                  className={`w-3.5 h-3.5 border rounded-[2px] cursor-pointer transition-colors ${
                                    isActive 
                                      ? 'bg-primary-500/40 border-primary-500' 
                                      : 'bg-neutral-800 border-neutral-700'
                                  }`}
                                />
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-neutral-800/60 pt-2 gap-1">
                        <div className="flex gap-1 items-center">
                          <input type="number" min="1" max="15" value={tableRowsInput} onChange={e => setTableRowsInput(e.target.value)} className="w-8 bg-neutral-900 border border-neutral-800 rounded text-center text-[10px] text-neutral-350 outline-none" />
                          <span className="text-neutral-500 text-[10px]">x</span>
                          <input type="number" min="1" max="15" value={tableColsInput} onChange={e => setTableColsInput(e.target.value)} className="w-8 bg-neutral-900 border border-neutral-800 rounded text-center text-[10px] text-neutral-350 outline-none" />
                        </div>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); handleInsertTable(parseInt(tableRowsInput) || 3, parseInt(tableColsInput) || 3); }}
                          className="px-2 py-1 bg-primary-600 text-[9px] rounded text-white font-medium"
                        >
                          {isRTL ? 'إدراج' : 'Insert'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hyperlink */}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const url = prompt(isRTL ? 'أدخل رابط URL:' : 'Enter URL:');
                    if (url) execFormat('createLink', url);
                  }}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
                  title={isRTL ? 'رابط متشعب' : 'Insert Link'}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => imageInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200" title={isRTL ? 'إدراج صورة' : 'Insert Image'}><ImageIcon className="w-3.5 h-3.5 text-pink-400" /></button>
                <button onClick={() => videoInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200" title={isRTL ? 'إدراج فيديو' : 'Insert Video'}><Video className="w-3.5 h-3.5 text-red-400" /></button>
                <button onClick={() => audioInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200" title={isRTL ? 'إدراج ملف صوتي' : 'Insert Audio'}><Volume2 className="w-3.5 h-3.5 text-green-400" /></button>
                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200" title={isRTL ? 'إرفاق ملف / PDF' : 'Attach File / PDF'}><FileUp className="w-3.5 h-3.5 text-orange-400" /></button>

                {/* Recording */}
                {isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-1 px-2 py-0.5 bg-red-600 hover:bg-red-500 rounded-lg text-[9px] font-semibold text-white animate-pulse"
                  >
                    <Square className="w-2 h-2 fill-current" />
                    <span>{formatDuration(recordingTime)}</span>
                  </button>
                ) : (
                  <button onClick={handleStartRecording} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200" title={isRTL ? 'سجل صوتك' : 'Record Audio'}><Mic className="w-3.5 h-3.5 text-emerald-400" /></button>
                )}

                {/* Drawing */}
                <button onClick={() => setShowDrawing(true)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-purple-400/80 hover:text-purple-400" title={isRTL ? 'لوحة الرسم الحر' : 'Free Drawing Canvas'}><Pen className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {activeCategory === 'tools' && (
              <div className="flex items-center justify-around bg-neutral-950/40 border border-neutral-800/60 p-1 rounded-xl">
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('undo'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'تراجع' : 'Undo'}><Undo className="w-3.5 h-3.5" /></button>
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('redo'); }} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" title={isRTL ? 'إعادة' : 'Redo'}><Redo className="w-3.5 h-3.5" /></button>
                
                <div className="w-px h-5 bg-neutral-800 self-center mx-1" />

                {/* Calculator */}
                <button
                  onClick={() => { setShowFormula(!showFormula); setFormulaInput('='); setFormulaResult(''); }}
                  className={`p-1.5 rounded-lg transition-colors ${showFormula ? 'text-green-400 bg-green-500/10' : 'text-neutral-400 hover:bg-neutral-800'}`}
                  title={isRTL ? 'آلة حاسبة بالدوال (Excel)' : 'Formula Calculator'}
                >
                  <Calculator className="w-3.5 h-3.5" />
                </button>

                {/* AI Prompt Templates */}
                <button onClick={() => setShowTemplates(true)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-purple-500/70 hover:text-purple-400 transition-colors" title={isRTL ? 'قوالب الذكاء الاصطناعي' : 'AI Prompt Templates'}><LayoutTemplate className="w-3.5 h-3.5" /></button>

                {/* Search & Replace */}
                <button onClick={() => setShowSearch(!showSearch)} className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'text-primary-400 bg-primary-600/10' : 'text-neutral-400 hover:bg-neutral-800'}`} title={isRTL ? 'بحث واستبدال الكلمات' : 'Search & Replace'}><Search className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Toolbar Category Buttons */}
        <div className="flex items-center justify-around py-1.5 bg-neutral-900 border-t border-neutral-850/60">
          <button
            onClick={() => {
              closeAllDropdowns();
              setActiveCategory(activeCategory === 'text' ? null : 'text');
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
              activeCategory === 'text' ? 'text-primary-400 bg-neutral-850/60' : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            <Bold className="w-4 h-4" />
            <span className="text-[9px] font-medium">{isRTL ? 'تنسيق' : 'Format'}</span>
          </button>

          <button
            onClick={() => {
              closeAllDropdowns();
              setActiveCategory(activeCategory === 'paragraph' ? null : 'paragraph');
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
              activeCategory === 'paragraph' ? 'text-primary-400 bg-neutral-850/60' : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span className="text-[9px] font-medium">{isRTL ? 'الفقرة' : 'Paragraph'}</span>
          </button>

          <button
            onClick={() => {
              closeAllDropdowns();
              setActiveCategory(activeCategory === 'insert' ? null : 'insert');
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
              activeCategory === 'insert' ? 'text-primary-400 bg-neutral-850/60' : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-[9px] font-medium">{isRTL ? 'إدراج' : 'Insert'}</span>
          </button>

          <button
            onClick={() => {
              closeAllDropdowns();
              setActiveCategory(activeCategory === 'tools' ? null : 'tools');
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
              activeCategory === 'tools' ? 'text-primary-400 bg-neutral-850/60' : 'text-neutral-500 hover:text-neutral-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px] font-medium">{isRTL ? 'أدوات' : 'Tools'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Search & Replace Panel */}
      {showSearch && (
        <div className="px-4 py-3 bg-neutral-900/80 border-b border-neutral-800/40 flex flex-wrap items-center gap-3 animate-slide-down">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs text-neutral-500">{isRTL ? 'بحث عن:' : 'Find:'}</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'الكلمة المراد البحث عنها...' : 'Search term...'}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 placeholder-neutral-600 rounded-lg px-2.5 py-1.5 text-xs flex-1 focus:outline-none focus:border-neutral-700"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs text-neutral-500">{isRTL ? 'استبدال بـ:' : 'Replace:'}</span>
            <input
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder={isRTL ? 'الكلمة البديلة...' : 'Replacement...'}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 placeholder-neutral-600 rounded-lg px-2.5 py-1.5 text-xs flex-1 focus:outline-none focus:border-neutral-700"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleSearch} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors">{isRTL ? 'بحث عن التالي' : 'Find Next'}</button>
            <button onClick={handleReplace} className="px-3 py-1.5 bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 text-xs rounded-lg transition-colors">{isRTL ? 'استبدال' : 'Replace'}</button>
            <button onClick={handleReplaceAll} className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg transition-colors">{isRTL ? 'استبدال الكل' : 'Replace All'}</button>
            <button onClick={() => setShowSearch(false)} className="p-1 text-neutral-500 hover:text-neutral-300"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Formula Bar - Excel-like Calculator */}
      {showFormula && (
        <div className="flex-shrink-0 border-b border-neutral-800/40 bg-neutral-900/60 px-4 py-2.5 animate-slide-down">
          <div className="flex items-center gap-2 max-w-3xl">
            <div className="flex items-center gap-1.5 text-xs text-green-400 font-mono bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1 flex-shrink-0">
              <Calculator className="w-3 h-3" />
              <span>fx</span>
            </div>
            <input
              type="text"
              value={formulaInput}
              onChange={(e) => {
                setFormulaInput(e.target.value);
                if (isFormula(e.target.value)) {
                  const { result, error } = evaluateFormula(e.target.value);
                  setFormulaResult(error ? '❌ ' + result : '= ' + result);
                } else {
                  setFormulaResult('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const { result, error } = evaluateFormula(formulaInput);
                  if (!error && editorRef.current) {
                    editorRef.current.focus();
                    document.execCommand('insertText', false, result);
                    handleContentInput();
                    setFormulaInput('=');
                    setFormulaResult('');
                    toast.success(isRTL ? `✅ النتيجة: ${result}` : `✅ Result: ${result}`);
                  } else {
                    toast.error(isRTL ? 'صيغة غير صحيحة' : 'Invalid formula');
                  }
                }
              }}
              placeholder={isRTL ? '=SUM(10,20) أو =2*PI() أو =SQRT(144)...' : '=SUM(10,20) or =2+3*4 or =SQRT(144)...'}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-green-300 placeholder-neutral-600 font-mono outline-none focus:border-green-500/50"
              dir="ltr"
              autoFocus
            />
            {formulaResult && (
              <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border flex-shrink-0 ${
                formulaResult.startsWith('❌')
                  ? 'text-red-400 bg-red-500/10 border-red-500/20'
                  : 'text-green-400 bg-green-500/10 border-green-500/20'
              }`}>
                {formulaResult}
              </div>
            )}
            <button
              onClick={() => {
                const { result, error } = evaluateFormula(formulaInput);
                if (!error && editorRef.current) {
                  editorRef.current.focus();
                  document.execCommand('insertText', false, result);
                  handleContentInput();
                  toast.success(isRTL ? `✅ تم إدراج: ${result}` : `✅ Inserted: ${result}`);
                } else {
                  toast.error(isRTL ? 'صيغة غير صحيحة' : 'Invalid formula');
                }
              }}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg font-medium transition-colors flex-shrink-0"
            >
              {isRTL ? 'إدراج' : 'Insert'}
            </button>
            <button onClick={() => setShowFormula(false)} className="p-1 text-neutral-500 hover:text-neutral-300 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {['=SUM()', '=AVG()', '=MAX()', '=MIN()', '=ROUND(,2)', '=IF(,,)', '=SQRT()', '=ABS()', '=POW(,)', '=COUNT()', '=PRODUCT()'].map((fn) => (
              <button
                key={fn}
                onClick={() => setFormulaInput(fn.replace('()', '(') )}
                className="text-[10px] text-neutral-500 hover:text-green-400 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/40 rounded px-2 py-0.5 font-mono transition-colors"
              >
                {fn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Editing Area - flex row to allow sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 relative"
          onClick={handleEditorClick}
        >
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder={t('editor.title_placeholder', language)}
          className="w-full bg-transparent text-2xl font-bold text-neutral-100 placeholder-neutral-700 border-none outline-none mb-4 resize-none"
          dir={isRTL ? 'rtl' : 'ltr'}
        />

        {/* Active Tags list */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1"
                style={{ color: tag.color, borderColor: `${tag.color}40`, backgroundColor: `${tag.color}10` }}
              >
                {tag.name}
                <button onClick={() => handleTagToggle(tag)} className="hover:opacity-70 transition-opacity">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Content rich editor */}
        <div
          ref={editorRef}
          className="rich-editor text-neutral-200 text-sm leading-relaxed focus:outline-none min-h-[400px]"
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          onKeyDown={handleMarkdownShortcut}
          onKeyUp={updateActiveStyles}
          onMouseUp={updateActiveStyles}
          onFocus={updateActiveStyles}
          dir={isRTL ? 'rtl' : 'ltr'}
          data-placeholder={t('editor.placeholder', language)}
        />

        {/* Resizer Overlay */}
        {resizeRect && activeResizeElement && (
          <div
            className="absolute border border-dashed border-primary-500 pointer-events-none z-40"
            style={{
              top: `${resizeRect.top}px`,
              left: `${resizeRect.left}px`,
              width: `${resizeRect.width}px`,
              height: `${resizeRect.height}px`,
            }}
          >
            {/* Corner handles */}
            {['tl', 'tr', 'bl', 'br'].map((handle) => {
              let cursorClass = '';
              let posStyles: React.CSSProperties = {};
              if (handle === 'tl') {
                cursorClass = 'cursor-nwse-resize';
                posStyles = { top: '-5px', left: '-5px' };
              } else if (handle === 'tr') {
                cursorClass = 'cursor-nesw-resize';
                posStyles = { top: '-5px', right: '-5px' };
              } else if (handle === 'bl') {
                cursorClass = 'cursor-nesw-resize';
                posStyles = { bottom: '-5px', left: '-5px' };
              } else if (handle === 'br') {
                cursorClass = 'cursor-nwse-resize';
                posStyles = { bottom: '-5px', right: '-5px' };
              }
              return (
                <div
                  key={handle}
                  className={`absolute w-2.5 h-2.5 bg-primary-500 border border-white rounded-full pointer-events-auto ${cursorClass}`}
                  style={posStyles}
                  onMouseDown={(e) => handleResizeStart(e, handle)}
                />
              );
            })}

            {/* Actions Toolbar */}
            <div
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-lg shadow-xl pointer-events-auto z-50"
              onMouseDown={(e) => e.preventDefault()}
            >
              <button
                onClick={() => {
                  activeResizeElement.style.width = '25%';
                  activeResizeElement.style.height = 'auto';
                  setTimeout(updateResizeRect, 50);
                  handleContentInput();
                }}
                className="px-1.5 py-0.5 text-[10px] hover:bg-neutral-800 rounded font-medium text-neutral-300"
              >
                25%
              </button>
              <button
                onClick={() => {
                  activeResizeElement.style.width = '50%';
                  activeResizeElement.style.height = 'auto';
                  setTimeout(updateResizeRect, 50);
                  handleContentInput();
                }}
                className="px-1.5 py-0.5 text-[10px] hover:bg-neutral-800 rounded font-medium text-neutral-300"
              >
                50%
              </button>
              <button
                onClick={() => {
                  activeResizeElement.style.width = '100%';
                  activeResizeElement.style.height = 'auto';
                  setTimeout(updateResizeRect, 50);
                  handleContentInput();
                }}
                className="px-1.5 py-0.5 text-[10px] hover:bg-neutral-800 rounded font-medium text-neutral-300"
              >
                100%
              </button>

              <div className="w-px h-3.5 bg-neutral-800 mx-1" />

              <button
                onClick={() => {
                  activeResizeElement.style.display = 'block';
                  activeResizeElement.style.marginLeft = '0';
                  activeResizeElement.style.marginRight = 'auto';
                  setTimeout(updateResizeRect, 50);
                  handleContentInput();
                }}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200"
                title="Align Left"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  activeResizeElement.style.display = 'block';
                  activeResizeElement.style.marginLeft = 'auto';
                  activeResizeElement.style.marginRight = 'auto';
                  setTimeout(updateResizeRect, 50);
                  handleContentInput();
                }}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200"
                title="Center"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  activeResizeElement.style.display = 'block';
                  activeResizeElement.style.marginLeft = 'auto';
                  activeResizeElement.style.marginRight = '0';
                  setTimeout(updateResizeRect, 50);
                  handleContentInput();
                }}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200"
                title="Align Right"
              >
                <AlignRight className="w-3 h-3" />
              </button>

              <div className="w-px h-3.5 bg-neutral-800 mx-1" />

              <button
                onClick={() => {
                  activeResizeElement.remove();
                  setActiveResizeElement(null);
                  handleContentInput();
                }}
                className="p-1 hover:bg-neutral-800 hover:text-red-400 rounded text-neutral-500"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

        {/* Related Notes Sidebar */}
        <RelatedNotesSidebar
          currentNote={note}
          isOpen={showRelated}
          onClose={() => setShowRelated(false)}
          onOpenNote={(relatedNote) => {
            if (window.confirm(isRTL ? 'هل تريد فتح هذه الملاحظة؟' : 'Open this related note?')) {
              useNotesStore.getState().setSelectedNote(relatedNote);
            }
          }}
          language={language}
        />
      </div>

      {/* Editor Footer Statistics */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-t border-neutral-800/40 text-xs text-neutral-600 flex-shrink-0 bg-neutral-950">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{wordCount} {t('notes.words', language)}</span>
          <span>•</span>
          <span>{charCount} {isRTL ? 'حرف' : 'characters'}</span>
          <span>•</span>
          <span>{paragraphCount} {isRTL ? 'فقرة' : 'paragraphs'}</span>
          <span>•</span>
          <span>{sentenceCount} {isRTL ? 'جملة' : 'sentences'}</span>
        </div>
        <div className="flex items-center gap-3">
          {isZenMode && (
            <span className="flex items-center gap-1 text-green-600">
              <Wind className="w-3 h-3" />
              {isRTL ? 'وضع التركيز' : 'Zen Mode'}
            </span>
          )}
          <span>{new Date(note.updated_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* AI Prompt Templates Modal */}
      <AIPromptTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onUseTemplate={(prompt) => {
          if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, prompt + '\n');
            handleContentInput();
          }
          toast.success(isRTL ? 'تم إدراج القالب في المحرر' : 'Template inserted into editor');
        }}
        language={language}
      />

      {/* Free Drawing Canvas Modal */}
      <DrawingCanvas
        isOpen={showDrawing}
        onClose={() => setShowDrawing(false)}
        language={language}
        onInsert={(dataUrl) => {
          if (editorRef.current) {
            editorRef.current.focus();
            const img = `<img src="${dataUrl}" alt="drawing" style="max-width:100%;border-radius:8px;margin:8px 0;" />`;
            document.execCommand('insertHTML', false, img);
            handleContentInput();
            toast.success(isRTL ? '✅ تم إدراج الرسم في الملاحظة' : '✅ Drawing inserted into note');
          }
        }}
      />
      {/* Lock Note Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-400" />
              {isRTL ? 'قفل الملاحظة' : 'Lock Note'}
            </h3>
            <p className="text-sm text-neutral-400 mb-6">
              {isRTL ? 'أدخل كلمة مرور لقفل هذه الملاحظة، أو اترك الحقل فارغاً لإلغاء القفل.' : 'Enter a password to lock this note, or leave blank to unlock.'}
            </p>
            <form onSubmit={handleSetPassword}>
              <input
                type="password"
                placeholder={isRTL ? 'كلمة المرور...' : 'Password...'}
                value={notePassword}
                onChange={(e) => setNotePassword(e.target.value)}
                className="input-field mb-4 w-full"
                autoFocus
                dir="ltr"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowLockModal(false)}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn-primary py-2 px-6">
                  {isRTL ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

