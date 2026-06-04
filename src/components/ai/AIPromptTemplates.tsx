import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, Copy, Zap, Briefcase, Brain, Globe, BookOpen, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIPromptTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (prompt: string) => void;
  language: string;
}

interface Template {
  id: string;
  icon: string;
  label_ar: string;
  label_en: string;
  prompt_ar: string;
  prompt_en: string;
  tags_ar?: string[];
  tags_en?: string[];
}

interface Category {
  id: string;
  icon: React.ReactNode;
  label_ar: string;
  label_en: string;
  color: string;
  templates: Template[];
}

const categories: Category[] = [
  {
    id: 'writing',
    icon: <BookOpen className="w-4 h-4" />,
    label_ar: 'الكتابة والتحرير',
    label_en: 'Writing & Editing',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    templates: [
      {
        id: 'summarize',
        icon: '📋',
        label_ar: 'تلخيص النص',
        label_en: 'Summarize Text',
        prompt_ar: 'لخص الملاحظات التالية في نقاط واضحة ومختصرة:',
        prompt_en: 'Summarize the following notes in clear, concise bullet points:',
      },
      {
        id: 'expand',
        icon: '✨',
        label_ar: 'توسيع الأفكار',
        label_en: 'Expand Ideas',
        prompt_ar: 'وسّع على الأفكار التالية بتفاصيل وأمثلة أكثر:',
        prompt_en: 'Expand on the following ideas with more details and examples:',
      },
      {
        id: 'rewrite',
        icon: '🔄',
        label_ar: 'إعادة الصياغة',
        label_en: 'Rewrite / Paraphrase',
        prompt_ar: 'أعد صياغة النص التالي بأسلوب أكثر وضوحاً واحترافية:',
        prompt_en: 'Rewrite the following text in a clearer, more professional style:',
      },
      {
        id: 'eli5',
        icon: '🧒',
        label_ar: 'اشرح لطفل (ELI5)',
        label_en: 'Explain Like I\'m 5 (ELI5)',
        prompt_ar: 'اشرح المفهوم التالي بأسلوب بسيط جداً كأنك تشرح لطفل عمره 5 سنوات:',
        prompt_en: 'Explain the following concept in very simple terms as if explaining to a 5-year-old:',
      },
      {
        id: 'outline',
        icon: '📑',
        label_ar: 'إنشاء مخطط',
        label_en: 'Create Outline',
        prompt_ar: 'أنشئ مخططاً منظماً للموضوع التالي مع العناوين والعناوين الفرعية:',
        prompt_en: 'Create a structured outline for the following topic with headings and subheadings:',
      },
      {
        id: 'proofread',
        icon: '✅',
        label_ar: 'مراجعة لغوية',
        label_en: 'Proofread & Fix',
        prompt_ar: 'راجع النص التالي لغوياً وصحح الأخطاء الإملائية والنحوية:',
        prompt_en: 'Proofread the following text and correct any spelling or grammar errors:',
      },
    ],
  },
  {
    id: 'business',
    icon: <Briefcase className="w-4 h-4" />,
    label_ar: 'الأعمال والعمل',
    label_en: 'Business & Work',
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
    templates: [
      {
        id: 'action-items',
        icon: '✅',
        label_ar: 'استخراج المهام',
        label_en: 'Extract Action Items',
        prompt_ar: 'استخرج جميع المهام والإجراءات المطلوبة من الملاحظات التالية:',
        prompt_en: 'Extract all action items and tasks required from the following notes:',
      },
      {
        id: 'email-reply',
        icon: '📧',
        label_ar: 'كتابة رد إيميل',
        label_en: 'Draft Email Reply',
        prompt_ar: 'اكتب رداً احترافياً على الإيميل أو الرسالة التالية:',
        prompt_en: 'Draft a professional reply to the following email or message:',
      },
      {
        id: 'meeting-summary',
        icon: '🤝',
        label_ar: 'ملخص اجتماع',
        label_en: 'Meeting Summary',
        prompt_ar: 'اعمل ملخصاً منظماً لنقاط الاجتماع التالي مع القرارات والمهام:',
        prompt_en: 'Create a structured meeting summary with decisions and action items from:',
      },
      {
        id: 'project-brief',
        icon: '🚀',
        label_ar: 'موجز المشروع',
        label_en: 'Project Brief',
        prompt_ar: 'حول الأفكار التالية إلى موجز مشروع احترافي:',
        prompt_en: 'Convert the following ideas into a professional project brief:',
      },
      {
        id: 'contract-review',
        icon: '⚖️',
        label_ar: 'مراجعة عقد',
        label_en: 'Contract Review',
        prompt_ar: 'راجع النص القانوني التالي واستخرج النقاط المهمة والمخاطر المحتملة:',
        prompt_en: 'Review the following legal text and extract key points and potential risks:',
      },
      {
        id: 'linkedin-post',
        icon: '💼',
        label_ar: 'منشور لينكد إن',
        label_en: 'LinkedIn Post',
        prompt_ar: 'حول الأفكار التالية إلى منشور احترافي ومؤثر لـ LinkedIn:',
        prompt_en: 'Transform the following ideas into a professional, engaging LinkedIn post:',
      },
    ],
  },
  {
    id: 'ai',
    icon: <Brain className="w-4 h-4" />,
    label_ar: 'التحليل والذكاء',
    label_en: 'Analysis & Intelligence',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    templates: [
      {
        id: 'swot',
        icon: '📊',
        label_ar: 'تحليل SWOT',
        label_en: 'SWOT Analysis',
        prompt_ar: 'قم بتحليل SWOT (نقاط القوة، الضعف، الفرص، التهديدات) للموضوع التالي:',
        prompt_en: 'Perform a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for:',
      },
      {
        id: 'pros-cons',
        icon: '⚖️',
        label_ar: 'إيجابيات وسلبيات',
        label_en: 'Pros & Cons',
        prompt_ar: 'اعرض إيجابيات وسلبيات الموضوع التالي بشكل متوازن:',
        prompt_en: 'Present a balanced list of pros and cons for the following topic:',
      },
      {
        id: 'weekly-review',
        icon: '📅',
        label_ar: 'مراجعة أسبوعية',
        label_en: 'Weekly Review',
        prompt_ar: 'بناءً على ملاحظاتي، أجرِ مراجعة أسبوعية شاملة وحدد أهم الإنجازات والدروس المستفادة والخطوات التالية:',
        prompt_en: 'Based on my notes, perform a comprehensive weekly review identifying key accomplishments, lessons learned, and next steps:',
      },
      {
        id: 'brainstorm',
        icon: '💡',
        label_ar: 'عصف ذهني',
        label_en: 'Brainstorm Ideas',
        prompt_ar: 'قدم 10 أفكار إبداعية ومبتكرة حول الموضوع التالي:',
        prompt_en: 'Generate 10 creative and innovative ideas around the following topic:',
      },
    ],
  },
  {
    id: 'language',
    icon: <Globe className="w-4 h-4" />,
    label_ar: 'اللغة والترجمة',
    label_en: 'Language & Translation',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    templates: [
      {
        id: 'translate-ar',
        icon: '🌍',
        label_ar: 'ترجمة إلى العربية',
        label_en: 'Translate to Arabic',
        prompt_ar: 'ترجم النص التالي إلى اللغة العربية الفصحى مع الحفاظ على المعنى الأصلي:',
        prompt_en: 'Translate the following text to Modern Standard Arabic while preserving the original meaning:',
      },
      {
        id: 'translate-en',
        icon: '🇺🇸',
        label_ar: 'ترجمة إلى الإنجليزية',
        label_en: 'Translate to English',
        prompt_ar: 'ترجم النص التالي إلى الإنجليزية بشكل احترافي:',
        prompt_en: 'Translate the following text to professional English:',
      },
      {
        id: 'fix-grammar',
        icon: '🔤',
        label_ar: 'تصحيح النحو والإملاء',
        label_en: 'Fix Grammar & Spelling',
        prompt_ar: 'صحح الأخطاء النحوية والإملائية في النص التالي مع الإبقاء على أسلوب الكاتب:',
        prompt_en: 'Fix grammar and spelling errors in the following text while preserving the author\'s style:',
      },
      {
        id: 'formal',
        icon: '👔',
        label_ar: 'تحويل لأسلوب رسمي',
        label_en: 'Make Formal',
        prompt_ar: 'حول النص التالي إلى أسلوب رسمي واحترافي:',
        prompt_en: 'Transform the following text into a formal and professional style:',
      },
    ],
  },
  {
    id: 'social',
    icon: <MessageSquare className="w-4 h-4" />,
    label_ar: 'التواصل الاجتماعي',
    label_en: 'Social Media',
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    templates: [
      {
        id: 'twitter',
        icon: '🐦',
        label_ar: 'تغريدة تويتر/X',
        label_en: 'Twitter/X Thread',
        prompt_ar: 'حول الأفكار التالية إلى خيط تغريدات جذاب (thread) مع هاشتاقات:',
        prompt_en: 'Convert the following ideas into an engaging Twitter/X thread with hashtags:',
      },
      {
        id: 'instagram',
        icon: '📸',
        label_ar: 'وصف انستجرام',
        label_en: 'Instagram Caption',
        prompt_ar: 'اكتب وصفاً جذاباً لانستجرام مع الإيموجي والهاشتاقات المناسبة للمحتوى التالي:',
        prompt_en: 'Write an engaging Instagram caption with emojis and relevant hashtags for:',
      },
      {
        id: 'blog-post',
        icon: '✍️',
        label_ar: 'مقال مدونة',
        label_en: 'Blog Post',
        prompt_ar: 'اكتب مقال مدونة شاملاً وجذاباً بناءً على الأفكار التالية:',
        prompt_en: 'Write a comprehensive and engaging blog post based on the following ideas:',
      },
    ],
  },
];

export default function AIPromptTemplates({ isOpen, onClose, onUseTemplate, language }: AIPromptTemplatesProps) {
  const isRTL = language === 'ar';
  const [activeCategory, setActiveCategory] = useState('writing');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeGroup = categories.find((c) => c.id === activeCategory);

  const handleUse = (template: Template) => {
    const prompt = isRTL ? template.prompt_ar : template.prompt_en;
    onUseTemplate(prompt);
    toast.success(isRTL ? 'تم نسخ القالب!' : 'Template applied!');
    onClose();
  };

  const handleCopy = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = isRTL ? template.prompt_ar : template.prompt_en;
    navigator.clipboard.writeText(prompt);
    toast.success(isRTL ? 'تم النسخ' : 'Copied!');
  };

  return (
    <div
      className="fixed inset-0 z-[998] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-neutral-900/98 backdrop-blur-2xl border border-neutral-700/60 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.7)] overflow-hidden animate-scale-in"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600/30 to-primary-600/30 border border-purple-500/30 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-100 text-lg">
                {isRTL ? 'مكتبة قوالب الذكاء الاصطناعي' : 'AI Prompt Marketplace'}
              </h2>
              <p className="text-xs text-neutral-500">
                {isRTL ? 'اختر قالباً واطبّقه على ملاحظاتك' : 'Select a template and apply it to your notes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[60vh] overflow-hidden">
          {/* Left sidebar - Categories */}
          <div className="w-48 flex-shrink-0 border-e border-neutral-800/60 p-3 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 text-start ${
                  activeCategory === cat.id
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                }`}
              >
                <span className={`p-1 rounded-lg border ${cat.color}`}>{cat.icon}</span>
                <span className="font-medium text-xs">{isRTL ? cat.label_ar : cat.label_en}</span>
              </button>
            ))}
          </div>

          {/* Right - Templates grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeGroup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeGroup.templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleUse(template)}
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className="group relative text-start p-4 bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/40 hover:border-neutral-600 rounded-2xl transition-all"
                  >
                    {/* Copy button on hover */}
                    <button
                      onClick={(e) => handleCopy(template, e)}
                      className={`absolute top-3 end-3 p-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-all ${hoveredTemplate === template.id ? 'opacity-100' : 'opacity-0'}`}
                      title={isRTL ? 'نسخ القالب' : 'Copy template'}
                    >
                      <Copy className="w-3 h-3 text-neutral-400" />
                    </button>

                    <div className="text-2xl mb-2">{template.icon}</div>
                    <p className="font-semibold text-sm text-neutral-200 mb-1.5">
                      {isRTL ? template.label_ar : template.label_en}
                    </p>
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {isRTL ? template.prompt_ar : template.prompt_en}
                    </p>

                    <div className={`flex items-center gap-1.5 mt-3 text-xs font-medium transition-colors ${hoveredTemplate === template.id ? 'text-primary-400' : 'text-neutral-600'}`}>
                      <Zap className="w-3 h-3" />
                      <span>{isRTL ? 'استخدم هذا القالب' : 'Use this template'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800/60 bg-neutral-950/50 text-center">
          <p className="text-xs text-neutral-700">
            {isRTL
              ? `${categories.reduce((acc, c) => acc + c.templates.length, 0)} قالب جاهز في ${categories.length} تصنيفات مختلفة`
              : `${categories.reduce((acc, c) => acc + c.templates.length, 0)} ready-made templates across ${categories.length} categories`}
          </p>
        </div>
      </div>
    </div>
  );
}
