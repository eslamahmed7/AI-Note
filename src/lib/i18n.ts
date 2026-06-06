import type { Language } from '../types';

type TranslationKey = string;

const ar: Record<string, string> = {
  // App
  'app.name': 'Smart Notes AI',
  'app.tagline': 'عقلك الثاني الذكي',

  // Auth
  'auth.login': 'تسجيل الدخول',
  'auth.register': 'إنشاء حساب',
  'auth.logout': 'تسجيل الخروج',
  'auth.email': 'البريد الإلكتروني',
  'auth.password': 'كلمة المرور',
  'auth.name': 'الاسم الكامل',
  'auth.confirm_password': 'تأكيد كلمة المرور',
  'auth.google': 'الدخول بـ Google',
  'auth.no_account': 'ليس لديك حساب؟',
  'auth.has_account': 'لديك حساب بالفعل؟',
  'auth.forgot_password': 'نسيت كلمة المرور؟',
  'auth.reset_password': 'إعادة تعيين كلمة المرور',
  'auth.welcome': 'مرحباً بك',
  'auth.create_account': 'أنشئ حسابك',

  // Navigation
  'nav.dashboard': 'لوحة التحكم',
  'nav.notes': 'ملاحظاتي',
  'nav.tasks': 'المهام',
  'nav.ai_chat': 'المساعد الذكي',
  'nav.folders': 'المجلدات',
  'nav.tags': 'الوسوم',
  'nav.starred': 'المثبتة',
  'nav.archive': 'الأرشيف',
  'nav.trash': 'سلة المحذوفات',
  'nav.settings': 'الإعدادات',
  'nav.vault': 'الخزنة الآمنة',
  'nav.search': 'البحث',

  // Notes
  'notes.new': 'ملاحظة جديدة',
  'notes.untitled': 'بدون عنوان',
  'notes.empty': 'لا توجد ملاحظات',
  'notes.empty_desc': 'ابدأ بإنشاء ملاحظتك الأولى',
  'notes.pin': 'تثبيت',
  'notes.unpin': 'إلغاء التثبيت',
  'notes.archive': 'أرشفة',
  'notes.unarchive': 'إلغاء الأرشفة',
  'notes.delete': 'حذف',
  'notes.restore': 'استعادة',
  'notes.permanent_delete': 'حذف نهائي',
  'notes.type.text': 'نص',
  'notes.type.voice': 'صوتية',
  'notes.type.image': 'صورة',
  'notes.type.video': 'فيديو',
  'notes.type.pdf': 'PDF',
  'notes.type.link': 'رابط',
  'notes.type.file': 'ملف',
  'notes.words': 'كلمة',
  'notes.chars': 'حرف',
  'notes.save': 'حفظ',
  'notes.saved': 'تم الحفظ',
  'notes.edit': 'تعديل',
  'notes.duplicate': 'نسخ',
  'notes.move': 'نقل',
  'notes.export': 'تصدير',
  'notes.share': 'مشاركة',
  'notes.summarize': 'تلخيص بالذكاء الاصطناعي',
  'notes.all': 'جميع الملاحظات',

  // Editor
  'editor.placeholder': 'ابدأ الكتابة...',
  'editor.title_placeholder': 'عنوان الملاحظة',

  // Tasks
  'tasks.new': 'مهمة جديدة',
  'tasks.title': 'المهام',
  'tasks.empty': 'لا توجد مهام',
  'tasks.empty_desc': 'أضف مهمتك الأولى',
  'tasks.todo': 'للتنفيذ',
  'tasks.in_progress': 'قيد التنفيذ',
  'tasks.done': 'مكتمل',
  'tasks.cancelled': 'ملغى',
  'tasks.priority.urgent': 'عاجل',
  'tasks.priority.high': 'عالي',
  'tasks.priority.medium': 'متوسط',
  'tasks.priority.low': 'منخفض',
  'tasks.due_date': 'تاريخ الاستحقاق',
  'tasks.no_due': 'بدون تاريخ',
  'tasks.overdue': 'متأخرة',
  'tasks.complete': 'إكمال',
  'tasks.list_view': 'قائمة',
  'tasks.kanban_view': 'كانبان',

  // AI
  'ai.chat': 'محادثة ذكية',
  'ai.ask': 'اسألني عن ملاحظاتك...',
  'ai.thinking': 'أفكر...',
  'ai.summarize': 'تلخيص',
  'ai.rewrite': 'إعادة صياغة',
  'ai.translate': 'ترجمة',
  'ai.extract_tasks': 'استخراج مهام',
  'ai.key_points': 'النقاط الرئيسية',
  'ai.suggestions': 'اقتراحات',
  'ai.new_chat': 'محادثة جديدة',
  'ai.sources': 'المصادر',
  'ai.no_key': 'مفتاح Gemini API مطلوب',
  'ai.configure_key': 'يرجى إضافة مفتاح Gemini API في الإعدادات',
  'ai.second_brain': 'عقلك الثاني',
  'ai.second_brain_desc': 'اسألني عن أي شيء في ملاحظاتك',

  // Dashboard
  'dashboard.title': 'لوحة التحكم',
  'dashboard.total_notes': 'إجمالي الملاحظات',
  'dashboard.total_tasks': 'إجمالي المهام',
  'dashboard.completed_tasks': 'مهام مكتملة',
  'dashboard.storage': 'التخزين',
  'dashboard.recent_notes': 'آخر الملاحظات',
  'dashboard.activity': 'النشاط',
  'dashboard.welcome': 'مرحباً',
  'dashboard.today': 'اليوم',
  'dashboard.this_week': 'هذا الأسبوع',
  'dashboard.this_month': 'هذا الشهر',

  // Folders
  'folders.new': 'مجلد جديد',
  'folders.rename': 'إعادة التسمية',
  'folders.delete': 'حذف المجلد',
  'folders.empty': 'المجلد فارغ',
  'folders.name': 'اسم المجلد',

  // Tags
  'tags.new': 'وسم جديد',
  'tags.name': 'اسم الوسم',
  'tags.empty': 'لا توجد وسوم',
  'tags.manage': 'إدارة الوسوم',

  // Settings
  'settings.title': 'الإعدادات',
  'settings.language': 'اللغة',
  'settings.theme': 'المظهر',
  'settings.dark': 'داكن',
  'settings.light': 'فاتح',
  'settings.arabic': 'العربية',
  'settings.english': 'الإنجليزية',
  'settings.openai_key': 'مفتاح Gemini API',
  'settings.cloudinary': 'إعدادات Cloudinary',
  'settings.profile': 'الملف الشخصي',
  'settings.backup': 'النسخ الاحتياطي',
  'settings.security': 'الأمان',
  'settings.notifications': 'الإشعارات',
  'settings.save': 'حفظ الإعدادات',
  'settings.saved': 'تم الحفظ بنجاح',

  // Vault
  'vault.title': 'الخزنة الآمنة',
  'vault.unlock': 'فتح الخزنة',
  'vault.lock': 'قفل الخزنة',
  'vault.pin': 'رمز PIN',
  'vault.enter_pin': 'أدخل رمز PIN',
  'vault.wrong_pin': 'رمز PIN خاطئ',
  'vault.setup': 'إعداد الخزنة',

  // Search
  'search.placeholder': 'بحث في ملاحظاتك...',
  'search.no_results': 'لا نتائج',
  'search.results': 'نتائج البحث',
  'search.smart': 'البحث الذكي',

  // Actions
  'action.save': 'حفظ',
  'action.cancel': 'إلغاء',
  'action.delete': 'حذف',
  'action.edit': 'تعديل',
  'action.create': 'إنشاء',
  'action.close': 'إغلاق',
  'action.confirm': 'تأكيد',
  'action.back': 'رجوع',
  'action.done': 'تم',
  'action.add': 'إضافة',
  'action.upload': 'رفع',
  'action.download': 'تحميل',
  'action.copy': 'نسخ',
  'action.share': 'مشاركة',
  'action.select': 'اختيار',

  // Status
  'status.loading': 'جاري التحميل...',
  'status.saving': 'جاري الحفظ...',
  'status.saved': 'تم الحفظ',
  'status.error': 'حدث خطأ',
  'status.success': 'تمت العملية بنجاح',
  'status.offline': 'غير متصل',
  'status.syncing': 'جاري المزامنة...',
  'status.synced': 'تمت المزامنة',

  // Misc
  'misc.or': 'أو',
  'misc.and': 'و',
  'misc.of': 'من',
  'misc.ago': 'منذ',
  'misc.just_now': 'الآن',
  'misc.today': 'اليوم',
  'misc.yesterday': 'أمس',
  'misc.date_format': 'ar-SA',
};

const en: Record<string, string> = {
  // App
  'app.name': 'Smart Notes AI',
  'app.tagline': 'Your Second Brain',

  // Auth
  'auth.login': 'Sign In',
  'auth.register': 'Create Account',
  'auth.logout': 'Sign Out',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.name': 'Full Name',
  'auth.confirm_password': 'Confirm Password',
  'auth.google': 'Continue with Google',
  'auth.no_account': "Don't have an account?",
  'auth.has_account': 'Already have an account?',
  'auth.forgot_password': 'Forgot password?',
  'auth.reset_password': 'Reset Password',
  'auth.welcome': 'Welcome back',
  'auth.create_account': 'Create your account',

  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.notes': 'My Notes',
  'nav.tasks': 'Tasks',
  'nav.ai_chat': 'AI Assistant',
  'nav.folders': 'Folders',
  'nav.tags': 'Tags',
  'nav.starred': 'Pinned',
  'nav.archive': 'Archive',
  'nav.trash': 'Trash',
  'nav.settings': 'Settings',
  'nav.vault': 'Secure Vault',
  'nav.search': 'Search',

  // Notes
  'notes.new': 'New Note',
  'notes.untitled': 'Untitled',
  'notes.empty': 'No Notes',
  'notes.empty_desc': 'Create your first note',
  'notes.pin': 'Pin',
  'notes.unpin': 'Unpin',
  'notes.archive': 'Archive',
  'notes.unarchive': 'Unarchive',
  'notes.delete': 'Delete',
  'notes.restore': 'Restore',
  'notes.permanent_delete': 'Delete Forever',
  'notes.type.text': 'Text',
  'notes.type.voice': 'Voice',
  'notes.type.image': 'Image',
  'notes.type.video': 'Video',
  'notes.type.pdf': 'PDF',
  'notes.type.link': 'Link',
  'notes.type.file': 'File',
  'notes.words': 'words',
  'notes.chars': 'chars',
  'notes.save': 'Save',
  'notes.saved': 'Saved',
  'notes.edit': 'Edit',
  'notes.duplicate': 'Duplicate',
  'notes.move': 'Move',
  'notes.export': 'Export',
  'notes.share': 'Share',
  'notes.summarize': 'AI Summary',
  'notes.all': 'All Notes',

  // Editor
  'editor.placeholder': 'Start writing...',
  'editor.title_placeholder': 'Note title',

  // Tasks
  'tasks.new': 'New Task',
  'tasks.title': 'Tasks',
  'tasks.empty': 'No Tasks',
  'tasks.empty_desc': 'Add your first task',
  'tasks.todo': 'To Do',
  'tasks.in_progress': 'In Progress',
  'tasks.done': 'Done',
  'tasks.cancelled': 'Cancelled',
  'tasks.priority.urgent': 'Urgent',
  'tasks.priority.high': 'High',
  'tasks.priority.medium': 'Medium',
  'tasks.priority.low': 'Low',
  'tasks.due_date': 'Due Date',
  'tasks.no_due': 'No due date',
  'tasks.overdue': 'Overdue',
  'tasks.complete': 'Complete',
  'tasks.list_view': 'List',
  'tasks.kanban_view': 'Kanban',

  // AI
  'ai.chat': 'Smart Chat',
  'ai.ask': 'Ask me about your notes...',
  'ai.thinking': 'Thinking...',
  'ai.summarize': 'Summarize',
  'ai.rewrite': 'Rewrite',
  'ai.translate': 'Translate',
  'ai.extract_tasks': 'Extract Tasks',
  'ai.key_points': 'Key Points',
  'ai.suggestions': 'Suggestions',
  'ai.new_chat': 'New Chat',
  'ai.sources': 'Sources',
  'ai.no_key': 'Gemini API Key Required',
  'ai.configure_key': 'Please add your Gemini API key in Settings',
  'ai.second_brain': 'Your Second Brain',
  'ai.second_brain_desc': 'Ask me anything about your notes',

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.total_notes': 'Total Notes',
  'dashboard.total_tasks': 'Total Tasks',
  'dashboard.completed_tasks': 'Completed Tasks',
  'dashboard.storage': 'Storage',
  'dashboard.recent_notes': 'Recent Notes',
  'dashboard.activity': 'Activity',
  'dashboard.welcome': 'Welcome',
  'dashboard.today': 'Today',
  'dashboard.this_week': 'This Week',
  'dashboard.this_month': 'This Month',

  // Folders
  'folders.new': 'New Folder',
  'folders.rename': 'Rename',
  'folders.delete': 'Delete Folder',
  'folders.empty': 'Folder is empty',
  'folders.name': 'Folder Name',

  // Tags
  'tags.new': 'New Tag',
  'tags.name': 'Tag Name',
  'tags.empty': 'No tags',
  'tags.manage': 'Manage Tags',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.dark': 'Dark',
  'settings.light': 'Light',
  'settings.arabic': 'Arabic',
  'settings.english': 'English',
  'settings.openai_key': 'Gemini API Key',
  'settings.cloudinary': 'Cloudinary Settings',
  'settings.profile': 'Profile',
  'settings.backup': 'Backup',
  'settings.security': 'Security',
  'settings.notifications': 'Notifications',
  'settings.save': 'Save Settings',
  'settings.saved': 'Saved successfully',

  // Vault
  'vault.title': 'Secure Vault',
  'vault.unlock': 'Unlock Vault',
  'vault.lock': 'Lock Vault',
  'vault.pin': 'PIN Code',
  'vault.enter_pin': 'Enter PIN',
  'vault.wrong_pin': 'Wrong PIN',
  'vault.setup': 'Setup Vault',

  // Search
  'search.placeholder': 'Search your notes...',
  'search.no_results': 'No results',
  'search.results': 'Search Results',
  'search.smart': 'Smart Search',

  // Actions
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.delete': 'Delete',
  'action.edit': 'Edit',
  'action.create': 'Create',
  'action.close': 'Close',
  'action.confirm': 'Confirm',
  'action.back': 'Back',
  'action.done': 'Done',
  'action.add': 'Add',
  'action.upload': 'Upload',
  'action.download': 'Download',
  'action.copy': 'Copy',
  'action.share': 'Share',
  'action.select': 'Select',

  // Status
  'status.loading': 'Loading...',
  'status.saving': 'Saving...',
  'status.saved': 'Saved',
  'status.error': 'Error occurred',
  'status.success': 'Success',
  'status.offline': 'Offline',
  'status.syncing': 'Syncing...',
  'status.synced': 'Synced',

  // Misc
  'misc.or': 'or',
  'misc.and': 'and',
  'misc.of': 'of',
  'misc.ago': 'ago',
  'misc.just_now': 'just now',
  'misc.today': 'Today',
  'misc.yesterday': 'Yesterday',
  'misc.date_format': 'en-US',
};

const translations: Record<Language, Record<string, string>> = { ar, en };

let currentLang: Language = 'ar';

export function setLanguage(lang: Language) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function t(key: TranslationKey, lang?: Language): string {
  const l = lang || currentLang;
  return translations[l]?.[key] ?? translations['ar'][key] ?? key;
}

export function getCurrentLang(): Language {
  return currentLang;
}

export function isRTL(lang?: Language): boolean {
  return (lang || currentLang) === 'ar';
}
