import { setUser, clearUser, getUser } from "./UserStore";
import { router } from "../router/Router";

export async function fetchUser(token: string): Promise<boolean> {
  
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
    setUser(data.user);
    return true;
  }
  return false;
}

export async function refreshToken(): Promise<boolean> {
  const res = await fetch("http://localhost:3000/auth/refresh-token", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    clearUser();
    return false;
  }
  
  const data = await res.json();
  
  if (data.success && data.accesstoken) {
    const userFetched = await fetchUser(data.accesstoken);
    if (userFetched) {
      return true;
    } else {
      return false;
    }
  }
  return false;
}

export async function handleLogin(): Promise<boolean> {
  const user = getUser();

  if (user && user.token) {
    const valid = await fetchUser(user.token);
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
