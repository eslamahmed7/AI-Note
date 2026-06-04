import React, { useState } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Folder, Trash2, Plus, ArrowLeft, ArrowRight, Smile } from 'lucide-react';
import toast from 'react-hot-toast';

interface FoldersPageProps {
  onNavigate: (page: 'dashboard' | 'notes' | 'ai' | 'tasks' | 'settings' | 'vault' | 'search' | 'pinned' | 'archive' | 'trash' | 'folders' | 'tags') => void;
}

const presetColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1',
  '#F97316', '#22C55E', '#06B6D4', '#84CC16',
  '#D946EF', '#0EA5E9', '#F43F5E', '#A855F7',
];

// Folder icon set (emoji + symbol)
const FOLDER_ICONS = [
  '📁','📂','🗂️','📋','📌','📍','🗃️','🗄️',
  '💼','📚','📖','📝','✏️','🎯','🚀','⭐',
  '💡','🔥','🎨','🎵','🎮','🏆','💎','🌟',
  '🔐','🔑','📊','📈','💻','🌍','🏠','🏢',
  '📧','📞','🎬','📷','🎁','🌈','⚡','🧩',
  '🤖','🧠','💰','📱','🔬','🏋️','🎓','🌺',
];

export default function FoldersPage({ onNavigate }: FoldersPageProps) {
  const { language } = useSettingsStore();
  const { folders, notes, createFolder, deleteFolder, setActiveFolderId } = useNotesStore();
  
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(presetColors[0]);
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toast.error(isRTL ? 'الرجاء إدخال اسم المجلد' : 'Please enter folder name');
      return;
    }

    setSubmitting(true);
    try {
      const folderName = `${selectedIcon} ${newFolderName.trim()}`;
      const folder = await createFolder(folderName, null, selectedColor);
      if (folder) {
        toast.success(isRTL ? 'تم إنشاء المجلد بنجاح' : 'Folder created successfully');
        setNewFolderName('');
        setSelectedIcon('📁');
      } else {
        toast.error(isRTL ? 'فشل إنشاء المجلد' : 'Failed to create folder');
      }
    } catch (error) {
      console.error(error);
      toast.error(isRTL ? 'حدث خطأ ما' : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFolder = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      isRTL 
        ? `هل أنت متأكد من حذف مجلد "${name}"؟ هذا سيؤدي لنقل جميع ملاحظاته لخارج المجلد.` 
        : `Are you sure you want to delete "${name}"? Notes inside it will remain but won't belong to any folder.`
    );
    if (confirmed) {
      await deleteFolder(id);
      toast.success(isRTL ? 'تم حذف المجلد' : 'Folder deleted');
    }
  };

  const handleFolderClick = (id: string) => {
    setActiveFolderId(id);
    onNavigate('notes');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-neutral-800/60 flex-shrink-0">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500 hover:text-neutral-300"
        >
          <BackIcon className="w-4 h-4" />
        </button>
        <h1 className="font-semibold text-neutral-100 text-base">
          {isRTL ? 'إدارة المجلدات' : 'Manage Folders'}
        </h1>
        <span className="ms-auto text-xs text-neutral-600">{folders.length} {isRTL ? 'مجلد' : 'folders'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
        {/* Create Folder Form */}
        <div className="glass rounded-2xl p-5 border border-neutral-800/60">
          <h2 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-400" />
            {isRTL ? 'إنشاء مجلد جديد' : 'Create New Folder'}
          </h2>
          <form onSubmit={handleCreateFolder} className="space-y-4">
            {/* Icon + Name row */}
            <div className="flex items-center gap-3">
              {/* Icon picker button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-12 h-12 text-2xl bg-neutral-800/60 border border-neutral-700/40 hover:border-primary-500/40 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  title={isRTL ? 'اختر أيقونة' : 'Choose icon'}
                >
                  {selectedIcon}
                </button>
                {showIconPicker && (
                  <div className="absolute top-14 start-0 z-30 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-3 w-64 animate-scale-in">
                    <p className="text-[10px] text-neutral-500 mb-2 px-1">{isRTL ? 'اختر أيقونة:' : 'Choose an icon:'}</p>
                    <div className="grid grid-cols-8 gap-1">
                      {FOLDER_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => { setSelectedIcon(icon); setShowIconPicker(false); }}
                          className={`w-8 h-8 text-lg rounded-lg hover:bg-neutral-800 flex items-center justify-center transition-all hover:scale-110 ${selectedIcon === icon ? 'bg-primary-600/20 border border-primary-500/30' : ''}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder={isRTL ? 'اسم المجلد...' : 'Folder name...'}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="input-field py-2.5 text-sm flex-1"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 block">
                {isRTL ? 'اختر لون المجلد:' : 'Choose folder color:'}
              </label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                  title={isRTL ? 'لون مخصص' : 'Custom color'}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: selectedColor + '20', border: `1px solid ${selectedColor}40` }}
              >
                {selectedIcon}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">{newFolderName || (isRTL ? 'اسم المجلد' : 'Folder Name')}</p>
                <p className="text-[10px] text-neutral-500">{isRTL ? 'معاينة المجلد' : 'Folder preview'}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2 px-4 text-xs font-medium w-full sm:w-auto"
            >
              {submitting ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : (
                isRTL ? 'إنشاء المجلد' : 'Create Folder'
              )}
            </button>
          </form>
        </div>

        {/* Folders Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {isRTL ? 'المجلدات الحالية' : 'Current Folders'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.map((folder) => {
              const noteCount = notes.filter((n) => n.folder_id === folder.id && !n.is_deleted && !n.is_archived).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id)}
                  className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800/40 rounded-2xl hover:border-neutral-700/60 hover:bg-neutral-900 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: (folder.color || '#3b82f6') + '20', border: `1px solid ${folder.color || '#3b82f6'}40` }}
                    >
                      {folder.name.match(/^(\p{Emoji})/u)?.[1] || '📁'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-200 truncate">{folder.name.replace(/^(\p{Emoji}\s*)/u, '')}</h3>
                      <p className="text-[11px] text-neutral-500">
                        {noteCount} {isRTL ? 'ملاحظة' : 'notes'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteFolder(folder.id, folder.name, e)}
                    className="p-2 text-neutral-700 hover:text-red-400 hover:bg-neutral-800/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title={isRTL ? 'حذف المجلد' : 'Delete Folder'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            
            {folders.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">📁</div>
                <p className="text-sm text-neutral-600">{isRTL ? 'لا توجد مجلدات حالياً' : 'No folders found.'}</p>
                <p className="text-xs text-neutral-700 mt-1">{isRTL ? 'أنشئ مجلدك الأول أعلاه' : 'Create your first folder above'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
