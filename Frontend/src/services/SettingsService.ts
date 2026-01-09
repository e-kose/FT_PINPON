import { getUser } from "../store/UserStore";
import type { AuthValidationResult, UserCredentialsUpdate,} from "../types/SettingsType";
import { checkAndGetAccessToken, removeUndefinedKey } from "./AuthService";

async function validateAuthAndUserId(): Promise<AuthValidationResult> {
	const accessToken = await checkAndGetAccessToken();
	if (!accessToken) {
		return { success: false, message: "Access token not available", status: 401 };
	}
	
	const userId = getUser()?.id.toString() || null;
	if (!userId) {
		return { success: false, message: "User ID not available", status: 400 };
	}
	
	return { success: true, accessToken, userId };
}

export async function updateUser(userData: UserCredentialsUpdate): Promise<{ success: boolean; message: string; status: number }> {
	removeUndefinedKey(userData);
	
	const validation = await validateAuthAndUserId();
	if (!validation.success) {
		return validation;
	}
	
	const { accessToken, userId } = validation;
	
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

export async function deleteUser(): Promise<{ success: boolean; message: string; status: number }> {
	const validation = await validateAuthAndUserId();
	if (!validation.success) {
		return validation;
	}
	
	const { accessToken, userId } = validation;
	
	try {
		const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user`, {
			method: 'DELETE',
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"x-user-id": userId
			},
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

export async function updateAvatar(formData: FormData): Promise<{success: boolean; avatar_url?: string; error?: string; status: number}> {
	const accessToken = await checkAndGetAccessToken();
		
	if (!accessToken) {
		return { success: false, error: "Access token not available", status: 401 };
	}	
	try {
		const uri = `${import.meta.env.VITE_API_BASE_URL}/user/avatar`;
		const response = await fetch(uri, {
			method: 'PATCH',
			headers: {
				"Authorization": `Bearer ${accessToken}`,
			},
			body: formData
		});

		const data = await response.json();
		
		// Backend success field göndermiyorsa, status code'a göre belirle
		const isSuccess = data.success !== undefined ? data.success : (response.status === 200);
		
		return {
			success: isSuccess,
			avatar_url: data.avatar_url,
			error: data.error || data.message,
			status: response.status
		};
	} catch (error) {
		return {
			success: false,
			error: "Network error",
			status: 0
		};
	}
}
export async function changePasswordAsync(passwordData: { oldPass: string; newPass: string }): Promise<{ success: boolean; message: string; status: number }> {
	const validation = await validateAuthAndUserId();
	if (!validation.success) {
		return validation;
	}
	
	const { accessToken, userId } = validation;
	
	try {
		const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/password`, {
			method: 'PATCH',
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				"x-user-id": userId
			},
			body: JSON.stringify(passwordData),
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