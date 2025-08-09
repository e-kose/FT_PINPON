export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  google_id : string,
  is_2fa_enabled : boolean,
  twofa_secret : string
}