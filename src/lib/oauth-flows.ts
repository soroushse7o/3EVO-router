import { loadAccounts, saveAccounts, upsertAccount, type Account } from "@/lib/accounts";

export async function startDeviceCode(provider: string): Promise<{ device_code: string; user_code: string; verification_uri: string; expires_in: number; interval: number }> {
  // Production: call provider OAuth device-code endpoint
  // Local fallback: simulate with short-lived codes
  const device_code = "dev_" + crypto.randomUUID();
  const user_code = device_code.slice(0, 6).toUpperCase();
  const verification_uri = `http://localhost:20128/oauth/device/${provider}`;
  
  const acc: Account = {
    id: device_code,
    provider,
    token: "",
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  upsertAccount(acc);
  
  return { device_code, user_code, verification_uri, expires_in: 900, interval: 5 };
}

export async function pollDeviceCode(provider: string, deviceCode: string): Promise<{ status: "pending" | "complete" | "expired"; token?: string }> {
  const accs = loadAccounts();
  const idx = accs.findIndex(a => a.id === deviceCode && a.provider === provider);
  if (idx === -1) return { status: "expired" };
  
  const acc = accs[idx];
  if (Date.now() > acc.expiresAt) {
    accs.splice(idx, 1);
    saveAccounts(accs);
    return { status: "expired" };
  }
  
  // Simulate completion for demo
  if (!acc.token) {
    acc.token = "tok_" + crypto.randomUUID();
    acc.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    accs[idx] = acc;
    saveAccounts(accs);
    return { status: "complete", token: acc.token };
  }
  
  return { status: "complete", token: acc.token };
}

export async function refreshToken(provider: string, accountId: string): Promise<string | null> {
  const accs = loadAccounts();
  const idx = accs.findIndex(a => a.id === accountId && a.provider === provider);
  if (idx === -1) return null;
  
  // Production: call provider token endpoint
  const newToken = "tok_" + crypto.randomUUID();
  accs[idx].token = newToken;
  accs[idx].expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  saveAccounts(accs);
  return newToken;
}

export function getToken(provider: string, accountId?: string): string | null {
  const accs = loadAccounts();
  const acc = accountId ? accs.find(a => a.id === accountId) : accs.find(a => a.provider === provider);
  if (!acc) return null;
  if (Date.now() > acc.expiresAt) return null;
  return acc.token;
}

declare const crypto: any;
if (typeof window === "undefined") {
  try {
    // @ts-ignore
    import("crypto").then((m: any) => { crypto.randomUUID = m.randomUUID; });
  } catch {}
}
