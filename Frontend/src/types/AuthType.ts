export type UserProfile = {
  user_id: number;
  user_google_id?: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}
export type UserLogin = {
  email?: string;
  username?: string;
  password: string;
  token?: string; 
}
export type User = {
  id: number;
  email: string;
  username: string;
  is_2fa_enabled: number; 
  created_at: string;
  updated_at: string;
  profile: UserProfile;
  accesstoken?: string;
}


