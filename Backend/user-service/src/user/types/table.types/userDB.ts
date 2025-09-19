export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  is_2fa_enabled : boolean,
}