import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettingsStore } from '../../stores/settingsStore';
import { t } from '../../lib/i18n';
import { Brain, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Mode = 'login' | 'register' | 'reset';

export default function AuthPage() {
  const { language } = useSettingsStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRTL = language === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(isRTL ? 'مرحباً بعودتك!' : 'Welcome back!');
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success(isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast.success(isRTL ? 'تم إرسال رابط إعادة التعيين' : 'Reset link sent to your email');
        setMode('login');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent-600/10 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-primary-400/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600/20 border border-primary-500/30 rounded-2xl mb-4">
            <Brain className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">
            {t('app.name', language)}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {t('app.tagline', language)}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 shadow-glass">
          {/* Mode header */}
          <div className="flex items-center gap-2 mb-6">
            {mode !== 'login' && (
              <button
                onClick={() => setMode('login')}
                className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-neutral-200"
              >
                <BackIcon className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">
                {mode === 'login'
                  ? t('auth.welcome', language)
                  : mode === 'register'
                  ? t('auth.create_account', language)
                  : t('auth.reset_password', language)}
              </h2>
              <p className="text-xs text-neutral-500">
                {mode === 'login'
                  ? t('app.tagline', language)
                  : mode === 'register'
                  ? (isRTL ? 'انضم إلى ملايين المستخدمين' : 'Join millions of users')
                  : (isRTL ? 'أدخل بريدك الإلكتروني لإعادة التعيين' : 'Enter your email to reset')}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field - register only */}
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute top-3.5 right-3.5 w-4 h-4 text-neutral-500 pointer-events-none ltr:right-auto ltr:left-3.5" />
                <input
                  type="text"
                  placeholder={t('auth.name', language)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pr-10 ltr:pr-4 ltr:pl-10"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute top-3.5 right-3.5 w-4 h-4 text-neutral-500 pointer-events-none ltr:right-auto ltr:left-3.5" />
              <input
                type="email"
                placeholder={t('auth.email', language)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pr-10 ltr:pr-4 ltr:pl-10"
                required
                dir="ltr"
              />
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div className="relative">
                <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-neutral-500 pointer-events-none ltr:right-auto ltr:left-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password', language)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10 pl-10 ltr:pl-10 ltr:pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 left-3.5 text-neutral-500 hover:text-neutral-300 transition-colors ltr:left-auto ltr:right-3.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Confirm password */}
            {mode === 'register' && (
              <div className="relative">
                <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-neutral-500 pointer-events-none ltr:right-auto ltr:left-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirm_password', language)}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-10 pl-10 ltr:pl-10 ltr:pr-10"
                  required
                />
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'login' && (
              <div className="text-right ltr:text-left">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  {t('auth.forgot_password', language)}
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="loading-dots">
                  <span /><span /><span />
                </div>
              ) : (
                mode === 'login'
                  ? t('auth.login', language)
                  : mode === 'register'
                  ? t('auth.register', language)
                  : (isRTL ? 'إرسال' : 'Send')
              )}
            </button>
          </form>

          {/* Divider */}
          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="text-xs text-neutral-600">{t('misc.or', language)}</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              {/* Google login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-neutral-700/50 text-neutral-200 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('auth.google', language)}
              </button>

              {/* Switch mode */}
              <p className="text-center text-sm text-neutral-500 mt-4">
                {mode === 'login' ? t('auth.no_account', language) : t('auth.has_account', language)}{' '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  {mode === 'login' ? t('auth.register', language) : t('auth.login', language)}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
