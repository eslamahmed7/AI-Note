import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/i18n';
import {
  Settings, Globe, Moon, Sun, Key, User, Database,
  Shield, Bell, Download, Upload, Save, Eye, EyeOff,
  ChevronRight, AlertCircle, CheckCircle, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const {
    language, theme, openai_api_key, cloudinary_cloud_name,
    cloudinary_api_key, cloudinary_api_secret,
    setLanguage, setTheme, setOpenAIKey, setCloudinarySettings
  } = useSettingsStore();
  const { user, profile, fetchProfile } = useAuthStore();
  const isRTL = language === 'ar';

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [openaiKey, setOpenaiKey] = useState(openai_api_key);
  const [cloudName, setCloudName] = useState(cloudinary_cloud_name);
  const [cloudKey, setCloudKey] = useState(cloudinary_api_key);
  const [cloudSecret, setCloudSecret] = useState(cloudinary_api_secret);
  const [showKeys, setShowKeys] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', icon: Settings, label: isRTL ? 'عام' : 'General' },
    { id: 'profile', icon: User, label: t('settings.profile', language) },
    { id: 'ai', icon: Key, label: isRTL ? 'الذكاء الاصطناعي' : 'AI & Keys' },
    { id: 'media', icon: Database, label: isRTL ? 'الوسائط' : 'Media Storage' },
    { id: 'security', icon: Shield, label: t('settings.security', language) },
    { id: 'backup', icon: Download, label: t('settings.backup', language) },
  ];

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      await fetchProfile();
      toast.success(t('settings.saved', language));
    } catch {
      toast.error(t('status.error', language));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = () => {
    setOpenAIKey(openaiKey);
    toast.success(t('settings.saved', language));
  };

  const handleSaveCloudinary = () => {
    setCloudinarySettings(cloudName, cloudKey, cloudSecret);
    toast.success(t('settings.saved', language));
  };

  const handleExportData = async () => {
    if (!user) return;
    const { data: notes } = await supabase.from('notes').select('*').eq('user_id', user.id);
    const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', user.id);
    const exportData = { notes, tasks, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-notes-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isRTL ? 'تم تصدير البيانات' : 'Data exported');
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      isRTL
        ? 'هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع!'
        : 'Are you sure you want to permanently delete your account? This cannot be undone!'
    );
    if (!confirm) return;
    // In production would call a secure server-side function
    toast.error(isRTL ? 'يرجى التواصل مع الدعم لحذف الحساب' : 'Please contact support to delete account');
  };

  return (
    <div className="flex h-full">
      {/* Sections sidebar */}
      <div className="w-48 border-e border-neutral-800/60 bg-neutral-950 p-3 hidden sm:block">
        <div className="space-y-0.5">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`sidebar-item w-full ${activeSection === section.id ? 'active' : ''}`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Mobile section tabs */}
          <div className="sm:hidden flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`text-xs px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'bg-neutral-800/50 text-neutral-500'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* General */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-neutral-200">{isRTL ? 'الإعدادات العامة' : 'General Settings'}</h2>

              {/* Language */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{t('settings.language', language)}</p>
                      <p className="text-xs text-neutral-500">{isRTL ? 'لغة التطبيق' : 'Application language'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setLanguage('ar')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        language === 'ar'
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {t('settings.arabic', language)}
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        language === 'en'
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {t('settings.english', language)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme */}
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{t('settings.theme', language)}</p>
                      <p className="text-xs text-neutral-500">{isRTL ? 'مظهر التطبيق' : 'Application theme'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        theme === 'dark' ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-800/50 text-neutral-500'
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      {t('settings.dark', language)}
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        theme === 'light' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-neutral-800/50 text-neutral-500'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      {t('settings.light', language)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-neutral-200">{t('settings.profile', language)}</h2>

              <div className="glass rounded-2xl p-4 space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary-600/30 border border-primary-500/20 flex items-center justify-center text-primary-400 text-2xl font-bold">
                    {displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">{displayName || profile?.display_name}</p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-500 mb-1.5 block">{t('auth.name', language)}</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? t('status.saving', language) : t('settings.save', language)}
                </button>
              </div>
            </div>
          )}

          {/* AI Keys */}
          {activeSection === 'ai' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-neutral-200">{isRTL ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}</h2>

              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-3 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {isRTL
                    ? 'يتم تخزين مفاتيح API محلياً في متصفحك فقط ولا يتم إرسالها إلى خوادمنا.'
                    : 'API keys are stored locally in your browser only and never sent to our servers.'}
                </span>
              </div>

              <div className="glass rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 mb-1.5 block">
                    {t('settings.openai_key', language)}
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="input-field text-sm pr-10 ltr:pr-4 ltr:pl-10 font-mono"
                      dir="ltr"
                    />
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      className="absolute top-3.5 left-3.5 ltr:left-auto ltr:right-3.5 text-neutral-500 hover:text-neutral-300"
                    >
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {openaiKey && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">
                        {isRTL ? 'مفتاح محفوظ' : 'Key saved'}
                      </span>
                    </div>
                  )}
                </div>

                <button onClick={handleSaveAI} className="btn-primary w-full">
                  {t('settings.save', language)}
                </button>
              </div>
            </div>
          )}

          {/* Media (Cloudinary) */}
          {activeSection === 'media' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-neutral-200">{t('settings.cloudinary', language)}</h2>

              <div className="glass rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 mb-1.5 block">Cloud Name</label>
                  <input
                    type="text"
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    className="input-field text-sm"
                    placeholder="your-cloud-name"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1.5 block">API Key</label>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={cloudKey}
                    onChange={(e) => setCloudKey(e.target.value)}
                    className="input-field text-sm font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1.5 block">API Secret</label>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={cloudSecret}
                    onChange={(e) => setCloudSecret(e.target.value)}
                    className="input-field text-sm font-mono"
                    dir="ltr"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showKeys}
                    onChange={(e) => setShowKeys(e.target.checked)}
                    className="accent-primary-500"
                  />
                  <span className="text-xs text-neutral-400">{isRTL ? 'إظهار المفاتيح' : 'Show keys'}</span>
                </label>

                <button onClick={handleSaveCloudinary} className="btn-primary w-full">
                  {t('settings.save', language)}
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-neutral-200">{t('settings.security', language)}</h2>

              <div className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-neutral-200">
                      {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                    </p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!user?.email) return;
                      await supabase.auth.resetPasswordForEmail(user.email);
                      toast.success(isRTL ? 'تم إرسال رابط إعادة التعيين' : 'Reset link sent');
                    }}
                    className="btn-secondary text-xs px-3 py-2"
                  >
                    {isRTL ? 'إعادة التعيين' : 'Reset'}
                  </button>
                </div>

                <div className="h-px bg-neutral-800" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      {isRTL ? 'حذف الحساب' : 'Delete Account'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isRTL ? 'حذف نهائي لجميع البيانات' : 'Permanently delete all data'}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isRTL ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup */}
          {activeSection === 'backup' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-neutral-200">{t('settings.backup', language)}</h2>

              <div className="glass rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Download className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-200 mb-0.5">
                      {isRTL ? 'تصدير البيانات' : 'Export Data'}
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      {isRTL ? 'تنزيل جميع ملاحظاتك ومهامك بصيغة JSON' : 'Download all your notes and tasks as JSON'}
                    </p>
                    <button
                      onClick={handleExportData}
                      className="btn-primary text-sm px-4 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isRTL ? 'تصدير الآن' : 'Export Now'}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-neutral-800" />

                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-200 mb-0.5">
                      {isRTL ? 'استيراد البيانات' : 'Import Data'}
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      {isRTL ? 'استيراد ملاحظات من ملف JSON' : 'Import notes from a JSON file'}
                    </p>
                    <label className="btn-secondary text-sm px-4 flex items-center gap-2 w-fit cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {isRTL ? 'استيراد' : 'Import'}
                      <input type="file" accept=".json" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) toast.success(isRTL ? 'سيتم دعم الاستيراد قريباً' : 'Import coming soon');
                      }} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
