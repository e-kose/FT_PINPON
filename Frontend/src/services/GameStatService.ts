import { checkAndGetAccessToken } from "./AuthService";
import { getUser } from "../store/UserStore";
import type { UserGameProfileResponse } from "../types/GameStatsType";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function baseHeaders(): Promise<HeadersInit> {
    const user = getUser();
    const token = await checkAndGetAccessToken();
    if (!token && !user)
        return {};
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (user && user.id) headers["x-user-id"] = String(user.id);
  return headers;
}

/**
 * Belirtilen userId için oyun istatistiklerini getirir.
 * userId verilmezse, login olan kullanıcının kendi istatistiklerini getirir.
 */
export async function getUserStatistic(userId?: string | number): Promise<{
  status: number;
  ok: boolean;
  data: UserGameProfileResponse;
}> {
  const headers = await baseHeaders();
  const user = getUser();

  const targetUserId = userId ?? user?.id;

  if (!targetUserId) {
    return {
      status: 401,
      ok: false,
      data: { success: false, error: "User not authenticated" },
    };
  }

  const res = await fetch(`${API_BASE}/game/users/${targetUserId}/profile`, {
    method: "GET",
    headers,
  });

  const data = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
  console.log("✅ GET USER STATISTIC Response data:", data);
  return { status: res.status, ok: res.ok, data };
}

export default {
  getUserStatistic,
};
