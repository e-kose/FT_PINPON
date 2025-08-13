export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  is_2fa_enabled : boolean,
  oauth_id : string,
  twofa_secret : string
}