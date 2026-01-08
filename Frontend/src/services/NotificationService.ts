import { checkAndGetAccessToken } from './AuthService';
import { getUser } from '../store/UserStore';
import { t } from '../i18n/lang';
import type {
  Notification,
  NotificationType,
  UserOnlineStatus,
  CreateNotificationPayload,
  UpdateNotificationPayload,
  NotificationFilters,
  MarkAllReadFilters,
  NotificationListResponse,
  SingleNotificationResponse,
  NotificationStatsResponse,
  UnreadCountResponse,
  OnlineUsersResponse,
  MultipleOnlineStatusResponse,
  MarkAllReadResponse
} from '../types/NotificationTypes';

const API_BASE = 'https://localhost:4343/api';
const WS_BASE = 'wss://localhost:4343/api';

let notificationSocket: WebSocket | null = null;

async function baseHeaders(hasBody = false): Promise<HeadersInit> {
  const token = await checkAndGetAccessToken();
  const user = getUser();
  const headers: HeadersInit = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (user && user.id) headers['x-user-id'] = String(user.id);
  return headers;
}

export function getNotificationSocket(): WebSocket | null {
  return notificationSocket;
}

export async function initializeNotifications(): Promise<void> {
  const user = getUser();
  const token = await checkAndGetAccessToken();

  if (user && token && !notificationSocket) {
    console.log('🔔 Initializing notification WebSocket connection...');
    try {
      notificationSocket = await connectNotificationWebSocket();

      notificationSocket.onopen = () => {
        console.log('Notification WebSocket connected successfully');
      };

      notificationSocket.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
      };

      notificationSocket.onclose = (event) => {
        console.log('Notification WebSocket disconnected');
        console.log('Close code:', event.code, 'Close reason:', event.reason);
        notificationSocket = null;
      };

      notificationSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Received WebSocket message:', message);

          if (message.type === 'ping') {
            console.log('🏓 Received ping, sending pong...');
            if (notificationSocket && notificationSocket.readyState === WebSocket.OPEN) {
              notificationSocket.send(JSON.stringify({ type: 'pong' }));
            }
          }
          else {
            console.log('📬 Other message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.log('Raw message:', event.data);
        }
      };

    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }
}

// ===== NOTIFICATION CRUD OPERATIONS =====

/**
 * Bildirim oluşturma
 */
export async function createNotification(payload: CreateNotificationPayload): Promise<SingleNotificationResponse> {
  const headers = await baseHeaders(true);
  const res = await fetch(`${API_BASE}/notification`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Bildirimleri listeleme
 */
export async function getNotifications(params?: NotificationFilters): Promise<NotificationListResponse> {
  const headers = await baseHeaders();
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });
  }

  const url = `${API_BASE}/notification${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false, data: [] }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Belirli bildirimi getirme
 */
export async function getNotification(id: number): Promise<SingleNotificationResponse> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/${id}`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Bildirimi güncelleme
 */
export async function updateNotification(id: number, payload: UpdateNotificationPayload): Promise<SingleNotificationResponse> {
  const headers = await baseHeaders(true);
  const res = await fetch(`${API_BASE}/notification/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Bildirimi okundu işaretleme
 */
export async function markNotificationAsRead(id: number): Promise<SingleNotificationResponse> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/${id}/read`, {
    method: 'PATCH',
    headers,
  });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Bildirimi silme
 */
export async function deleteNotification(id: number): Promise<{ status: number; ok: boolean; data: { success: boolean; message?: string } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/${id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Tüm bildirimleri okundu işaretleme
 */
export async function markAllNotificationsAsRead(filters?: MarkAllReadFilters): Promise<MarkAllReadResponse> {
  const headers = await baseHeaders(true);
  const res = await fetch(`${API_BASE}/notification/mark-all-read`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(filters || {}),
  });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

// ===== NOTIFICATION STATISTICS =====

/**
 * Bildirim istatistikleri
 */
export async function getNotificationStats(): Promise<NotificationStatsResponse> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/stats`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Okunmamış bildirim sayısı
 */
export async function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/unread-count`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false, data: { unread_count: 0 } }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Son okunmamış bildirimler
 */
export async function getRecentUnreadNotifications(limit: number = 5): Promise<NotificationListResponse> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/recent-unread?limit=${limit}`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false, data: [] }));
  return { status: res.status, ok: res.ok, data };
}

// ===== ONLINE STATUS API =====

/**
 * Tek kullanıcı online durumu
 */
export async function getUserOnlineStatus(userId: number): Promise<{ status: number; ok: boolean; data: { success: boolean; data?: UserOnlineStatus; message?: string } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/ws/user/${userId}/online`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false }));
  console.log("???????????????????????*--------------------User Online Status Data:", data);
  return { status: res.status, ok: res.ok, data };
}

/**
 * Çoklu kullanıcı online durumu (Arkadaş listesi için)
 */
export async function getMultipleUsersOnlineStatus(userIds: number[]): Promise<MultipleOnlineStatusResponse> {
  const headers = await baseHeaders(true);
  const res = await fetch(`${API_BASE}/notification/ws/users/online-status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userIds }),
  });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

/**
 * Tüm online kullanıcılar
 */
export async function getAllOnlineUsers(): Promise<OnlineUsersResponse> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/ws/online-users`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false }));
  return { status: res.status, ok: res.ok, data };
}

// ===== WEBSOCKET CONNECTION =====

/**
 * WebSocket bağlantısı oluşturma
 */
export async function connectNotificationWebSocket(): Promise<WebSocket> {
  const token = await checkAndGetAccessToken();
  if (!token) {
    throw new Error(t("notification_access_token_missing"));
  }

  const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);

  // Heartbeat setup (25 saniyede bir ping)
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 25000);

  ws.addEventListener('close', () => {
    clearInterval(heartbeatInterval);
  });

  return ws;
}

// ===== UTILITY FUNCTIONS FOR HEADER COMPONENT =====

/**
 * Bildirim tipine göre SVG ikonu getirme (Header dropdown için)
 */
export function getNotificationIconSVG(type: NotificationType): string {
  switch (type) {
    case 'game_invite':
      return `<svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
      </svg>`;
    case 'chat_message':
      return `<svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>`;
    case 'friend_request':
      return `<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
      </svg>`;
    default:
      return `<svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>`;
  }
}

/**
 * Bildirim tipine göre ikon container background class'ı getirme
 */
export function getNotificationIconBgClass(type: NotificationType): string {
  switch (type) {
    case 'game_invite': return 'bg-green-100 dark:bg-green-900/50';
    case 'chat_message': return 'bg-purple-100 dark:bg-purple-900/50';
    case 'friend_request': return 'bg-blue-100 dark:bg-blue-900/50';
    default: return 'bg-gray-100 dark:bg-gray-900/50';
  }
}

/**
 * Bildirim tipine göre status nokta rengi getirme
 */
export function getNotificationStatusDotClass(type: NotificationType): string {
  switch (type) {
    case 'game_invite': return 'bg-green-500';
    case 'chat_message': return 'bg-purple-500';
    case 'friend_request': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
}

/**
 * Bildirim tipine göre başlık getirme
 */
export function getNotificationTypeTitle(type: NotificationType): string {
  switch (type) {
    case 'game_invite': return t("notification_type_game_invite_title");
    case 'chat_message': return t("notification_type_chat_message_title");
    case 'friend_request': return t("notification_type_friend_request_title");
    default: return t("notification_type_default_title");
  }
}

/**
 * Bildirim için tam HTML item'i oluşturma (Header dropdown için)
 */
export function createNotificationHTML(notification: Notification): string {
  const iconSVG = getNotificationIconSVG(notification.type);
  const iconBgClass = getNotificationIconBgClass(notification.type);
  const statusDotClass = getNotificationStatusDotClass(notification.type);
  const timeAgo = formatNotificationTime(notification.created_at);

  return `
    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" data-notification-id="${notification.id}">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 ${iconBgClass} rounded-full flex items-center justify-center flex-shrink-0">
          ${iconSVG}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${notification.title}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${notification.message}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">${timeAgo}</p>
        </div>
        ${!notification.is_read ? `<div class="w-2 h-2 ${statusDotClass} rounded-full flex-shrink-0 mt-2"></div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Bildirimler listesi için tam HTML oluşturma (Header dropdown için)
 */
export function createNotificationsListHTML(notifications: Notification[]): string {
  if (notifications.length === 0) {
    return `
      <div class="px-6 py-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-sm">${t("notifications_empty_title")}</p>
        <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">${t("notifications_empty_description")}</p>
      </div>
    `;
  }

  return notifications.map(notification => createNotificationHTML(notification)).join('');
}

/**
 * Bildirim badge sayısı için formatlanmış text getirme
 */
export function formatNotificationBadge(count: number): string {
  if (count === 0) return '';
  if (count > 99) return t("notification_badge_overflow");
  return count.toString();
}

/**
 * Basit emoji ikonları (fallback için)
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'game_invite': return '🎮';
    case 'chat_message': return '💬';
    case 'friend_request': return '👥';
    default: return '🔔';
  }
}

/**
 * Bildirim tipine göre renk getirme (text için)
 */
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case 'game_invite': return 'text-green-600 dark:text-green-400';
    case 'chat_message': return 'text-purple-600 dark:text-purple-400';
    case 'friend_request': return 'text-blue-600 dark:text-blue-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Bildirim tipine göre background rengi getirme
 */
export function getNotificationBgColor(type: NotificationType): string {
  switch (type) {
    case 'game_invite': return 'bg-green-100 dark:bg-green-900/50';
    case 'chat_message': return 'bg-purple-100 dark:bg-purple-900/50';
    case 'friend_request': return 'bg-blue-100 dark:bg-blue-900/50';
    default: return 'bg-gray-100 dark:bg-gray-900/50';
  }
}

/**
 * Tarih formatı (zaman önce formatında)
 */
export function formatNotificationTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t("notification_time_just_now");
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return t("notification_time_minutes_ago", { count: minutes });
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return t("notification_time_hours_ago", { count: hours });
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return t("notification_time_days_ago", { count: days });
  }
}

export default {
  // CRUD Operations
  createNotification,
  getNotifications,
  getNotification,
  updateNotification,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,

  // Statistics
  getNotificationStats,
  getUnreadNotificationCount,
  getRecentUnreadNotifications,

  // Online Status
  getUserOnlineStatus,
  getMultipleUsersOnlineStatus,
  getAllOnlineUsers,

  // WebSocket
  connectNotificationWebSocket,

  // Utils
  getNotificationIconSVG,
  getNotificationIconBgClass,
  getNotificationStatusDotClass,
  getNotificationTypeTitle,
  createNotificationHTML,
  createNotificationsListHTML,
  formatNotificationBadge,
  getNotificationIcon,
  getNotificationColor,
  getNotificationBgColor,
  formatNotificationTime,
};
