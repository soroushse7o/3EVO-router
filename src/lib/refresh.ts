import { refreshToken, getToken } from "@/lib/oauth-flows";

export async function withRefresh<T>(provider: string, accountId: string, fn: (token: string) => Promise<T>): Promise<T> {
  let token = getToken(provider, accountId);
  if (!token) {
    token = await refreshToken(provider, accountId);
    if (!token) throw new Error("no token");
  }
  try {
    return await fn(token);
  } catch (e: any) {
    const status = e?.status || e?.response?.status;
    if (status === 401) {
      const newToken = await refreshToken(provider, accountId);
      if (newToken) return await fn(newToken);
    }
    throw e;
  }
}
