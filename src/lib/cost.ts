export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const lower = model.toLowerCase();
  if (lower.includes("qwen") || lower.includes("llama") || lower.includes("local")) {
    return ((tokensIn + tokensOut) / 1_000_000) * 1;
  }
  return ((tokensIn + tokensOut) / 1_000_000) * 3;
}
