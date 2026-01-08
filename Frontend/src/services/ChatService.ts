import { checkAndGetAccessToken } from './AuthService';
import { getUser } from '../store/UserStore';
import type { Friend } from '../types/FriendsType';

const API_BASE = 'https://localhost:4343/api';
const WS_BASE = 'wss://localhost:4343/api';

async function baseHeaders(hasBody = false): Promise<HeadersInit> {
  const token = await checkAndGetAccessToken();
  const user = getUser();
  const headers: HeadersInit = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (user && user.id) headers['x-user-id'] = String(user.id);
  return headers;
}

export async function getFriendsList(): Promise<{ status: number; ok: boolean; data: { success: boolean; friends: Friend[] } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/list`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false, friends: [] }));
  return { status: res.status, ok: res.ok, data };
}

export async function getConversation(friendId: string | number): Promise<{ status: number; ok: boolean; data: { success: boolean; chat: any[] } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/chat/conversation/id/${friendId}`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({ success: false, chat: [] }));
  return { status: res.status, ok: res.ok, data };
}

export function connectWebSocket(token: string): WebSocket {
  return new WebSocket(`${WS_BASE}/chat/ws?token=${encodeURIComponent(token)}`);
}

export default {
  getFriendsList,
  getConversation,
  connectWebSocket,
};
