import { getAdapter } from "@/lib/db/driver";
import crypto from "node:crypto";

export interface OAuthConnection {
  id?: number;
  provider_id: number;
  user_id?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
  token_type?: string;
}

export interface OAuthState {
  state: string;
  provider_id: number;
  redirect_uri?: string;
  created_at?: number;
  expires_at?: number;
}

export async function createOAuthState(
  providerId: number,
  redirectUri?: string
): Promise<string> {
  const state = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const db = await getAdapter();
  db.run(
    "INSERT INTO oauth_states (state, provider_id, redirect_uri, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    [state, providerId, redirectUri || null, now, now + 600000]
  );
  return state;
}

export async function verifyOAuthState(state: string): Promise<OAuthState | null> {
  const db = await getAdapter();
  const row = db.get(
    "SELECT * FROM oauth_states WHERE state = ? AND expires_at > ?",
    [state, Date.now()]
  );
  if (!row) return null;
  // Delete used state
  db.run("DELETE FROM oauth_states WHERE state = ?", [state]);
  return row as OAuthState;
}

export async function saveOAuthConnection(conn: OAuthConnection): Promise<number> {
  const db = await getAdapter();
  const result = db.run(
    `INSERT INTO oauth_connections 
     (provider_id, user_id, access_token, refresh_token, expires_at, scope, token_type) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      conn.provider_id,
      conn.user_id || null,
      conn.access_token || null,
      conn.refresh_token || null,
      conn.expires_at || null,
      conn.scope || null,
      conn.token_type || "Bearer",
    ]
  );
  return Number(result.lastInsertRowid);
}

export async function updateOAuthConnection(
  id: number,
  updates: Partial<OAuthConnection>
): Promise<void> {
  const db = await getAdapter();
  const sets: string[] = [];
  const vals: any[] = [];
  if (updates.access_token !== undefined) {
    sets.push("access_token = ?");
    vals.push(updates.access_token);
  }
  if (updates.refresh_token !== undefined) {
    sets.push("refresh_token = ?");
    vals.push(updates.refresh_token);
  }
  if (updates.expires_at !== undefined) {
    sets.push("expires_at = ?");
    vals.push(updates.expires_at);
  }
  if (updates.scope !== undefined) {
    sets.push("scope = ?");
    vals.push(updates.scope);
  }
  if (!sets.length) return;
  vals.push(id);
  db.run(`UPDATE oauth_connections SET ${sets.join(", ")} WHERE id = ?`, vals);
}

export async function getOAuthConnections(
  providerId?: number
): Promise<OAuthConnection[]> {
  const db = await getAdapter();
  let rows;
  if (providerId) {
    rows = db.all(
      "SELECT * FROM oauth_connections WHERE provider_id = ? ORDER BY id DESC",
      [providerId]
    );
  } else {
    rows = db.all("SELECT * FROM oauth_connections ORDER BY id DESC");
  }
  return rows as OAuthConnection[];
}

export async function getOAuthConnection(
  id: number
): Promise<OAuthConnection | null> {
  const db = await getAdapter();
  const row = db.get("SELECT * FROM oauth_connections WHERE id = ?", [id]);
  return (row as OAuthConnection) || null;
}

export async function deleteOAuthConnection(id: number): Promise<void> {
  const db = await getAdapter();
  db.run("DELETE FROM oauth_connections WHERE id = ?", [id]);
}

export async function revokeOAuthConnection(id: number): Promise<void> {
  const db = await getAdapter();
  db.run(
    "UPDATE oauth_connections SET access_token = NULL, refresh_token = NULL WHERE id = ?",
    [id]
  );
}
