user_id INTEGER PRIMARY KEY,
	oauth_id TEXT,
	twofa_secret TEXT,

	export type refreshToken = {
	refreshtoken: string;
}