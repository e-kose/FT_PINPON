/**
 * Security and Validation Helper Functions
 * XSS koruması ve input validasyon fonksiyonları
 */

import type { UserCredentialsUpdate } from "../../types/SettingsType";
import { t } from "../../i18n/lang";

// SQL Injection koruması
function sanitizeSqlChars(input: string): string {
	if (!input || typeof input !== 'string') return '';
	
	return input
		.replace(/'/g, "''")
		.replace(/;/g, '')
		.replace(/--/g, '')
		.replace(/\/\*/g, '')
		.replace(/\*\//g, '')
		.replace(/xp_/gi, '')
		.replace(/sp_/gi, '');
}

// Genel XSS koruması ve input temizleme
function sanitizeInput(input: string): string {
	if (!input || typeof input !== 'string') return '';
	
	let cleaned = input.trim();
	cleaned = cleaned
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/javascript:/gi, '')
		.replace(/on\w+=/gi, '');
	
	return cleaned;
}

// Email validasyonu
function validateEmail(email: string): { isValid: boolean; message: string } {
	if (!email || typeof email !== 'string') {
		return { isValid: false, message: t("validation_email_required") };
	}
	
	// XSS ve SQL injection koruması
	const cleanEmail = sanitizeInput(sanitizeSqlChars(email));

	// Sadece İngilizce karakterler (Türkçe karakter yok)
	const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/; 

	if (!emailPattern.test(cleanEmail)) {
		return { isValid: false, message: t("validation_email_invalid") };
	}
	
	if (cleanEmail.length > 254) {
		return { isValid: false, message: t("validation_email_too_long") };
	}
	
	return { isValid: true, message: '' };
}

function validateUsername(username: string): { isValid: boolean; message: string } {
	if (!username || typeof username !== 'string') {
		return { isValid: false, message: t("validation_username_required") };
	}
	
	// XSS ve SQL injection koruması
	const sanitized = sanitizeInput(sanitizeSqlChars(username));
	const trimmed = sanitized.trim();
	
	if (trimmed.length < 3 || trimmed.length > 20) {
		return { isValid: false, message: t("validation_username_length") };
	}
	// Sadece İngilizce harf, rakam ve alt çizgi (Türkçe karakter yok)
	const usernamePattern = /^[a-zA-Z0-9_]+$/;

	if (!usernamePattern.test(trimmed)) {
		return { isValid: false, message: t("validation_username_chars") };
	}
	return { isValid: true, message: '' };
}

// Ad soyad validasyonu
function validateFullName(fullName: string): { isValid: boolean; message: string } {
	if (!fullName || typeof fullName !== 'string') {
		return { isValid: false, message: t("validation_fullname_required") };
	}
	
	// XSS ve SQL injection koruması
	const sanitized = sanitizeInput(sanitizeSqlChars(fullName));
	const trimmed = sanitized.trim();
	
	if (trimmed.length < 2 || trimmed.length > 50) {
		return { isValid: false, message: t("validation_fullname_length") };
	}
	
	// Türkçe karakterler dahil harf ve boşluk kontrolü
	const nameRegex = /^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/;
	
	if (!nameRegex.test(trimmed)) {
		return { isValid: false, message: t("validation_fullname_chars") };
	}
	
	return { isValid: true, message: '' };
}

// Bio/Açıklama validasyonu
function validateBio(bio: string): { isValid: boolean; message: string } {
	if (!bio || typeof bio !== 'string') {
		return { isValid: true, message: t("validation_bio_optional") }; // Bio opsiyonel
	}
	
	// XSS ve SQL injection koruması
	const sanitized = sanitizeInput(sanitizeSqlChars(bio));
	const trimmed = sanitized.trim();
	
	if (trimmed.length > 500) {
		return { isValid: false, message: t("validation_bio_length") };
	}
	
	return { isValid: true, message: '' };
}

// Şifre validasyonu
export function validatePassword(password: string): { isValid: boolean; message: string } {
	if (!password || typeof password !== 'string') {
		return { isValid: false, message: t("security_settings_password_requirements_error") };
	}
	

	const sanitized = sanitizeSqlChars(password);
	
	if (sanitized.length < 6) {
		return { isValid: false, message: t("validation_password_length_min") };
	}
	if (sanitized.length > 128) {
		return { isValid: false, message: t("validation_password_length_max") };
	}
	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
	
	if (!passwordPattern.test(sanitized)) {
		return { isValid: false, message: t("validation_password_complexity") };
	}
	
	return { isValid: true, message: '' };
}

export function validateFullProfile(userInfo: UserCredentialsUpdate): { isValid: boolean; errors: Record<string, string> } {
	const errors: Record<string, string> = {};

	// Username keyi var mı ve değeri var mı kontrol et (zorunlu)
	if (!('username' in userInfo) || !userInfo.username || userInfo.username.trim() === '') {
		errors.username = t("validation_username_required");
	} else {
		const usernameValidation = validateUsername(userInfo.username);
		if (!usernameValidation.isValid) {
			errors.username = usernameValidation.message;
		}
	}
	if (!('email' in userInfo) || !userInfo.email || userInfo.email.trim() === '') {
		errors.email = t("validation_email_required");
	} else {
		const emailValidation = validateEmail(userInfo.email);
		if (!emailValidation.isValid) {
			errors.email = emailValidation.message;
		}
	}

	// Profile.full_name varsa validate et (opsiyonel - removeUndefinedKey sonrası yoksa sorun yok)
	if (userInfo.profile?.full_name && userInfo.profile.full_name.trim() !== '') {
		const fullNameValidation = validateFullName(userInfo.profile.full_name);
		if (!fullNameValidation.isValid) {
			errors.fullName = fullNameValidation.message;
		}
	}
	// Profile.bio varsa validate et (opsiyonel - removeUndefinedKey sonrası yoksa sorun yok)
	if (userInfo.profile?.bio && userInfo.profile.bio.trim() !== '') {
		const bioValidation = validateBio(userInfo.profile.bio);
		if (!bioValidation.isValid) {
			errors.bio = bioValidation.message;
		}
	}
	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
}
