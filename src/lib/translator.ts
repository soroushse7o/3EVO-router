// Universal format translator
export type CanonicalMessage = { role: "system" | "user" | "assistant" | "tool"; content: string };
export function toCanonical(openaiBody: any): CanonicalMessage[] {
  return (openaiBody?.messages || []).map((m: any) => ({ role: m.role, content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }));
}
export function fromCanonicalOpenAI(msgs: CanonicalMessage[]) {
  return { messages: msgs };
}
export function openaiToAnthropic(body: any) {
  const messages = (body.messages || []).map((m: any) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: typeof m.content === "string" ? m.content : (m.content?.map((c: any) => c.text || c).join("") || ""),
  }));
  return { model: body.model, max_tokens: body.max_tokens || 1024, messages, system: body.messages?.find((m: any) => m.role === "system")?.content };
}
export function anthropicToOpenAI(resp: any) {
  const text = resp.content?.map((c: any) => c.text).join("") || "";
  return { id: resp.id, object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: resp.stop_reason || "stop" }], usage: { prompt_tokens: resp.usage?.input_tokens || 0, completion_tokens: resp.usage?.output_tokens || 0, total_tokens: (resp.usage?.input_tokens || 0) + (resp.usage?.output_tokens || 0) } };
}
