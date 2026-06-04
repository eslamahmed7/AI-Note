import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, Theme } from '../types';
import { setLanguage } from '../lib/i18n';

interface SettingsState {
  language: Language;
  theme: Theme;
  openai_api_key: string;
  cloudinary_cloud_name: string;
  cloudinary_api_key: string;
  cloudinary_api_secret: string;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setOpenAIKey: (key: string) => void;
  setCloudinarySettings: (cloud: string, key: string, secret: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ar',
      theme: 'dark',
      openai_api_key: '',
      cloudinary_cloud_name: '',
      cloudinary_api_key: '',
      cloudinary_api_secret: '',

      setLanguage: (lang) => {
        setLanguage(lang);
        set({ language: lang });
      },

      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
        set({ theme });
      },

      setOpenAIKey: (key) => set({ openai_api_key: key }),

      setCloudinarySettings: (cloud, key, secret) =>
        set({
          cloudinary_cloud_name: cloud,
          cloudinary_api_key: key,
          cloudinary_api_secret: secret,
        }),
    }),
    {
      name: 'smart-notes-settings',
    }
  )
);
