export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data as T;
  }

  const text = await res.text();
  const snippet = text.slice(0, 120).replace(/\s+/g, " ").trim();
  throw new Error(`Expected JSON from ${url} but got ${res.status} ${res.statusText}. Response starts with: ${snippet}`);
}
