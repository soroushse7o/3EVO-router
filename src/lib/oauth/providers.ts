import crypto from "node:crypto";

export interface OAuthProviderConfig {
  id: string;
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  extraParams?: Record<string, string>;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  provider: string;
}

export class OAuthProvider {
  constructor(private config: OAuthProviderConfig) {}

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: this.config.scopes.join(" "),
      state,
    });

    if (this.config.extraParams) {
      for (const [key, value] of Object.entries(this.config.extraParams)) {
        params.set(key, value);
      }
    }

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText} - ${text}`
      );
    }

    return response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Token refresh failed: ${response.status} ${response.statusText} - ${text}`
      );
    }

    return response.json();
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    throw new Error("getUserInfo must be implemented by subclass");
  }

  calculateExpiry(expiresIn?: number): number | undefined {
    if (!expiresIn) return undefined;
    return Date.now() + expiresIn * 1000;
  }
}

export class GoogleOAuthProvider extends OAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    super({
      id: "google",
      name: "Google",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["openid", "profile", "email"],
      clientId,
      clientSecret,
    });
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Google user info: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.sub,
      email: data.email,
      name: data.name,
      avatar_url: data.picture,
      provider: "google",
    };
  }
}

export class GitHubOAuthProvider extends OAuthProvider {
  constructor(clientId: string, clientSecret: string) {
    super({
      id: "github",
      name: "GitHub",
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scopes: ["read:user", "user:email"],
      clientId,
      clientSecret,
      extraParams: { allow_signup: "false" },
    });
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub user info: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: String(data.id),
      email: data.email,
      name: data.name || data.login,
      avatar_url: data.avatar_url,
      provider: "github",
    };
  }
}

export function getOAuthProvider(
  providerId: string,
  clientId: string,
  clientSecret: string
): OAuthProvider {
  switch (providerId.toLowerCase()) {
    case "google":
      return new GoogleOAuthProvider(clientId, clientSecret);
    case "github":
      return new GitHubOAuthProvider(clientId, clientSecret);
    default:
      throw new Error(`Unsupported OAuth provider: ${providerId}`);
  }
}
