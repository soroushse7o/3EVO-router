export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ProviderResult {
  data: any;
  provider: string;
}

export class DefaultExecutor {
  constructor(public config: ProviderConfig) {}

  getBaseUrls() {
    return [this.config.baseUrl];
  }

  async fetchJson(path: string, body: any, signal?: AbortSignal): Promise<ProviderResult> {
    const baseUrl = this.getBaseUrls()[0].replace(/\/$/, "");
    const url = `${baseUrl}${path}`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!r.ok) {
      const data = await r.text();
      const err = new Error(data || `upstream error ${r.status}`) as any;
      err.status = r.status;
      throw err;
    }
    const data = await r.json().catch(() => ({}));
    return { data, provider: this.config.name };
  }

  async stream(path: string, body: any, signal?: AbortSignal) {
    const baseUrl = this.getBaseUrls()[0].replace(/\/$/, "");
    const url = `${baseUrl}${path}`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!r.body) throw new Error("upstream closed body");
    return { stream: r.body, provider: this.config.name };
  }
}
