// Auth API functions and context

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
  pendingApproval?: boolean;
}

// Token storage
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// API functions
async function authFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }

  return data;
}

export async function register(
  email: string,
  password: string,
  name: string,
  role?: string
): Promise<AuthResponse> {
  const data = await authFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, role }),
  });
  // Don't store auth for pending approval users
  if (!data.pendingApproval && data.token) {
    storeAuth(data.token, data.user);
  }
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const data = await authFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // Don't store auth for pending approval users
  if (!data.pendingApproval && data.token) {
    storeAuth(data.token, data.user);
  }
  return data;
}

export async function logout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await authFetch("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      // Ignore logout errors
    }
  }
  clearAuth();
}

export async function getCurrentUser(): Promise<User> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  return authFetch<User>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function refreshToken(): Promise<AuthResponse> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const data = await authFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  storeAuth(data.token, data.user);
  return data;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
}

