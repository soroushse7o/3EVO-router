const PATTERNS = [
  /Authorization:\s*Bearer\s+\S+/gi,
  /^(Authorization|X-Api-Key|Cookie):.*$/gim,
  /[?&]key=[^&\s]+/gi,
  /sk-[A-Za-z0-9]{10,}/g
];
export function scrub(text: string): string {
  let out = text;
  for (const p of PATTERNS) out = out.replace(p, '[REDACTED_SECRET]');
  return out;
}
