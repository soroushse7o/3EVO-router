export interface OAuthAccount { name: string; provider: string; token: string; expiresAt: number; }
export function isExpired(acc: OAuthAccount): boolean { return Date.now() >= acc.expiresAt; }
export function refreshNeeded(acc: OAuthAccount, leadMs = 60000): boolean { return Date.now() + leadMs >= acc.expiresAt; }
