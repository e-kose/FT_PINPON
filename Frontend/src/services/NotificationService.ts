import { checkAndGetAccessToken } from './AuthService';
import { getUser } from '../store/UserStore';
import { t } from '../i18n/lang';
import type {
  UserOnlineStatus,
  CreateNotificationPayload,
  NotificationFilters,
  MarkAllReadFilters,
  NotificationListResponse,
  SingleNotificationResponse,
  MultipleOnlineStatusResponse,
  MarkAllReadResponse
} from '../types/NotificationTypes';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WS_BASE = import.meta.env.VITE_WS_BASE_URL;

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
    try {
      notificationSocket = await connectNotificationWebSocket();

      notificationSocket.onopen = () => {
      };

      notificationSocket.onerror = (error) => {
      };

      notificationSocket.onclose = (event) => {
        notificationSocket = null;
      };

      notificationSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'ping') {
            if (notificationSocket && notificationSocket.readyState === WebSocket.OPEN) {
              notificationSocket.send(JSON.stringify({ type: 'pong' }));
            }
          }
          else {
          }
        } catch (error) {
        }
      };

    } catch (error) {
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

// ===== ONLINE STATUS API =====

/**
 * Tek kullanıcı online durumu
 */
export async function getUserOnlineStatus(userId: number): Promise<{ status: number; ok: boolean; data: { success: boolean; data?: UserOnlineStatus; message?: string } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/notification/ws/user/${userId}/online`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false }));
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

// ===== WEBSOCKET CONNECTION =====

/**
 * WebSocket bağlantısı oluşturma
 */
async function connectNotificationWebSocket(): Promise<WebSocket> {
  const token = await checkAndGetAccessToken();
  if (!token) {
    throw new Error(t("notification_access_token_missing"));
  }

  const ws = new WebSocket(`${WS_BASE}/notification/ws?token=${encodeURIComponent(token)}`);

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
