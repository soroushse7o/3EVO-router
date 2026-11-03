"use client";
import { useEffect, useState } from "react";

type Detail = {
  id: string;
  ts: number;
  route: string;
  provider: string;
  model: string;
  ip: string;
  apiKeyPrefix: string;
  status: number;
  latencyMs: number;
  requestHeaders: Record<string, string>;
  requestBody: Record<string, any>;
  responseHeaders: Record<string, string>;
  responseBody: Record<string, any>;
  error?: string;
};

export default function RequestDetailsPage() {
  const [items, setItems] = useState<Detail[]>([]);

  useEffect(() => {
    fetch("/api/request-details").then((r) => r.ok ? r.json() : []).then(setItems);
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">درخواست‌های اخیر</h1>
      <div className="space-y-3">
        {items.map((d) => (
          <div key={d.id} className="rounded-lg border border-white/10 p-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="font-mono opacity-70">{new Date(d.ts).toLocaleString("fa-IR")}</span>
              <span className="font-mono">{d.route}</span>
              <span className={d.status < 400 ? "text-green-400" : "text-red-400"}>{d.status}</span>
              <span className="opacity-70">{d.latencyMs}ms</span>
              <span className="opacity-70">provider: {d.provider}</span>
            </div>
            {d.error && <p className="text-red-500 text-sm mt-1">{d.error}</p>}
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer opacity-70">Request</summary>
              <pre className="mt-1 rounded bg-black/30 p-2 overflow-x-auto">{JSON.stringify(d.requestBody, null, 2)}</pre>
            </details>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer opacity-70">Response</summary>
              <pre className="mt-1 rounded bg-black/30 p-2 overflow-x-auto">{JSON.stringify(d.responseBody, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
