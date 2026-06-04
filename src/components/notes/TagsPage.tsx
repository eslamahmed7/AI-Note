import React, { useState } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Tag as TagIcon, Trash2, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface TagsPageProps {
  onNavigate: (page: 'dashboard' | 'notes' | 'ai' | 'tasks' | 'settings' | 'vault' | 'search' | 'pinned' | 'archive' | 'trash' | 'folders' | 'tags') => void;
}

const presetColors = [
  '#10B981', '#3B82F6', '#EF4444', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1',
  '#F97316', '#22C55E', '#06B6D4', '#84CC16',
  '#D946EF', '#0EA5E9', '#F43F5E', '#A855F7',
];

// Tag icons (emoji)
const TAG_ICONS = [
  '🏷️','🔖','📌','⭐','💡','🔥','💎','🎯',
  '🚀','🎨','📊','💻','🎵','🎮','📚','🌍',
  '💼','🔑','🎁','🌈','⚡','🧩','🤖','🧠',
  '💰','📱','🔬','🏆','🌺','🎓','⚽','🎸',
  '🏠','🌙','☀️','❤️','🔔','📢','✅','🔗',
  '🛡️','⚙️','🗺️','🎪','🌊','🦋','🌸','🍀',
];

export default function TagsPage({ onNavigate }: TagsPageProps) {
  const { language } = useSettingsStore();
  const { tags, notes, createTag, deleteTag, setActiveTagId } = useNotesStore();
  
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(presetColors[0]);
  const [selectedIcon, setSelectedIcon] = useState('🏷️');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast.error(isRTL ? 'الرجاء إدخال اسم الوسم' : 'Please enter tag name');
      return;
    }

    setSubmitting(true);
    try {
      const tagName = `${selectedIcon} ${newTagName.trim()}`;
      const tag = await createTag(tagName, selectedColor);
      if (tag) {
        toast.success(isRTL ? 'تم إنشاء الوسم بنجاح' : 'Tag created successfully');
        setNewTagName('');
        setSelectedIcon('🏷️');
      } else {
        toast.error(isRTL ? 'فشل إنشاء الوسم' : 'Failed to create tag');
      }
    } catch (error) {
      console.error(error);
      toast.error(isRTL ? 'حدث خطأ ما' : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      isRTL 
        ? `هل أنت متأكد من حذف الوسم "${name}"؟` 
        : `Are you sure you want to delete the tag "${name}"?`
    );
    if (confirmed) {
      await deleteTag(id);
      toast.success(isRTL ? 'تم حذف الوسم' : 'Tag deleted');
    }
  };

  const handleTagClick = (id: string) => {
    setActiveTagId(id);
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
          {isRTL ? 'إدارة الوسوم' : 'Manage Tags'}
        </h1>
        <span className="ms-auto text-xs text-neutral-600">{tags.length} {isRTL ? 'وسم' : 'tags'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
        {/* Create Tag Form */}
        <div className="glass rounded-2xl p-5 border border-neutral-800/60">
          <h2 className="text-sm font-semibold text-neutral-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-400" />
            {isRTL ? 'إنشاء وسم جديد' : 'Create New Tag'}
          </h2>
          <form onSubmit={handleCreateTag} className="space-y-4">
            {/* Icon + Name */}
            <div className="flex items-center gap-3">
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
                      {TAG_ICONS.map((icon) => (
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
                placeholder={isRTL ? 'اسم الوسم...' : 'Tag name...'}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="input-field py-2.5 text-sm flex-1"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 block">
                {isRTL ? 'اختر لون الوسم:' : 'Choose tag color:'}
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
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{ color: selectedColor, borderColor: selectedColor + '40', backgroundColor: selectedColor + '15' }}
              >
                <span>{selectedIcon}</span>
                <span>{newTagName || (isRTL ? 'الوسم' : 'Tag')}</span>
              </span>
              <span className="text-[10px] text-neutral-600">{isRTL ? '← معاينة الوسم' : '← Tag preview'}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2 px-4 text-xs font-medium w-full sm:w-auto"
            >
              {submitting ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : (
                isRTL ? 'إنشاء الوسم' : 'Create Tag'
              )}
            </button>
          </form>
        </div>

        {/* Tags List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {isRTL ? 'الوسوم الحالية' : 'Current Tags'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tags.map((tag) => {
              const noteCount = notes.filter((n) => n.tags?.some((t) => t.id === tag.id) && !n.is_deleted && !n.is_archived).length;
              const tagIcon = tag.name.match(/^(\p{Emoji})/u)?.[1] || '🏷️';
              const tagNameClean = tag.name.replace(/^(\p{Emoji}\s*)/u, '');
              return (
                <div
                  key={tag.id}
                  onClick={() => handleTagClick(tag.id)}
                  className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800/40 rounded-2xl hover:border-neutral-700/60 hover:bg-neutral-900 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: (tag.color || '#10b981') + '20', border: `1px solid ${tag.color || '#10b981'}40` }}
                    >
                      {tagIcon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: tag.color }}>{tagNameClean}</h3>
                      <p className="text-[11px] text-neutral-500">
                        {noteCount} {isRTL ? 'ملاحظة' : 'notes'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTag(tag.id, tag.name, e)}
                    className="p-2 text-neutral-700 hover:text-red-400 hover:bg-neutral-800/40 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title={isRTL ? 'حذف الوسم' : 'Delete Tag'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            
            {tags.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">🏷️</div>
                <p className="text-sm text-neutral-600">{isRTL ? 'لا توجد وسوم حالياً' : 'No tags found.'}</p>
                <p className="text-xs text-neutral-700 mt-1">{isRTL ? 'أنشئ وسمك الأول أعلاه' : 'Create your first tag above'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
