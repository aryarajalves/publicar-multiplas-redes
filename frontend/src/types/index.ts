export type PlatformType = 'instagram' | 'youtube' | 'tiktok';

export type PostStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'failed' 
  | 'cancelled';

export type PublicationStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'published' 
  | 'failed' 
  | 'skipped';

export interface PlatformPublication {
  id: number;
  post_id: number;
  platform: PlatformType;
  status: PublicationStatus;
  published_at?: string | null;
  external_post_id?: string | null;
  post_url?: string | null;
  error_message?: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  caption?: string | null;
  video_filename: string;
  video_path: string;
  thumbnail_path?: string | null;
  youtube_thumbnail_path?: string | null;
  file_size_bytes?: number | null;
  duration_seconds?: number | null;
  status: PostStatus;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  publications: PlatformPublication[];

  // Conteúdos gerados por IA / plataformas específicas
  transcription?: string | null;
  instagram_caption?: string | null;
  instagram_hashtags?: string | null;
  youtube_title?: string | null;
  youtube_description?: string | null;
  youtube_tags?: string | null;
  youtube_video_type?: string | null;
  youtube_related_video?: string | null;
  tiktok_caption?: string | null;
  tiktok_hashtags?: string | null;
}

export interface PostListResponse {
  total: number;
  items: Post[];
}

export interface PlatformStatusItem {
  platform: PlatformType;
  configured: boolean;
  total_published: number;
  total_pending: number;
  total_failed: number;
}

export interface PlatformOverview {
  total_posts: number;
  total_scheduled: number;
  total_published: number;
  total_failed: number;
  platforms: PlatformStatusItem[];
}

export interface AIGenerationResponse {
  transcription: string;
  instagram: {
    caption: string;
    hashtags: string[];
  };
  youtube: {
    title: string;
    title_options?: string[];
    description: string;
    tags: string[];
    video_type: string;
  };
  tiktok: {
    caption: string;
    hashtags: string[];
  };
}

export type ThumbnailFormat = 'reels' | 'youtube_long';

export interface ThumbnailGenerateResponse {
  thumbnail_url: string;
  thumbnail_path: string;
  format: ThumbnailFormat;
  prompt_used: string;
}

export interface YouTubeVideoOption {
  post_id: number;
  title: string;
  youtube_id?: string | null;
  url: string;
  type: string;
  status: string;
  thumbnail?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  duration_formatted?: string | null;
}

export type UserRole = 'admin' | 'editor';

export interface User {
  id: number;
  name: string;
  email: string;
  whatsapp?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  whatsapp?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  password?: string;
  whatsapp?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface Invitation {
  id: number;
  token: string;
  role: UserRole;
  expires_at: string;
  is_used: boolean;
  used_by_email?: string | null;
  used_at?: string | null;
  created_at: string;
  invite_url?: string;
}

export interface InvitationCreatePayload {
  role: 'admin' | 'editor';
  expires_in_hours: number;
}

export interface InvitationValidateResponse {
  valid: boolean;
  role: 'admin' | 'editor';
  expires_at: string;
  message?: string;
  email_service_configured?: boolean;
}

export interface RegisterByInvitePayload {
  name: string;
  email: string;
  whatsapp: string;
  password: string;
  verification_code: string;
}

export interface SendVerificationCodeResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface ResetPasswordTokenResponse {
  valid: boolean;
  email: string;
  name?: string;
  user_id?: number;
  expires_at?: string;
}

export interface ContainerInfo {
  key: 'backend' | 'frontend' | 'worker';
  name: string;
  label: string;
  description: string;
  status: string;
  container_id?: string | null;
}

export interface LogEntry {
  timestamp?: string | null;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'STDERR';
  stream: 'stdout' | 'stderr';
  message: string;
}

export interface ContainerLogsResponse {
  container: string;
  container_name: string;
  label: string;
  total_lines: number;
  source: string;
  entries: LogEntry[];
}

export interface BackupRecord {
  id: number;
  filename: string;
  file_size_bytes: number;
  backup_type: 'automatic' | 'manual' | 'imported';
  s3_key?: string | null;
  status: string;
  created_at: string;
}

export interface BackupListResponse {
  backups: BackupRecord[];
  total: number;
  total_size_bytes: number;
}

export interface BackupScheduleSettings {
  is_active: boolean;
  frequency_hours: number;
  s3_folder: string;
  retention_limit: number;
  last_backup_at?: string | null;
  next_backup_at?: string | null;
}

export interface BackupStatusCards {
  last_backup?: BackupRecord | null;
  next_backup_at?: string | null;
  frequency_hours: number;
  is_active: boolean;
  total_backups: number;
  retention_limit: number;
  total_size_bytes: number;
  s3_connected: boolean;
  bucket_name?: string | null;
  provider: string;
}

export interface BackupActionResponse {
  success: boolean;
  message: string;
  backup?: BackupRecord;
}
