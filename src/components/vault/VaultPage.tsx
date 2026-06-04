import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNotesStore } from '../../stores/notesStore';
import { t } from '../../lib/i18n';
import { Shield, Lock, Eye, EyeOff, X, Plus } from 'lucide-react';

export default function VaultPage() {
  const { language } = useSettingsStore();
  const { notes } = useNotesStore();
  const isRTL = language === 'ar';

  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [vaultPin] = useState(() => localStorage.getItem('vault_pin') || '');

  const vaultNotes = notes.filter((n) => n.is_encrypted);

  const handleUnlock = () => {
    const savedPin = localStorage.getItem('vault_pin');
    if (!savedPin) {
      // First time setup
      if (pin.length >= 4) {
        localStorage.setItem('vault_pin', pin);
        setUnlocked(true);
        setError('');
      } else {
        setError(isRTL ? 'يجب أن يكون PIN على الأقل 4 أرقام' : 'PIN must be at least 4 digits');
      }
    } else {
      if (pin === savedPin) {
        setUnlocked(true);
        setError('');
      } else {
        setError(t('vault.wrong_pin', language));
        setPin('');
      }
    }
  };

  const handleLock = () => {
    setUnlocked(false);
    setPin('');
  };

  const hasPin = !!localStorage.getItem('vault_pin');

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        {/* Lock icon */}
        <div className="w-20 h-20 bg-neutral-900 border border-neutral-700 rounded-3xl flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-neutral-400" />
        </div>

        <h2 className="text-xl font-bold text-neutral-200 mb-2">{t('vault.title', language)}</h2>
        <p className="text-sm text-neutral-500 mb-8 max-w-xs">
          {hasPin
            ? (isRTL ? 'أدخل رمز PIN لفتح الخزنة الآمنة' : 'Enter your PIN to unlock the secure vault')
            : (isRTL ? 'أنشئ رمز PIN لحماية ملاحظاتك الخاصة' : 'Create a PIN to protect your private notes')}
        </p>

        {/* PIN input */}
        <div className="flex gap-3 mb-4 justify-center">
          {Array.from({ length: Math.max(pin.length, hasPin ? 4 : 6) }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-colors ${
                i < pin.length
                  ? 'border-primary-500 bg-primary-600/10 text-primary-400'
                  : 'border-neutral-700 bg-neutral-800/50 text-neutral-700'
              }`}
            >
              {i < pin.length ? (showPin ? pin[i] : '•') : ''}
            </div>
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs w-full mb-4">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === '⌫') setPin((p) => p.slice(0, -1));
                else if (key) setPin((p) => p.length < 8 ? p + key : p);
              }}
              disabled={!key}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-90 ${
                key === '⌫'
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                  : key
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/50'
                  : 'invisible'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <button
          onClick={handleUnlock}
          disabled={pin.length < 4}
          className="btn-primary px-8 flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          {hasPin ? t('vault.unlock', language) : t('vault.setup', language)}
        </button>

        <button
          onClick={() => setShowPin(!showPin)}
          className="mt-3 text-xs text-neutral-600 hover:text-neutral-400 flex items-center gap-1"
        >
          {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {isRTL ? (showPin ? 'إخفاء' : 'إظهار') : (showPin ? 'Hide' : 'Show')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/40">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          <span className="font-medium text-sm text-neutral-200">{t('vault.title', language)}</span>
          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
            {isRTL ? 'مفتوح' : 'Unlocked'}
          </span>
        </div>
        <button
          onClick={handleLock}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 bg-neutral-800/50 hover:bg-neutral-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          {t('vault.lock', language)}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {vaultNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-neutral-600" />
            </div>
            <h3 className="font-medium text-neutral-400 mb-1">
              {isRTL ? 'الخزنة فارغة' : 'Vault is empty'}
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              {isRTL ? 'قم بتشفير ملاحظاتك لحفظها هنا' : 'Encrypt your notes to save them here'}
            </p>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'إضافة ملاحظة آمنة' : 'Add Secure Note'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {vaultNotes.map((note) => (
              <div key={note.id} className="flex items-center gap-3 p-3 bg-neutral-900/60 border border-green-500/20 rounded-xl">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm text-neutral-300 flex-1 truncate">
                  {note.title || t('notes.untitled', language)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
