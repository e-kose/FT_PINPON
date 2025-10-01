	import { getUser, setUser, getAccessToken } from "../store/UserStore";
import type { UserCredentialsUpdate } from "../types/SettingsType";
import { checkAndGetAccessToken, removeUndefinedKey } from "./AuthService";

export async function updateUser(userData: UserCredentialsUpdate): Promise<{ success: boolean; message: string; status: number }> {
	removeUndefinedKey(userData);
	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		return { success: false, message: "Access token not available", status: 401 };
	}
	const userId = getUser()?.id.toString() || null;
	if (!userId) {
		return { success: false, message: "User ID not available", status: 400 };
	}
	try {
		const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user`, {
			method: 'PATCH',
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				"x-user-id": userId
			},
			body: JSON.stringify(userData),
		});

		const data = await response.json();
		return {
			success: data.success,
			message: data.message,
			status: response.status
		};
	} catch (error) {
		return {
			success: false,
			message: "Network error",
			status: 0
		};
	}
}

