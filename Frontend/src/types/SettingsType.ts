export type UserCredentialsUpdate = {
	email: string;
	username: string;
	profile?: {
		full_name?: string;
		avatar_url?: string;
		bio?: string;
	};
}

export type AuthValidationResult = 
	| { success: true; accessToken: string; userId: string }
	| { success: false; message: string; status: number };