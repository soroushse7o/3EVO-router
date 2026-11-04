import { getAdapter } from "@/lib/db/driver";
import {
  getOAuthProvider,
  OAuthTokenResponse,
  OAuthUserInfo,
} from "@/lib/oauth/providers";

export interface OAuthProviderConfig {
  provider_id: number;
  provider_type: string;
  client_id: string;
  client_secret: string;
  redirect_uri?: string;
  enabled: boolean;
}

export async function getOAuthProviderConfig(
  providerId: number
): Promise<OAuthProviderConfig | null> {
  const db = await getAdapter();
  const row = db.get(
    "SELECT id, name, settings FROM providers WHERE id = ?",
    [providerId]
  );
  if (!row) return null;

  let settings: any = {};
  try {
    settings = JSON.parse((row.settings as string) || "{}");
  } catch {
    settings = {};
  }

  return {
    provider_id: providerId,
    provider_type: row.name.toLowerCase(),
    client_id: settings.oauth_client_id || "",
    client_secret: settings.oauth_client_secret || "",
    redirect_uri: settings.oauth_redirect_uri || undefined,
    enabled: settings.oauth_enabled || false,
  };
}

export async function refreshOAuthTokens(connectionId: number): Promise<void> {
  const db = await getAdapter();
  const connection = db.get(
    "SELECT * FROM oauth_connections WHERE id = ?",
    [connectionId]
  );

  if (!connection) {
    throw new Error(`OAuth connection ${connectionId} not found`);
  }

  if (!connection.refresh_token) {
    throw new Error(`No refresh token for connection ${connectionId}`);
  }

  const config = await getOAuthProviderConfig(connection.provider_id);
  if (!config || !config.enabled) {
    throw new Error(
      `OAuth not configured for provider ${connection.provider_id}`
    );
  }

  const provider = getOAuthProvider(
    config.provider_type,
    config.client_id,
    config.client_secret
  );

  try {
    const tokens: OAuthTokenResponse = await provider.refreshAccessToken(
      connection.refresh_token
    );

    const updates: any = {
      access_token: tokens.access_token,
    };

    if (tokens.refresh_token) {
      updates.refresh_token = tokens.refresh_token;
    }

    if (tokens.expires_in) {
      updates.expires_at = Date.now() + tokens.expires_in * 1000;
    }

    if (tokens.scope) {
      updates.scope = tokens.scope;
    }

    const { updateOAuthConnection } = await import("@/lib/oauth");
    await updateOAuthConnection(connectionId, updates);

    console.log(
      `[OAuth] Refreshed tokens for connection ${connectionId} (provider ${connection.provider_id})`
    );
  } catch (error) {
    console.error(
      `[OAuth] Failed to refresh tokens for connection ${connectionId}:`,
      error
    );
    throw error;
  }
}

export async function checkOAuthConnectionHealth(
  connectionId: number
): Promise<{
  healthy: boolean;
  error?: string;
  expiresAt?: number;
}> {
  const db = await getAdapter();
  const connection = db.get(
    "SELECT * FROM oauth_connections WHERE id = ?",
    [connectionId]
  );

  if (!connection) {
    return { healthy: false, error: "Connection not found" };
  }

  if (!connection.access_token) {
    return { healthy: false, error: "No access token" };
  }

  if (!connection.expires_at) {
    return { healthy: true, expiresAt: undefined };
  }

  const now = Date.now();
  const expiresAt = connection.expires_at;
  const timeUntilExpiry = expiresAt - now;

  if (timeUntilExpiry <= 0) {
    return { healthy: false, error: "Token expired", expiresAt };
  }

  const fiveMinutes = 5 * 60 * 1000;
  if (timeUntilExpiry <= fiveMinutes) {
    return { healthy: false, error: "Token expiring soon", expiresAt };
  }

  return { healthy: true, expiresAt };
}

export async function getExpiringConnections(
  withinMs: number = 5 * 60 * 1000
): Promise<any[]> {
  const db = await getAdapter();
  const now = Date.now();
  const rows = db.all(
    `SELECT * FROM oauth_connections 
     WHERE expires_at IS NOT NULL 
     AND expires_at <= ? 
     AND expires_at > ?
     ORDER BY expires_at ASC`,
    [now + withinMs, now]
  );
  return rows;
}

export async function validateAndRefreshConnection(
  connectionId: number
): Promise<{ success: boolean; error?: string }> {
  const health = await checkOAuthConnectionHealth(connectionId);

  if (health.healthy) {
    return { success: true };
  }

  try {
    await refreshOAuthTokens(connectionId);
    const newHealth = await checkOAuthConnectionHealth(connectionId);
    return { success: newHealth.healthy, error: newHealth.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function exchangeCodeForTokens(
  providerId: number,
  code: string,
  redirectUri?: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
  token_type?: string;
}> {
  const config = await getOAuthProviderConfig(providerId);
  if (!config || !config.enabled) {
    throw new Error(`OAuth not configured for provider ${providerId}`);
  }

  const provider = getOAuthProvider(
    config.provider_type,
    config.client_id,
    config.client_secret
  );

  const tokens = await provider.exchangeCodeForTokens(code, redirectUri || config.redirect_uri || "");

  const result: any = {
    access_token: tokens.access_token,
  };

  if (tokens.refresh_token) {
    result.refresh_token = tokens.refresh_token;
  }

  if (tokens.expires_in) {
    result.expires_at = Date.now() + tokens.expires_in * 1000;
  }

  if (tokens.scope) {
    result.scope = tokens.scope;
  }

  if (tokens.token_type) {
    result.token_type = tokens.token_type;
  }

  return result;
}
