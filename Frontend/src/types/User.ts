export type UserProfile = {
  user_id: number;
  full_name: string;
  avatar_url: string;
  bio: string;
}

export type User = {
  id: number;
  email: string;
  username: string;
  is_2fa_enabled: number; // backend 0/1 döndürüyor
  created_at: string;
  updated_at: string;
  profile: UserProfile;
  token?: string; // token frontend'de eklenir, backend'den gelmez
}

export type ApiUserResponse = {
  success: boolean;
  user: Omit<User, 'token'>; // API response'unda token yok
}