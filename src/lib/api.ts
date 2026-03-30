import { Capacitor } from '@capacitor/core';

// 在浏览器端使用相对路径 /api (Vite 代理处理)
// 在移动端 (Capacitor) 必须使用包含物理物理 IP 的完整 URL, 否则会请求到手机本地
// 强行锁定后端物理 IP 地址，彻底避免被 localhost 或 https:// 劫持
// 手机浏览器测试通过的地址是 192.168.2.6:3001, 这里保持一致
const API_BASE = Capacitor.isNativePlatform()
  ? 'http://192.168.2.6:3001/api'
  : '/api';

console.log(`[API_BASE] 当前使用的后端链路: "${API_BASE}"`);

// ─── Token 管理 ───────────────────────────────────────────────
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

// ─── HTTP 基础封装 ─────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err: any) {
    console.error(`[FETCH ERROR] URL: ${API_BASE}${path}`, err);
    throw new Error('网络请求失败，请检查后端服务是否正在运行。');
  }

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('kp_refresh_token');
    if (refreshToken) {
      const refreshed = await tryRefresh(refreshToken);
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getToken()}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const retryData = await retryRes.json().catch(() => ({}));
        return retryData;
      }
    }
    clearToken();
    window.location.href = '/login';
    throw new Error('未登录');
  }

  // Read response as text first, to handle empty bodies or HTML error pages
  const textResponse = await res.text();
  let data: any;
  try {
    data = textResponse ? JSON.parse(textResponse) : {};
  } catch (e: any) {
    const parseErrorMsg = `[JSON PARSE ERROR]\nStatus: ${res.status}\nURL: ${res.url}\nContent: ${textResponse.substring(0, 100)}`;
    alert(parseErrorMsg);
    if (!res.ok) {
      throw new Error(`服务器返回了无效的格式 (${res.status}): 可能后端服务没启动或配置有误。`);
    }
    throw new Error('解析 JSON 失败');
  }

  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}

async function tryRefresh(refreshToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
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

// ─── 类型定义 ─────────────────────────────────────────────────
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

// ─── Auth API ─────────────────────────────────────────────────
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

// ─── Pets API ─────────────────────────────────────────────────
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

// ─── Applications API ─────────────────────────────────────────
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

// ─── Messages API ─────────────────────────────────────────────
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

// ─── Profile API ──────────────────────────────────────────────
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

// ─── Favorites API ────────────────────────────────────────────
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

// ─── Chat API ─────────────────────────────────────────────────
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
