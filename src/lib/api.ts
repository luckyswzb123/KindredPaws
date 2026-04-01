import { Capacitor } from '@capacitor/core';

const API_BASE = Capacitor.isNativePlatform()
  ? 'https://kindredpaws.pages.dev/api'
  : '/api';

const REQUEST_TIMEOUT_MS = 15000;

console.log(`[API_BASE] Using backend: "${API_BASE}"`);

export function getToken(): string | null {
  return localStorage.getItem('kp_access_token');
}

export function setToken(token: string, refreshToken?: string): void {
  localStorage.setItem('kp_access_token', token);
  if (refreshToken) localStorage.setItem('kp_refresh_token', refreshToken);
}

export function clearToken(): void {
  localStorage.removeItem('kp_access_token');
  localStorage.removeItem('kp_refresh_token');
  localStorage.removeItem('kp_user');
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem('kp_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: UserProfile): void {
  localStorage.setItem('kp_user', JSON.stringify(user));
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE}${path}`, { ...options, headers });
  } catch (err: any) {
    console.error(`[FETCH ERROR] URL: ${API_BASE}${path}`, err);
    throw new Error(err?.message || '网络请求失败，请检查网络后重试');
  }

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('kp_refresh_token');
    if (refreshToken) {
      const refreshed = await tryRefresh(refreshToken);
      if (refreshed) {
        headers.Authorization = `Bearer ${getToken()}`;
        const retryRes = await fetchWithTimeout(`${API_BASE}${path}`, { ...options, headers });
        const retryData = await retryRes.json().catch(() => ({}));
        return retryData;
      }
    }

    clearToken();
    window.location.href = '/login';
    throw new Error('登录状态已失效，请重新登录');
  }

  const textResponse = await res.text();
  let data: any;

  try {
    data = textResponse ? JSON.parse(textResponse) : {};
  } catch {
    const parseErrorMsg = `[JSON PARSE ERROR]\nStatus: ${res.status}\nURL: ${res.url}\nContent: ${textResponse.substring(0, 100)}`;
    alert(parseErrorMsg);

    if (!res.ok) {
      throw new Error(`服务返回了无效响应 (${res.status})，请稍后重试`);
    }

    throw new Error('响应解析失败');
  }

  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }

  return data;
}

async function tryRefresh(refreshToken: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json();

    if (data.success && data.data?.access_token) {
      setToken(data.data.access_token);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  email?: string;
  phone?: string;
  experience?: string;
  interested_in?: string;
  stats?: {
    favorites_count: number;
    reviewing_count: number;
    helped_count: number;
  };
}

export interface ApiPet {
  id: string;
  name: string;
  breed: string;
  age: string;
  weight?: string;
  gender?: string;
  location: string;
  distance: string;
  image: string;
  description: string;
  personality: string[];
  status?: 'new' | 'urgent' | 'none';
  type: 'adoption' | 'foster';
  category?: string;
  fosterer_name?: string;
  healthStatus: {
    vaccination: boolean;
    neutered: boolean;
    microchipped: boolean;
  };
  is_favorited?: boolean;
}

export interface ApiApplication {
  id: string;
  petName: string;
  petBreed: string;
  petAge: string;
  petImage: string;
  petId?: string;
  status: 'approved' | 'reviewing' | 'rejected';
  type: 'adoption' | 'foster';
  applicantName?: string;
  applicantBio?: string;
  housingType?: string;
  experienceLevel?: string;
  created_at?: string;
}

export interface ApiMessage {
  id: string;
  sender: string;
  time: string;
  subject: string;
  preview: string;
  content?: string;
  icon: string;
  isRead: boolean;
  type: 'notification' | 'adoption' | 'interaction';
}

export const authApi = {
  async login(email: string, password: string) {
    const res = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data?.session?.access_token) {
      setToken(res.data.session.access_token, res.data.session.refresh_token);
      setStoredUser(res.data.user);
    }

    return res;
  },

  async register(email: string, password: string, name: string) {
    const res = await request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (res.success && res.data?.session?.access_token) {
      setToken(res.data.session.access_token, res.data.session.refresh_token);
      setStoredUser(res.data.user);
    }

    return res;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      clearToken();
    }
  },
};

export const petsApi = {
  async list(params?: {
    type?: string;
    category?: string;
    city?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const qs = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
      });
    }

    const query = qs.toString() ? `?${qs}` : '';
    return request<any>(`/pets${query}`);
  },

  async get(id: string) {
    return request<any>(`/pets/${id}`);
  },

  async create(data: {
    name: string;
    breed: string;
    age: string;
    description: string;
    category: string;
    location: string;
    image_url: string;
  }) {
    return request<any>('/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const applicationsApi = {
  async submit(data: {
    pet_id: string;
    type: string;
    applicant_name: string;
    applicant_phone: string;
    applicant_address: string;
    applicant_wechat?: string;
    applicant_bio?: string;
    housing_type: string;
    housing_description?: string;
    has_outdoor_space: boolean;
    experience_level: string;
  }) {
    return request<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMy(params?: { type?: string; status?: string }) {
    const qs = new URLSearchParams(params as Record<string, string>);
    const query = qs.toString() ? `?${qs}` : '';
    return request<any>(`/applications/my${query}`);
  },

  async getReceived() {
    return request<any>('/applications/received');
  },

  async updateStatus(id: string, status: 'approved' | 'rejected') {
    return request<any>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export const messagesApi = {
  async list(type?: string) {
    const query = type && type !== 'all' ? `?type=${type}` : '';
    return request<any>(`/messages${query}`);
  },

  async markRead(id: string) {
    return request<any>(`/messages/${id}/read`, { method: 'PATCH' });
  },

  async markAllRead() {
    return request<any>('/messages/read-all', { method: 'PATCH' });
  },

  async delete(id: string) {
    return request<any>(`/messages/${id}`, { method: 'DELETE' });
  },
};

export const profileApi = {
  async get() {
    return request<any>('/profile');
  },

  async update(data: Partial<{
    name: string;
    bio: string;
    avatar_url: string;
    location: string;
    phone: string;
    experience: string;
    interested_in: string;
  }>) {
    return request<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadAvatar(imageBase64: string, fileName: string) {
    return request<any>('/profile/upload-avatar', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64, file_name: fileName }),
    });
  },
};

export const favoritesApi = {
  async list() {
    return request<any>('/favorites');
  },

  async add(petId: string) {
    return request<any>(`/favorites/${petId}`, { method: 'POST' });
  },

  async remove(petId: string) {
    return request<any>(`/favorites/${petId}`, { method: 'DELETE' });
  },
};

export const chatApi = {
  async get(messageId: string) {
    return request<any>(`/chat/${messageId}`);
  },

  async send(messageId: string, content: string) {
    return request<any>(`/chat/${messageId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};
