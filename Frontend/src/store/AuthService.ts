import { setUser, clearUser, getUser } from "./UserStore";
import { router } from "../router/Router";
import type { UserLogin } from "../types/User";



export async function loginAuth(userLoginData: UserLogin): Promise<{ status: number; ok: boolean; data: any }> {
	console.log("Login Auth: userLoginData->", userLoginData);
	return fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(userLoginData),
		credentials: 'include'
	})
		.then(response => {
			return response.text().then(text => ({
				status: response.status,
				ok: response.ok,
				data: text ? JSON.parse(text) : {}
			}));
		}).catch((error) => {
			throw error;
		})
}

export async function fetchUser(token: string): Promise<boolean> {
	console.log("-------------------------- Fetch USER -------------------------- ");
	const res = await fetch("http://localhost:3000/auth/me", {
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
		console.log("DData->>>>", data);
		return true;
	}
	return false;
}

export async function refreshToken(): Promise<string | null> {
	console.log("--------------------------- Refresh TOKEN -------------------------- ");
	const res = await fetch("http://localhost:3000/auth/refresh-token", {
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
	console.log("--------------------------- HANDLE LOGIN -------------------------- ");
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
		const res = await fetch("http://localhost:3000/auth/logout", {
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

export async function set2FA(): Promise<string | null> {

	console.log("--------------------------- SET 2FA -------------------------- ");
	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		return null;
	}
	console.log("Setting 2FA to: ", accessToken);
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
			return data.qr;
		}
	}
	return null;
}

export async function enable2Fa(code: string): Promise<boolean> {
	console.log("--------------------------- ENABLE 2FA -------------------------- ");
	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		console.log("Acces token yok");
		return false;
	}
	console.log("Access token_Enable: ", accessToken);
	console.log("Enabling 2FA with code: ", code);
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
			handleLogin();
			console.log("2FA enabled successfully-------------------:", getUser()?.is_2fa_enabled);
			return data.success;
		}
	}
	return false;
}

export async function disable2FA(): Promise<boolean> {
	console.log("--------------------------- DISABLE 2FA -------------------------- ");
	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		return false;
	}
	console.log("Disabling 2FA with token: ", accessToken);
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
			handleLogin();
			console.log("2FA disabled successfully:", getUser()?.is_2fa_enabled);
			return data.success;
		}
	}
	return false;
}