import type { User } from '../types/User.ts';
import { router } from '../router/Router.ts';
// Simple in-memory user store
let currentUser: User | null = null;

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
  if (!userData || typeof userData !== 'object') {
    console.warn('Invalid user data provided');
    return null;
  }

  try {
    const sanitizedUser: Partial<User> = {};

    // Validate and sanitize each field
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
      const createdAt = sanitizeString(userData.created_at.toString());
      sanitizedUser.created_at = createdAt;
    }

    if (userData.updated_at) {
      const updatedAt = sanitizeString(userData.updated_at.toString());
      sanitizedUser.updated_at = updatedAt;
    }

    return sanitizedUser;
  } catch (error) {
    console.error('Error validating user data:', error);
    return null;
  }
}

export function setUser(userData: any): boolean {
  const sanitizedData = validateAndSanitizeUser(userData);
  
  if (!sanitizedData) {
	router.navigate("/error");
    console.warn('Failed to set user - invalid data');
    return false;
  }

    currentUser ?  Object.assign(currentUser, sanitizedData) : currentUser = sanitizedData as User;
  return true;
}

export function getUser(): User | null {
  return currentUser ? { ...currentUser } : null;
}

export function clearUser(): void {
  currentUser = null;
}

export function updateUser(updates: Partial<User>): boolean {
  !currentUser ?  router.navigate("/error") : null;
  const updatedUserData = { ...currentUser, ...updates };
  return setUser(updatedUserData);
}

export function isAuthenticated(): boolean {
  return currentUser !== null && currentUser.id !== undefined;
}

