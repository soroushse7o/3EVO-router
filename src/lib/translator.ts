// Universal format translator (stub): canonical format placeholder
export type CanonicalMessage = { role: "system" | "user" | "assistant" | "tool"; content: string };
export function toCanonical(openaiBody: any): CanonicalMessage[] {
  return (openaiBody?.messages || []).map((m: any) => ({ role: m.role, content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }));
}
export function fromCanonicalOpenAI(msgs: CanonicalMessage[]) {
  return { messages: msgs };
}
