export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class DefaultExecutor {
  constructor(public config: ProviderConfig) {}

  getBaseUrls() {
    return [this.config.baseUrl];
  }

  async complete(path: string, body: any, signal?: AbortSignal) {
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
    return r;
  }

  async stream(path: string, body: any, signal?: AbortSignal) {
    const r = await this.complete(path, { ...body, stream: true }, signal);
    if (!r.body) throw new Error("upstream closed body");
    return { stream: r.body, provider: this.config.name };
  }
}
