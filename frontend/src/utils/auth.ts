export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export const getToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const token = session?.access_token || null;
  if (token) {
    localStorage.setItem("sync_auth_token", token);
  } else {
    localStorage.removeItem("sync_auth_token");
  }
  
  return token;
};

export const fetchWithAuth = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = await getToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/auth"
    ) {
      window.location.href = "/auth";
    }
    throw new Error("Unauthorized");
  }

  if (response.status === 403) {
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/pricing"
    ) {
      window.location.href = "/pricing?reason=expired";
    }
    throw new Error("Subscription expired");
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Unknown error occurred" }));
    throw new Error(
      errorData.detail || `Request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
};
