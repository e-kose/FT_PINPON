import { removeUndefinedKey } from '../services/AuthService.ts';
import type { User, UserLogin, UserProfile } from '../types/AuthType.ts';
import { t } from '../i18n/lang';

// Simple in-memory user store
let currentUser: User | null = null;
let userLoginData: UserLogin | null = null;
// XSS Protection - HTML sanitization
function sanitizeString(str: string): string {
	if (typeof str !== 'string') return '';

	// HTML encode special characters to prevent XSS
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;')
		.replace(/\\/g, '&#x5C;')
		.replace(/`/g, '&#x60;');
}

// Validate and sanitize user data from API
function validateAndSanitizeUser(userData: any): Partial<User> | null {
	console.log('??????????????? Validating user data:', userData);
	if (!userData || typeof userData !== 'object')
		return null;
	try {
		const sanitizedUser: Partial<User> = {};
		if (userData.id) {
			const id = parseInt(userData.id);
			if (!isNaN(id) && id > 0) {
				sanitizedUser.id = id;
			}
		}

		if (userData.username) {
			const username = sanitizeString(userData.username.toString()).trim();
			if (username.length >= 1 && username.length <= 50) {
				sanitizedUser.username = username;
			}
		}

		if (userData.email) {
			const email = sanitizeString(userData.email.toString()).trim();
			if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				sanitizedUser.email = email;
			}
		}
		if (userData.is_2fa_enabled !== undefined) {
			const is_2fa_enabled = parseInt(userData.is_2fa_enabled);
			if (!isNaN(is_2fa_enabled) && (is_2fa_enabled === 0 || is_2fa_enabled === 1)) {
				sanitizedUser.is_2fa_enabled = is_2fa_enabled;
			}
		}
		if (userData.created_at) {
			const createdAt = new Date(userData.created_at);
			if (!isNaN(createdAt.getTime())) {
				sanitizedUser.created_at = createdAt.toISOString();
			}
		}
		if (userData.updated_at) {
			const updatedAt = new Date(userData.updated_at);
			if (!isNaN(updatedAt.getTime())) {
				sanitizedUser.updated_at = updatedAt.toISOString();
			}
		}
		// Handle profile object
		if (userData.profile && typeof userData.profile === 'object') {
			const profile: Partial<UserProfile> = {};

			if (userData.profile.user_id) {
				const user_id = parseInt(userData.profile.user_id);
				if (!isNaN(user_id) && user_id > 0) {
					profile.user_id = user_id;
				}
			}
			if (userData.profile.full_name)
				profile.full_name = sanitizeString(userData.profile.full_name.toString()).trim();

			if (userData.profile.bio)
				profile.bio = sanitizeString(userData.profile.bio.toString()).trim();

			if (userData.profile.avatar_url && userData.profile.avatar_url.toString().trim() !== '')
				profile.avatar_url = (userData.profile.avatar_url.toString()).trim();
			if (userData.oauth_id) {
				profile.user_google_id = userData.oauth_id;
			}
			if (Object.keys(profile).length > 0) {
				sanitizedUser.profile = profile as UserProfile;
			}
		}

		return sanitizedUser;
	} catch (error) {
		console.error('Error validating user data:', error);
		return null;
	}
}



export function setUser(userData: any, token: string): boolean 
{
	console.log('Setting user with data:', userData, 'and token:', token);
	const sanitizedData = validateAndSanitizeUser(userData);
	if (!sanitizedData) {
		console.warn('Failed to set user - invalid data:', userData);
		return false;
	}
	console.log("----------------------> Sanitized User Data ----->", sanitizedData);
	console.log("User_Token ----->", token);
	currentUser ? Object.assign(currentUser, sanitizedData) : currentUser = sanitizedData as User;
	setAccessToken(token);
	console.log('User set successfully:', currentUser.accesstoken);
	return true;
}

export function getUser(): User | null {
	return currentUser ? { ...currentUser } : null;
}

export function clearUser(): void {
	currentUser = null;
}

export function getUserAvatar(): string {
	return currentUser?.profile?.avatar_url || "Null";
}

export function getUserFuallNme(): string {
	return currentUser?.profile?.full_name || currentUser?.username || t("user_store_default_username");
}

export function getUserBio(): string {
	return currentUser?.profile?.bio || '';
}

export function isAuthenticated(): boolean {
	return currentUser !== null && !!currentUser.id;
}

export function setAccessToken(token: string): void {
	if (currentUser) {
		currentUser.accesstoken = token;
	}
}
export function getAccessToken(): string | null {
	return currentUser?.accesstoken || null;
}

export function submitCodeIfValid(callBack?: any, twoFaCode?: HTMLInputElement | null) {
		if (!twoFaCode) return;
		const code = (twoFaCode.value || '').trim();
		if (!/^[0-9]{6}$/.test(code)) {
			alert(t("user_store_twofa_code_invalid"));
			twoFaCode.focus();
			return;
		}
		callBack(code);
}
export function setUserLoginData(UserLogin: UserLogin): void {
	removeUndefinedKey(UserLogin);
	userLoginData = UserLogin;
}
export function getUserLoginData(): UserLogin | null {
	return userLoginData;
}	
