import { checkAndGetAccessToken } from './AuthService';
import { getUser } from '../store/UserStore';
import type { BlockedUser, ReceivedRequest, SentRequest } from '../types/FriendsType';

const API_BASE = 'https://localhost:4343/api';

async function baseHeaders(hasBody = false): Promise<HeadersInit> {
  const token = await checkAndGetAccessToken();
  const user = getUser();
  const headers: HeadersInit = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (user && user.id) headers['x-user-id'] = String(user.id);
  return headers;
}

export async function sendFriendRequest(payload: { toId?: number; toUsername?: string }): Promise<{ status: number; ok: boolean; data: { success: boolean; message?: string } }> {
  const headers = await baseHeaders(true);
  const res = await fetch(`${API_BASE}/friend/request`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  let data: { success: boolean; message?: string } = { success: false };
  try {
    data = await res.json();
  } catch (e) {
    data = { success: false };
  }
  if (data && typeof data.success === 'undefined') {
    data.success = res.ok;
  }
  return { status: res.status, ok: res.ok, data };
}

export async function acceptRequest(requestId: number) {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/request/${requestId}/accept`, {
    method: 'POST',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function rejectRequest(requestId: number) {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/request/${requestId}/reject`, {
    method: 'POST',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function getFriendsList() : Promise<{ status: number; ok: boolean; data: { success: boolean; friends: BlockedUser[] } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/list`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function getIncomingRequests(): Promise<{ status: number; ok: boolean; data: { success: boolean; requests: ReceivedRequest[] } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/requests`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}



export async function getSentRequests(): Promise<{ status: number; ok: boolean; data: { success: boolean; sent: SentRequest[] } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/requests/sent`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function cancelSentRequest(requestId: number) {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/request/${requestId}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function blockUser(blocked_id: number) {
  const headers = await baseHeaders(true);
  const res = await fetch(`${API_BASE}/friend/block`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ blocked_id }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function getBlocked() : Promise<{ status: number; ok: boolean; data: { success: boolean; blocked: BlockedUser[] } }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/friend/blocked`, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function unblockUser(blocked_id: number) {
  const headers = await baseHeaders(false);
  const res = await fetch(`${API_BASE}/friend/block/${blocked_id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function removeFriend(friend_id: number) {
  const headers = await baseHeaders(false);
  const res = await fetch(`${API_BASE}/friend/remove/${friend_id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

export async function getFriendProfile(friendId: number): Promise<{ status: number; ok: boolean; data: any }> {
  const headers = await baseHeaders();
  const res = await fetch(`${API_BASE}/user/id/${friendId}`, { 
    method: 'GET', 
    headers 
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Failed to parse response' }));
  return { status: res.status, ok: res.ok, data };
}

export default {
  sendFriendRequest,
  acceptRequest,
  rejectRequest,
  getFriendsList,
  getIncomingRequests,
  getSentRequests,
  blockUser,
  getBlocked,
  unblockUser,
  removeFriend,
  cancelSentRequest,
  getFriendProfile,
};
