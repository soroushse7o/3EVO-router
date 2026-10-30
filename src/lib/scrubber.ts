const PATTERNS = [
  /Authorization:[ \t]*Bearer[ \t]+[^ \t]+/gi,
  /^(Authorization|X-Api-Key|Cookie):.*$/gim,
  /[?&]key=[^& \t]+/gi,
  /sk-[A-Za-z0-9]{10,}/g
];
export function scrub(text: string): string {
  let out = text;
  for (const p of PATTERNS) out = out.replace(p, '[REDACTED_SECRET]');
  return out;
}
