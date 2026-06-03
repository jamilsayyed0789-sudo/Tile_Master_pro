export const API_BASE_URL = "/api";

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("tilemaster_token");
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("tilemaster_token", token);
  }
};

export const clearToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tilemaster_token");
  }
};

export interface AuthStatusResponse {
  email: string;
  is_active: boolean;
  role: string;
  trial_started_at: string;
  trial_days_left: number;
  is_paid: boolean;
  is_expired: boolean;
}

export const fetchWithAuth = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    // If we're on the client side, we can redirect to login
    if (typeof window !== "undefined" && window.location.pathname !== "/auth") {
      window.location.href = "/auth";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error occurred" }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};
