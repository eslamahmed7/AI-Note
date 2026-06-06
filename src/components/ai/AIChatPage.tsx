import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/i18n';
import type { AIChat, AIChatMessage } from '../../types';
import {
  Brain, Send, Plus, Sparkles, Bot, User, Trash2,
  MessageSquare, AlertCircle, ChevronLeft, ChevronRight,
  Copy, ThumbsUp, RotateCcw, Settings, LayoutTemplate
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import AIPromptTemplates from './AIPromptTemplates';

export default function AIChatPage() {
  const { language } = useSettingsStore();
  const { user } = useAuthStore();
  const isRTL = language === 'ar';
  const locale = language === 'ar' ? ar : enUS;

  const [chats, setChats] = useState<AIChat[]>([]);
  const [activeChat, setActiveChat] = useState<AIChat | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    const { data } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    if (data) setChats(data as AIChat[]);
  };

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as AIChatMessage[]);
  };

  const createNewChat = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ai_chats')
      .insert({
        user_id: user.id,
        title: isRTL ? 'محادثة جديدة' : 'New Chat',
      })
      .select()
      .single();

    if (!error && data) {
      const chat = data as AIChat;
      setChats((prev) => [chat, ...prev]);
      setActiveChat(chat);
      setMessages([]);
      setSidebarOpen(false);
    }
  };

  const selectChat = async (chat: AIChat) => {
    setActiveChat(chat);
    await loadMessages(chat.id);
    setSidebarOpen(false);
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('ai_chats').delete().eq('id', chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChat?.id === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !user) return;



    let chat = activeChat;
    if (!chat) {
      const { data } = await supabase
        .from('ai_chats')
        .insert({ user_id: user.id, title: input.substring(0, 50) })
        .select()
        .single();
      if (data) {
        chat = data as AIChat;
        setActiveChat(chat);
        setChats((prev) => [chat!, ...prev]);
      }
    }

    if (!chat) return;

    const userMsg: AIChatMessage = {
      id: crypto.randomUUID(),
      chat_id: chat.id,
      user_id: user.id,
      role: 'user',
      content: input,
      sources: null,
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Save user message
    await supabase.from('ai_chat_messages').insert({
      chat_id: chat.id,
      user_id: user.id,
      role: 'user',
      content: input,
    });

    try {
      const geminiApiKey = atob('QVEuQWI4Uk42S0pJNmlFMWJ4c1EwSWxSckxLeDVwOHNoY1lCaVU1VjVBSVNtVkprMF9aQkE=');
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`;

      // Build contents array for Gemini (roles: user, model)
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: input }]
      });

      const response = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const result = await response.json();
      const assistantText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokensUsed = result.usageMetadata?.totalTokenCount || 0;

      const assistantMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        chat_id: chat.id,
        user_id: user.id,
        role: 'assistant',
        content: assistantText || (isRTL ? 'حدث خطأ في المعالجة' : 'Processing error'),
        sources: null,
        tokens_used: tokensUsed,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message
      await supabase.from('ai_chat_messages').insert({
        chat_id: chat.id,
        user_id: user.id,
        role: 'assistant',
        content: assistantMsg.content,
        sources: assistantMsg.sources,
        tokens_used: assistantMsg.tokens_used,
      });

      // Update chat title from first message
      if (messages.length === 0) {
        await supabase
          .from('ai_chats')
          .update({ title: input.substring(0, 60), updated_at: new Date().toISOString() })
          .eq('id', chat.id);
        setChats((prev) =>
          prev.map((c) => (c.id === chat!.id ? { ...c, title: input.substring(0, 60) } : c))
        );
      }
    } catch {
      const errMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        chat_id: chat.id,
        user_id: user.id,
        role: 'assistant',
        content: isRTL
          ? 'حدث خطأ. يرجى التأكد من صحة مفتاح Gemini API في الإعدادات.'
          : 'An error occurred. Please verify your Gemini API key in Settings.',
        sources: null,
        tokens_used: 0,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(isRTL ? 'تم النسخ' : 'Copied');
  };

  const suggestions = isRTL
    ? [
        'لخص أهم ملاحظاتي هذا الأسبوع',
        'ما المشاريع التي أعمل عليها حالياً؟',
        'اعرض لي المهام غير المكتملة',
        'ما الأفكار التي دونتها مؤخراً؟',
      ]
    : [
        'Summarize my most important notes this week',
        'What projects am I currently working on?',
        'Show me incomplete tasks',
        'What ideas have I recently noted?',
      ];

  return (
    <div className="flex h-full">
      {/* Chat list sidebar */}
      <div
        className={`
          fixed inset-y-0 z-40 w-64 bg-neutral-950 border-e border-neutral-800/60
          transition-transform duration-300 lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
          ${isRTL ? 'right-0' : 'left-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/60">
          <h3 className="font-semibold text-sm text-neutral-200">{t('nav.ai_chat', language)}</h3>
          <button
            onClick={createNewChat}
            className="p-1.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-4rem)] p-2">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-neutral-600 text-xs">
              {isRTL ? 'لا توجد محادثات' : 'No conversations'}
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`w-full text-start px-3 py-2.5 rounded-xl mb-1 text-sm transition-all group flex items-center justify-between cursor-pointer ${
                  activeChat?.id === chat.id
                    ? 'bg-primary-600/15 text-primary-300'
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{chat.title}</span>
                </div>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-neutral-800/40 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500"
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 bg-primary-600/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-neutral-200">
              {activeChat?.title || t('ai.second_brain', language)}
            </h2>
            <p className="text-xs text-neutral-600">{t('ai.second_brain_desc', language)}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-primary-600/10 border border-primary-500/20 rounded-3xl flex items-center justify-center mb-6">
                <Brain className="w-10 h-10 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                {t('ai.second_brain', language)}
              </h3>
              <p className="text-sm text-neutral-500 mb-8 max-w-xs">
                {t('ai.second_brain_desc', language)}
              </p>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="text-start text-xs bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/40 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200 rounded-xl px-3 py-3 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                    msg.role === 'user'
                      ? 'bg-primary-600/30 border border-primary-500/20'
                      : 'bg-neutral-800/60 border border-neutral-700/40'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-primary-400" />
                  ) : (
                    <Brain className="w-4 h-4 text-neutral-400" />
                  )}
                </div>

                {/* Bubble */}
                <div className="flex-1 max-w-[85%]">
                  <div
                    className={msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'}
                  >
                    <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-neutral-600">{t('ai.sources', language)}:</p>
                      {msg.sources.map((src, i) => (
                        <div key={i} className="text-xs bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-3 py-2">
                          <p className="text-primary-400 font-medium">{src.title}</p>
                          <p className="text-neutral-500 truncate">{src.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className={`flex items-center gap-1 mt-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className="p-1 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-700 hover:text-neutral-400"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-neutral-700">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-xl bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-center flex-shrink-0 mt-1">
                <Brain className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="ai-bubble-assistant">
                <div className="loading-dots text-neutral-500">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-4 border-t border-neutral-800/40">
          <div className="flex items-end gap-2 bg-neutral-900 border border-neutral-700/60 rounded-2xl p-3 focus-within:border-primary-500/40 transition-colors">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex-shrink-0 w-9 h-9 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center transition-all"
              title={isRTL ? 'قوالب الذكاء الاصطناعي' : 'AI Prompt Templates'}
            >
              <LayoutTemplate className="w-4 h-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.ask', language)}
              rows={1}
              className="flex-1 bg-transparent text-sm text-neutral-200 placeholder-neutral-600 outline-none resize-none max-h-32 overflow-y-auto"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-700 text-center mt-2">
            {isRTL ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد' : 'Press Enter to send, Shift+Enter for new line'}
          </p>
        </div>
      </div>

      {/* AI Prompt Templates Modal */}
      <AIPromptTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onUseTemplate={(prompt) => {
          setInput((prev) => prev ? `${prompt}\n\n${prev}` : prompt);
          inputRef.current?.focus();
        }}
        language={language}
      />
    </div>
  );
}
