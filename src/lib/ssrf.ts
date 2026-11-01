import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

const PRIVATE_NETWORKS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const dnsCache = new Map<string, string[]>();

async function resolveHost(host: string): Promise<string[]> {
  if (dnsCache.has(host)) return dnsCache.get(host)!;
  try {
    const [v4, v6] = await Promise.all([
      resolve4(host).catch(() => []),
      resolve6(host).catch(() => []),
    ]);
    const ips = [...v4, ...v6];
    if (ips.length) dnsCache.set(host, ips);
    return ips;
  } catch {
    return [];
  }
}

const defaultAllowlist = new Set(["localhost", "127.0.0.1", "::1"]);
const envAllowlist = new Set(
  (process.env.ALLOWED_UPSTREAM_HOSTS || "").split(",").map(s => s.trim()).filter(Boolean)
);

export async function isSafeUrl(url: string, extraAllowlist: string[] = []): Promise<boolean> {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname;
    const allowlist = new Set([...defaultAllowlist, ...envAllowlist, ...extraAllowlist]);
    if (allowlist.has(host)) return true;
    if (PRIVATE_NETWORKS.some(r => r.test(host))) return false;
    const ips = await resolveHost(host);
    if (ips.some(ip => PRIVATE_NETWORKS.some(r => r.test(ip)))) return false;
    return true;
  } catch {
    return false;
  }
}
