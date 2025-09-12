export type User = {
  id: number;
  email: string;
  username: string;
  is_2fa_enabled: number; // backend 0/1 döndürüyor
  created_at: string;
  updated_at: string;
  avatar?: string; 
}