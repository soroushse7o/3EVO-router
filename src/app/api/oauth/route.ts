import { NextRequest, NextResponse } from "next/server";
import {
  createOAuthState,
  verifyOAuthState,
  saveOAuthConnection,
  getOAuthConnections,
  deleteOAuthConnection,
  revokeOAuthConnection,
} from "@/lib/oauth";
import { validateSession } from "@/lib/auth";

function getSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get("session")?.value;
}

export async function GET(request: NextRequest) {
  if (!(await validateSession(getSessionToken(request)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providerId = request.nextUrl.searchParams.get("provider_id");
  const connections = await getOAuthConnections(
    providerId ? Number(providerId) : undefined
  );
  return NextResponse.json(connections);
}

export async function POST(request: NextRequest) {
  if (!(await validateSession(getSessionToken(request)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider_id, action } = body;

  if (action === "state") {
    const state = await createOAuthState(provider_id);
    return NextResponse.json({ state });
  }

  if (action === "connect") {
    const { code, state: stateParam, redirect_uri } = body;
    if (!code || !stateParam) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    const state = await verifyOAuthState(stateParam);
    if (!state || state.provider_id !== provider_id) {
      return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
    }

    // Exchange code for tokens (implement per provider)
    // This is a placeholder - actual implementation depends on provider
    const tokenData = await exchangeCodeForTokens(state.provider_id, code, redirect_uri);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Failed to exchange code for tokens" },
        { status: 400 }
      );
    }

    const connId = await saveOAuthConnection({
      provider_id: state.provider_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      scope: tokenData.scope,
      token_type: tokenData.token_type || "Bearer",
    });

    return NextResponse.json({ id: connId, ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  if (!(await validateSession(getSessionToken(request)))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, action } = body;

  if (action === "revoke") {
    await revokeOAuthConnection(id);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    await deleteOAuthConnection(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// Placeholder for token exchange
async function exchangeCodeForTokens(
  providerId: number,
  code: string,
  redirectUri?: string
): Promise<{
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
  token_type?: string;
} | null> {
  // This will be implemented per provider in Phase E
  // For now, return mock data for testing
  console.warn(`[OAuth] Token exchange not implemented for provider ${providerId}`);
  return {
    access_token: `mock_access_${Date.now()}`,
    refresh_token: `mock_refresh_${Date.now()}`,
    expires_at: Date.now() + 3600000,
    scope: "read",
    token_type: "Bearer",
  };
}
