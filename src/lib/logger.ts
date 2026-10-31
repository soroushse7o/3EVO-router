import { scrub } from "./scrubber";

export function log(...args: any[]) {
  console.log("[3EVO]", ...args.map((a) => (typeof a === "string" ? scrub(a) : a)));
}
export function logError(...args: any[]) {
  console.error("[3EVO]", ...args.map((a) => (typeof a === "string" ? scrub(a) : a)));
}
export { scrub };
