export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T = unknown>(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text) as { message?: string | string[] };
      const msg = Array.isArray(json.message) ? json.message[0] : json.message;
      throw new Error(msg ?? `Hata ${res.status}`);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== text) throw parseErr;
      throw new Error(text || `Hata ${res.status}`);
    }
  }

  return res.json() as Promise<T>;
}
