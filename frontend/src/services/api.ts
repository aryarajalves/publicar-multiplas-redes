import axios from 'axios';
import { 
  Post, 
  PostListResponse, 
  PlatformOverview, 
  AIGenerationResponse, 
  ThumbnailFormat, 
  ThumbnailGenerateResponse, 
  YouTubeVideoOption, 
  User, 
  UserCreatePayload, 
  UserUpdatePayload,
  Invitation,
  InvitationCreatePayload,
  InvitationValidateResponse,
  RegisterByInvitePayload,
  ContainerInfo,
  ContainerLogsResponse,
  BackupListResponse,
  BackupScheduleSettings,
  BackupStatusCards,
  BackupActionResponse
} from '../types';



export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const client = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 120000,
});

export const api = {
  async getPosts(params?: { status?: string; platform?: string; search?: string; skip?: number; limit?: number }): Promise<PostListResponse> {
    const response = await client.get<PostListResponse>('/posts/', { params });
    return response.data;
  },

  async getPost(id: number): Promise<Post> {
    const response = await client.get<Post>(`/posts/${id}`);
    return response.data;
  },

  async createPost(formData: FormData): Promise<Post> {
    const response = await client.post<Post>('/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updatePost(id: number, data: FormData): Promise<Post> {
    const response = await client.put<Post>(`/posts/${id}`, data);
    return response.data;
  },

  async deletePost(id: number): Promise<{ success: boolean; message: string }> {
    const response = await client.delete<{ success: boolean; message: string }>(`/posts/${id}`);
    return response.data;
  },

  async publishNow(id: number): Promise<Post> {
    const response = await client.post<Post>(`/posts/${id}/publish-now`);
    return response.data;
  },

  async cancelPost(id: number): Promise<Post> {
    const response = await client.post<Post>(`/posts/${id}/cancel`);
    return response.data;
  },

  async getPlatformOverview(): Promise<PlatformOverview> {
    const response = await client.get<PlatformOverview>('/platforms/overview');
    return response.data;
  },

  async getYoutubeVideoOptions(): Promise<YouTubeVideoOption[]> {
    const response = await client.get<YouTubeVideoOption[]>('/posts/youtube-options');
    return response.data;
  },

  async generateAIContent(
    file: File,
    title?: string,
    platforms?: string[],
    youtubeInstructions?: string,
    baseText?: string
  ): Promise<AIGenerationResponse> {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);
    if (platforms) formData.append('platforms', platforms.join(','));
    if (youtubeInstructions) formData.append('youtube_instructions', youtubeInstructions);
    if (baseText) formData.append('base_text', baseText);

    const response = await client.post<AIGenerationResponse>('/ai/transcribe-and-generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000,
    });
    return response.data;
  },

  async generateThumbnail(params: {
    title: string;
    transcription?: string;
    format_type: ThumbnailFormat;
    prompt_hint?: string;
    reference_text?: string;
    reference_images?: File[];
  }): Promise<ThumbnailGenerateResponse> {
    const formData = new FormData();
    formData.append('title', params.title);
    if (params.transcription) formData.append('transcription', params.transcription);
    formData.append('format_type', params.format_type);
    if (params.prompt_hint) formData.append('prompt_hint', params.prompt_hint);
    if (params.reference_text) formData.append('reference_text', params.reference_text);
    if (params.reference_images && params.reference_images.length > 0) {
      params.reference_images.forEach((imgFile) => {
        formData.append('reference_images', imgFile);
      });
    }

    const response = await client.post<ThumbnailGenerateResponse>('/ai/generate-thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000,
    });
    return response.data;
  },

  getVideoUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const clean = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return API_BASE_URL ? `${API_BASE_URL}/${clean}` : `/${clean}`;
  },

  async getConnectedAccounts(): Promise<{
    tiktok: { connected: boolean; account_name?: string | null; avatar_url?: string | null; expires_at?: string | null };
    youtube: { connected: boolean; account_name?: string | null };
    instagram: { connected: boolean; account_name?: string | null };
  }> {
    const response = await client.get('/auth/accounts');
    return response.data;
  },

  async getTikTokLoginUrl(): Promise<{ url: string; state: string }> {
    const response = await client.get('/auth/tiktok/login');
    return response.data;
  },

  async disconnectTikTok(): Promise<{ success: boolean; message: string }> {
    const response = await client.post('/auth/tiktok/disconnect');
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await client.get<User[]>('/users/');
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await client.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(payload: UserCreatePayload): Promise<User> {
    const response = await client.post<User>('/users/', payload);
    return response.data;
  },

  async updateUser(id: number, payload: UserUpdatePayload): Promise<User> {
    const response = await client.put<User>(`/users/${id}`, payload);
    return response.data;
  },

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const response = await client.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return response.data;
  },

  async login(payload: { email: string; password: string }): Promise<{ success: boolean; user: User; message: string }> {
    const response = await client.post<{ success: boolean; user: User; message: string }>('/auth/login', payload);
    return response.data;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await client.post<{ success: boolean; message: string }>('/auth/logout');
    return response.data;
  },

  async createInvitation(payload: InvitationCreatePayload): Promise<Invitation> {
    const response = await client.post<Invitation>('/invitations/', payload);
    return response.data;
  },

  async getInvitations(): Promise<Invitation[]> {
    const response = await client.get<Invitation[]>('/invitations/');
    return response.data;
  },

  async validateInvitation(token: string): Promise<InvitationValidateResponse> {
    const response = await client.get<InvitationValidateResponse>(`/invitations/${encodeURIComponent(token)}`);
    return response.data;
  },

  async sendVerificationCode(token: string, email: string): Promise<{ success: boolean; message: string; email: string }> {
    const response = await client.post<{ success: boolean; message: string; email: string }>(
      `/invitations/${encodeURIComponent(token)}/send-code`,
      { email }
    );
    return response.data;
  },

  async deleteInvitation(id: number): Promise<{ success: boolean; message: string }> {
    const response = await client.delete<{ success: boolean; message: string }>(`/invitations/${id}`);
    return response.data;
  },

  async registerByInvite(token: string, payload: RegisterByInvitePayload): Promise<User> {
    const response = await client.post<User>(`/invitations/${encodeURIComponent(token)}/register`, payload);
    return response.data;
  },

  async sendUserPasswordReset(userId: number): Promise<{
    success: boolean;
    message: string;
    reset_url: string;
    email_sent: boolean;
    error_reason?: string | null;
    user_email: string;
  }> {
    const response = await client.post(`/users/${userId}/send-reset-password`);
    return response.data;
  },

  async validateResetPasswordToken(token: string): Promise<{
    valid: boolean;
    email: string;
    name: string;
  }> {
    const response = await client.get(`/auth/reset-password/${encodeURIComponent(token)}`);
    return response.data;
  },

  async confirmResetPassword(
    tokenOrPayload: string | { token: string; new_password: string },
    maybePassword?: string
  ): Promise<{ success: boolean; message: string }> {
    const payload =
      typeof tokenOrPayload === 'string'
        ? { token: tokenOrPayload, new_password: maybePassword || '' }
        : tokenOrPayload;
    const response = await client.post('/auth/reset-password', payload);
    return response.data;
  },

  async getMonitoredContainers(): Promise<ContainerInfo[]> {
    const response = await client.get<ContainerInfo[]>('/logs/containers');
    return response.data;
  },

  async getContainerLogs(params: {
    container: string;
    tail?: number;
    filter?: string;
  }): Promise<ContainerLogsResponse> {
    const response = await client.get<ContainerLogsResponse>('/logs/', { params });
    return response.data;
  },

  // ==========================================
  // BACKUP AUTOMÁTICO & S3 / BACKBLAZE B2
  // ==========================================
  async getBackupStatus(): Promise<BackupStatusCards> {
    const response = await client.get<BackupStatusCards>('/backup/status');
    return response.data;
  },

  async listBackups(backupType?: string): Promise<BackupListResponse> {
    const response = await client.get<BackupListResponse>('/backup/list', {
      params: backupType && backupType !== 'all' ? { backup_type: backupType } : {}
    });
    return response.data;
  },

  async triggerManualBackup(): Promise<BackupActionResponse> {
    const response = await client.post<BackupActionResponse>('/backup/create');
    return response.data;
  },

  async getBackupSchedule(): Promise<BackupScheduleSettings> {
    const response = await client.get<BackupScheduleSettings>('/backup/schedule');
    return response.data;
  },

  async updateBackupSchedule(payload: BackupScheduleSettings): Promise<BackupScheduleSettings> {
    const response = await client.post<BackupScheduleSettings>('/backup/schedule', payload);
    return response.data;
  },

  async importBackup(file: File): Promise<BackupActionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post<BackupActionResponse>('/backup/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getBackupDownloadUrl(backupId: number): string {
    const base = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';
    return `${base}/backup/download/${backupId}`;
  },

  async restoreBackup(backupId: number): Promise<BackupActionResponse> {
    const response = await client.post<BackupActionResponse>(`/backup/restore/${backupId}`);
    return response.data;
  },

  async deleteBackup(backupId: number): Promise<BackupActionResponse> {
    const response = await client.delete<BackupActionResponse>(`/backup/${backupId}`);
    return response.data;
  }
};



