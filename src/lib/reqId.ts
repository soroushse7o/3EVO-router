import crypto from "node:crypto";

let threadStore = new WeakMap<object, string>();

export function getReqId(req?: { headers?: Headers }): string {
  if (req?.headers?.get) {
    const existing = req.headers.get("x-3evo-req-id");
    if (existing) return existing;
  }
  return randomId();
}

export function setThreadReqId(id: string) {
  threadStore.set({}, id);
}

export function threadReqId(): string {
  return threadStore.get({}) || "unknown";
}

export function randomId() {
  return crypto.randomBytes(16).toString("hex");
}
