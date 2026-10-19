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
  last_views?: number;
  last_likes?: number;
  last_comments?: number;
  last_shares?: number;
  last_saves?: number;
  last_metrics_sync_at?: string | null;
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

  // Métricas Consolidadas
  total_views?: number;
  total_likes?: number;
  total_comments?: number;
  total_shares?: number;
  total_saves?: number;

  // Conteúdos gerados por IA / plataformas específicas
  transcription?: string | null;
  instagram_caption?: string | null;
  instagram_hashtags?: string | null;
  instagram_audio_id?: string | null;
  instagram_audio_title?: string | null;
  instagram_audio_artist?: string | null;
  instagram_audio_volume?: number | null;
  instagram_video_volume?: number | null;
  instagram_is_trial_reel?: boolean;
  instagram_trial_graduation_strategy?: 'MANUAL' | 'SS_PERFORMANCE' | string | null;
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

export interface VideoPlatformMetric {
  platform: PlatformType;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  post_url?: string | null;
  status: string;
}

export interface VideoAiDiagnosis {
  hook_text: string;
  hook_score: number; // 1-10
  hook_verdict: string;
  why_it_performed: string;
  weaknesses: string[];
  what_to_do_next: string[];
  recommended_next_topics: string[];
}

export interface VideoPerformanceItem {
  id: number;
  title: string;
  video_filename: string;
  video_path: string;
  thumbnail_path?: string | null;
  youtube_thumbnail_path?: string | null;
  scheduled_at: string;
  published_at?: string | null;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  engagement_rate: number; // Porcentagem formatada (ex: 4.8)
  performance_badge: 'high' | 'average' | 'low';
  metrics: VideoPlatformMetric[];
  ai_diagnosis?: VideoAiDiagnosis;
}

export interface AnalyticsOverview {
  total_analyzed_videos: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  average_engagement_rate: number;
  best_video_id?: number | null;
  top_insight: string;
  videos: VideoPerformanceItem[];
}

export interface ScriptVariation {
  id: number;
  title: string;
  hook: string;
  body: string[];
  cta: string;
  estimated_duration: string;
  why_it_works: string;
}

export interface WinningFormulaData {
  total_analyzed: number;
  top_performing_pattern: string;
  best_hook_example: string;
  avg_retention_lift: number;
  key_rules: string[];
}

export interface PublicationSetting {
  id?: number;
  default_location_name?: string | null;
  default_location_id?: string | null;
  tiktok_location_hashtags?: string | null;
  youtube_location_name?: string | null;
  apply_location_to_all: boolean;
  updated_at?: string;
}

export interface LocationSearchResult {
  name: string;
  city: string;
  state: string;
  place_id: string;
  hashtags: string;
}

export interface InstagramAudioItem {
  audio_id: string;
  title: string;
  display_artist?: string | null;
  duration_in_ms: number;
  audio_type: 'music' | 'original_sound' | string;
  cover_artwork_thumbnail_uri?: string | null;
  download_url?: string | null;
  on_platform_audio_preview_link?: string | null;
  is_ads_eligible?: boolean | null;
  ig_username?: string | null;
  is_favorite?: boolean;
}

export interface InstagramAudioSearchResponse {
  items: InstagramAudioItem[];
  total: number;
  source: string;
  next_cursor?: string | null;
}

export interface InstagramProfile {
  connected: boolean;
  account_id?: string | null;
  username?: string | null;
  account_name?: string | null;
  name?: string | null;
  followers_count: number;
  media_count: number;
  profile_picture_url?: string | null;
  trial_reels_eligible: boolean;
  min_followers_for_trial: number;
}

export interface YouTubeProfile {
  connected: boolean;
  channel_id?: string | null;
  title?: string | null;
  custom_url?: string | null;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  thumbnail_url?: string | null;
}

export interface TikTokProfile {
  connected: boolean;
  open_id?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export interface UnifiedProfiles {
  instagram: InstagramProfile;
  youtube: YouTubeProfile;
  tiktok: TikTokProfile;
}

export interface CommentReply {
  id: string;
  username: string;
  text: string;
  timestamp?: string | null;
  like_count?: number;
}

export interface CommentItem {
  id: string;
  platform: 'instagram' | 'youtube' | string;
  username: string;
  avatar?: string | null;
  text: string;
  timestamp?: string | null;
  like_count?: number;
  replies?: CommentReply[];
}

export interface CommentsResponse {
  success: boolean;
  detail?: string | null;
  platform: string;
  total_count: number;
  comments: CommentItem[];
}

export interface CreateCommentPayload {
  platform: string;
  message: string;
  comment_id?: string;
}

