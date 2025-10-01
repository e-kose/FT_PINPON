/**
 * Security and Validation Helper Functions
 * XSS koruması ve input validasyon fonksiyonları
 */

import type { UserCredentialsUpdate } from "../../types/SettingsType";

// XSS Koruması - HTML karakterlerini encode eder
export function sanitizeHtml(input: string): string {
	if (!input || typeof input !== 'string') return '';
	
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;');
}

// Script taglerini ve tehlikeli kodları temizler
export function removeScriptTags(input: string): string {
	if (!input || typeof input !== 'string') return '';
	
	return input
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
		.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
		.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
		.replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
		.replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
		.replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '');
}

// JavaScript protokollerini temizler
export function removeJavaScriptProtocols(input: string): string {
	if (!input || typeof input !== 'string') return '';
	
	return input
		.replace(/javascript:/gi, '')
		.replace(/vbscript:/gi, '')
		.replace(/data:/gi, '')
		.replace(/file:/gi, '');
}

// Olay işleyicileri temizler (onclick, onload vb.)
export function removeEventHandlers(input: string): string {
	if (!input || typeof input !== 'string') return '';
	
	return input
		.replace(/on\w+\s*=/gi, '')
		.replace(/style\s*=\s*['"'][^'"]*expression\s*\(/gi, '')
		.replace(/style\s*=\s*['"'][^'"]*javascript\s*:/gi, '');
}


// SQL Injection koruması
export function sanitizeSqlChars(input: string): string {
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
export function sanitizeInput(input: string): string {
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
export function validateEmail(email: string): { isValid: boolean; message: string } {
	if (!email || typeof email !== 'string') {
		return { isValid: false, message: 'Email adresi gereklidir.' };
	}
	
	// XSS ve SQL injection koruması
	const cleanEmail = sanitizeInput(sanitizeSqlChars(email));

	// Sadece İngilizce karakterler (Türkçe karakter yok)
	const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/; 

	if (!emailPattern.test(cleanEmail)) {
		return { isValid: false, message: 'Geçerli bir email adresi girin.' };
	}
	
	if (cleanEmail.length > 254) {
		return { isValid: false, message: 'Email adresi çok uzun.' };
	}
	
	return { isValid: true, message: '' };
}

export function validateUsername(username: string): { isValid: boolean; message: string } {
	if (!username || typeof username !== 'string') {
		return { isValid: false, message: 'Kullanıcı adı gereklidir.' };
	}
	
	// XSS ve SQL injection koruması
	const sanitized = sanitizeInput(sanitizeSqlChars(username));
	const trimmed = sanitized.trim();
	
	if (trimmed.length < 3 || trimmed.length > 20) {
		return { isValid: false, message: 'Kullanıcı adı 3-20 karakter arasında olmalıdır.' };
	}
	// Sadece İngilizce harf, rakam ve alt çizgi (Türkçe karakter yok)
	const usernamePattern = /^[a-zA-Z0-9_]+$/;

	if (!usernamePattern.test(trimmed)) {
		return { isValid: false, message: 'Kullanıcı adı sadece İngilizce harf, rakam ve alt çizgi içermelidir.' };
	}
	return { isValid: true, message: '' };
}

// Ad soyad validasyonu
export function validateFullName(fullName: string): { isValid: boolean; message: string } {
	if (!fullName || typeof fullName !== 'string') {
		return { isValid: false, message: 'Ad soyad gereklidir.' };
	}
	
	// XSS ve SQL injection koruması
	const sanitized = sanitizeInput(sanitizeSqlChars(fullName));
	const trimmed = sanitized.trim();
	
	if (trimmed.length < 2 || trimmed.length > 50) {
		return { isValid: false, message: 'Ad soyad 2-50 karakter arasında olmalıdır.' };
	}
	
	// Türkçe karakterler dahil harf ve boşluk kontrolü
	const nameRegex = /^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/;
	
	if (!nameRegex.test(trimmed)) {
		return { isValid: false, message: 'Ad soyad sadece harf ve boşluk içermelidir.' };
	}
	
	return { isValid: true, message: '' };
}

// Bio/Açıklama validasyonu
export function validateBio(bio: string): { isValid: boolean; message: string } {
	if (!bio || typeof bio !== 'string') {
		return { isValid: true, message: 'Bio opsiyonel' }; // Bio opsiyonel
	}
	
	// XSS ve SQL injection koruması
	const sanitized = sanitizeInput(sanitizeSqlChars(bio));
	const trimmed = sanitized.trim();
	
	if (trimmed.length > 500) {
		return { isValid: false, message: 'Açıklama 500 karakterden uzun olamaz.' };
	}
	
	return { isValid: true, message: '' };
}

// Şifre validasyonu
export function validatePassword(password: string): { isValid: boolean; message: string } {
	if (!password || typeof password !== 'string') {
		return { isValid: false, message: 'Şifre gereklidir.' };
	}
	
	// SQL injection koruması (XSS koruması şifreler için gerekli değil)
	const sanitized = sanitizeSqlChars(password);
	
	if (sanitized.length < 6) {
		return { isValid: false, message: 'Şifre en az 6 karakter olmalıdır.' };
	}
	if (sanitized.length > 128) {
		return { isValid: false, message: 'Şifre çok uzun.' };
	}
	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
	
	if (!passwordPattern.test(sanitized)) {
		return { isValid: false, message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.' };
	}
	
	return { isValid: true, message: '' };
}


// Şifre değiştirme form validasyonu
export function validatePasswordChangeForm(data: {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}): { isValid: boolean; errors: Record<string, string> } {
	const errors: Record<string, string> = {};
	
	if (!data.currentPassword) {
		errors.currentPassword = 'Mevcut şifre gereklidir.';
	}
	
	const newPasswordValidation = validatePassword(data.newPassword);
	if (!newPasswordValidation.isValid) {
		errors.newPassword = newPasswordValidation.message;
	}
	
	if (data.newPassword !== data.confirmPassword) {
		errors.confirmPassword = 'Şifreler eşleşmiyor.';
	}
	
	if (data.currentPassword === data.newPassword) {
		errors.newPassword = 'Yeni şifre mevcut şifreden farklı olmalıdır.';
	}
	return {
		isValid: Object.keys(errors).length === 0,
		errors
	};
}

// URL validasyonu (avatar URL için)
export function validateUrl(url: string): { isValid: boolean; message: string } {
	if (!url || typeof url !== 'string') {
		return { isValid: false, message: 'URL gereklidir.' };
	}
	
	// XSS ve SQL injection koruması
	const cleanUrl = sanitizeInput(sanitizeSqlChars(url));
	
	try {
		const urlObj = new URL(cleanUrl);
		if (!['http:', 'https:'].includes(urlObj.protocol)) {
			return { isValid: false, message: 'Sadece HTTP/HTTPS URL\'leri kabul edilir.' };
		}
		
		return { isValid: true, message: '' };
	} catch {
		return { isValid: false, message: 'Geçerli bir URL girin.' };
	}
}

// Dosya boyutu kontrolü (MB cinsinden)
export function validateFileSize(file: File, maxSizeMB: number): { isValid: boolean; message: string } {
	if (!file) {
		return { isValid: false, message: 'Dosya gereklidir.' };
	}
	
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	
	if (file.size > maxSizeBytes) {
		return { isValid: false, message: `Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır.` };
	}
	
	return { isValid: true, message: '' };
}

// Dosya türü kontrolü
export function validateFileType(file: File, allowedTypes: string[]): { isValid: boolean; message: string } {
	if (!file) {
		return { isValid: false, message: 'Dosya gereklidir.' };
	}
	
	if (!allowedTypes.includes(file.type)) {
		return { isValid: false, message: `Sadece ${allowedTypes.join(', ')} dosya türlerine izin verilir.` };
	}
	
	return { isValid: true, message: '' };
}

export function validateFullProfile(userInfo: UserCredentialsUpdate): { isValid: boolean; errors: Record<string, string> } {
	const errors: Record<string, string> = {};

	// Username keyi var mı ve değeri var mı kontrol et (zorunlu)
	if (!('username' in userInfo) || !userInfo.username || userInfo.username.trim() === '') {
		errors.username = 'Kullanıcı adı gereklidir.';
	} else {
		const usernameValidation = validateUsername(userInfo.username);
		if (!usernameValidation.isValid) {
			errors.username = usernameValidation.message;
		}
	}
	if (!('email' in userInfo) || !userInfo.email || userInfo.email.trim() === '') {
		errors.email = 'Email adresi gereklidir.';
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