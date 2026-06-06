export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export type NoteType = 'text' | 'voice' | 'image' | 'video' | 'pdf' | 'link' | 'file';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  language: Language;
  theme: Theme;
  openai_api_key: string | null;
  cloudinary_cloud_name: string | null;
  cloudinary_api_key: string | null;
  cloudinary_api_secret: string | null;
  storage_used: number;
  notes_count: number;
  tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  color: string;
  icon: string;
  emoji: string | null;
  password_hash: string | null;
  is_encrypted: boolean;
  position: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  children?: Folder[];
  notes_count?: number;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  emoji: string | null;
  password_hash: string | null;
  is_encrypted: boolean;
  created_at: string;
  notes_count?: number;
}

export interface Note {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string;
  content_json: Record<string, unknown> | null;
  note_type: NoteType;
  media_url: string | null;
  media_urls: string[] | null;
  media_thumbnail: string | null;
  link_url: string | null;
  link_preview: Record<string, unknown> | null;
  file_name: string | null;
  file_size: number;
  file_type: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  is_encrypted: boolean;
  password_hash: string | null;
  encrypted_content: string | null;
  color: string | null;
  cover_image: string | null;
  word_count: number;
  char_count: number;
  reading_time: number;
  ai_summary: string | null;
  ai_key_points: string[] | null;
  ai_tasks_extracted: Record<string, unknown> | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  folder?: Folder | null;
}

export interface Task {
  id: string;
  user_id: string;
  note_id: string | null;
  folder_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  reminder_at: string | null;
  completed_at: string | null;
  tags: string[] | null;
  position: number;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIChat {
  id: string;
  user_id: string;
  title: string;
  model: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources: Array<{ note_id: string; title: string; excerpt: string }> | null;
  tokens_used: number;
  created_at: string;
}

export interface NoteShare {
  id: string;
  note_id: string;
  user_id: string;
  share_token: string;
  password_hash: string | null;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  notes_count: number;
  tasks_count: number;
  tasks_done: number;
  files_count: number;
  storage_used: number;
  chats_count: number;
  recent_notes: Note[];
  notes_by_type: Record<NoteType, number>;
  activity_by_day: Array<{ date: string; count: number }>;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'updated_at' | 'created_at' | 'title';
export type FilterBy = 'all' | 'pinned' | 'archived' | 'deleted';

export interface AppSettings {
  language: Language;
  theme: Theme;
  openai_api_key: string;
  cloudinary_cloud_name: string;
  cloudinary_api_key: string;
  cloudinary_api_secret: string;
}
