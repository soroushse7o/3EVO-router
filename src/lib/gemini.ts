export function openaiToGemini(body: any) {
  const contents = (body.messages || []).map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));
  return { contents, generationConfig: { maxOutputTokens: body.max_tokens } };
}
export function geminiToOpenAI(resp: any) {
  const text = resp.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  return { object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }] };
}
