import type { User, UserProfile } from '../types/User.ts';

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

    // Optional fields
    if (userData.created_at) {
      sanitizedUser.created_at = sanitizeString(userData.created_at.toString()).trim();
    }
    if (userData.updated_at) {
      sanitizedUser.updated_at = sanitizeString(userData.updated_at.toString()).trim();
    }
    if (userData.token) {
      sanitizedUser.token = sanitizeString(userData.token.toString()).trim();
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
      
      if (userData.profile.full_name) {
        profile.full_name = sanitizeString(userData.profile.full_name.toString()).trim();
      }
      
	  // Avatar pushlayana kadar boyle olacak
    //   if (userData.profile.avatar_url) {
    //     profile.avatar_url = sanitizeString(userData.profile.avatar_url.toString()).trim();
    //   } else {
        const random = Math.floor(Math.random() * 13) + 1;
        profile.avatar_url = `/Avatar/${random}.png`;
    //   }
      
      if (userData.profile.bio) {
        profile.bio = sanitizeString(userData.profile.bio.toString()).trim();
      }
      
      sanitizedUser.profile = profile as UserProfile;
    } else {
      // Create default profile if none provided
      const random = Math.floor(Math.random() * 13) + 1;
      sanitizedUser.profile = {
        user_id: sanitizedUser.id || 0,
        full_name: sanitizedUser.username || '',
        avatar_url: `/Avatar/${random}.png`,
        bio: ''
      };
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
    console.warn('Failed to set user - invalid data:', userData);
    return false;
  }
  
  if (currentUser) {
    Object.assign(currentUser, sanitizedData);
  } else {
    currentUser = sanitizedData as User;
  }
  console.log('User set successfully:', currentUser);
  return true;
}

export function getUser(): User | null {
  return currentUser ? { ...currentUser } : null;
}


export function clearUser(): void {
  currentUser = null;
}

// Utility functions for easier access to user data
export function getUserAvatar(): string {
  return currentUser?.profile?.avatar_url || '/Avatar/1.png';
}

export function getUserFullName(): string {
  return currentUser?.profile?.full_name || currentUser?.username || 'Kullanıcı';
}

export function getUserBio(): string {
  return currentUser?.profile?.bio || '';
}

export function isAuthenticated(): boolean {
  return currentUser !== null && !!currentUser.id;
}

