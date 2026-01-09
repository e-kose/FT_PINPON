import { setUser, clearUser, getUser } from "../store/UserStore";
import { router } from "../router/Router";
import type { UserLogin } from "../types/AuthType";
import { initializeNotifications } from "./NotificationService";



export async function loginAuth(userLoginData: UserLogin): Promise<{ status: number; ok: boolean; data: any }> {
	return fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(userLoginData),
		credentials: 'include'
	})
		.then(async response => {
			const responseData = await response.text().then(text => ({
				status: response.status,
				ok: response.ok,
				data: text ? JSON.parse(text) : {}
			}));
			if (responseData.ok && responseData.data.success) {
				const token = responseData.data.token || responseData.data.accesstoken;
				if (token) {
					const fetchSuccess = await fetchUser(token);
					if (fetchSuccess) {
						const currentUser = getUser();
						if (currentUser) {
							responseData.data.user = currentUser;
							responseData.data.accesstoken = token;
						}
					}
				}
			}

			return responseData;
		}).catch((error) => {
			throw error;
		})
}

export async function 	fetchUser(token: string): Promise<boolean> {
	const url = `${import.meta.env.VITE_API_BASE_URL}/auth/me`;
	const res = await fetch(url, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${token}`
		},
		credentials: "include",
	});

	if (!res.ok) {
		return false;
	}
	const data = await res.json();
	if (data.success) {
		setUser(data.user, token);
		await initializeNotifications();
		
		return true;
	}
	return false;
}

async function refreshToken(): Promise<string | null> {
	const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`, {
		method: "POST",
		credentials: "include",
	});

	if (!res.ok) {
		clearUser();
		return null;
	}

	const data = await res.json();

	if (data.success && data.accesstoken) {
		const userFetched = await fetchUser(data.accesstoken);
		if (userFetched) return data.accesstoken;
	}
	return null;
}


export async function handleLogin(): Promise<boolean> {
	const user = getUser();

	if (user && user.accesstoken) {
		const valid = await fetchUser(user.accesstoken);
		if (valid) return true;
	}

	const refreshed = await refreshToken();
	if (!refreshed) {
		router.navigate('/');
		return false;
	}
	return true;
}

export async function logout(): Promise<boolean> {
	try {
		const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
			method: "POST",
			credentials: "include",
		});

		if (res.ok) {
			clearUser();
			router.navigate('/');
			return true;
		}
	} catch (error) {
		router.navigate('/error');
	}
	return false;

}

export async function checkAndGetAccessToken(): Promise<string | null> {
	let accessToken = getUser()?.accesstoken || null;
	if (!accessToken) {
		accessToken = await refreshToken();
	}
	return accessToken;
}

export async function set2FA(): Promise<{ ok: boolean; status: number; qr?: string }> {

	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		return { ok: false, status: 401 };
	}
	try {
		const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/2fa/setup`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Authorization": `Bearer ${accessToken}`
			},
		});

		if (res.ok) {
			const data = await res.json();
			if (data.success) {
				return { ok: true, status: res.status, qr: data.qr };
			}
		}
		return { ok: false, status: res.status };
	} catch {
		return { ok: false, status: 0 };
	}
}

export async function enable2Fa(code: string): Promise<{ ok: boolean; status: number }> {
	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		return { ok: false, status: 401 };
	}
	try {
		const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/2fa/enable`, {
			method: "POST",
			credentials: "include",
			headers: {
				accept: "application/json",
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				"token": code
			})
		});

		if (res.ok) {
			const data = await res.json();
			if (data.success) {
				await handleLogin();
				return { ok: true, status: res.status };
			}
		}
		return { ok: false, status: res.status };
	} catch {
		return { ok: false, status: 0 };
	}
}

export async function disable2FA(): Promise<{ ok: boolean; status: number }> {
	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		return { ok: false, status: 401 };
	}
	try {
		const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/2fa/disable`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Authorization": `Bearer ${accessToken}`
			},
		});

		if (res.ok) {
			const data = await res.json();
			if (data.success) {
				await handleLogin();
				return { ok: true, status: res.status };
			}
		}
		return { ok: false, status: res.status };
	} catch {
		return { ok: false, status: 0 };
	}
}

export function removeUndefinedKey(data:any): void {
	Object.keys(data).forEach(key => {
		if (data[key] && typeof data[key] === 'object')
			removeUndefinedKey(data[key]);
		else if (data[key] === undefined)
			delete data[key];
	});
}
