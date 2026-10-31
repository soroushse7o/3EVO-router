const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return ALLOWED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}
