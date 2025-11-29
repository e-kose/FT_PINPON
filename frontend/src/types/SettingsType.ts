export type UserCredentialsUpdate = {
	email: string;
	username: string;
	profile?: {
		full_name?: string;
		avatar_url?: string;
		bio?: string;
	};
}

export type UserPasswordUpdate = {
	oldPass: string;
	newPass: string;
}

export type UserAvatarUpdate = {
	avatar: string;
}