// Universal format translator - OpenAI, Anthropic, Gemini, Responses

export type CanonicalMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | CanonicalContent[];
  tool_calls?: CanonicalToolCall[];
  tool_call_id?: string;
  name?: string;
};

export type CanonicalContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: string } }
  | { type: "tool_result"; tool_call_id: string; content: string };

export type CanonicalToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

// ===== Canonical <-> OpenAI =====

export function toCanonical(openaiBody: any): CanonicalMessage[] {
  return (openaiBody?.messages || []).map((m: any) => ({
    role: m.role,
    content: normalizeContent(m.content),
    tool_calls: m.tool_calls?.map((tc: any) => ({
      id: tc.id,
      type: "function",
      function: { name: tc.function.name, arguments: tc.function.arguments },
    })),
    tool_call_id: m.tool_call_id,
    name: m.name,
  }));
}

function normalizeContent(content: any): string | CanonicalContent[] {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => {
      if (c.type === "text") return { type: "text", text: c.text };
      if (c.type === "image_url") return { type: "image_url", image_url: c.image_url };
      if (c.type === "tool_result") return { type: "tool_result", tool_call_id: c.tool_call_id, content: c.content };
      return { type: "text", text: JSON.stringify(c) };
    });
  }
  return String(content ?? "");
}

export function fromCanonicalOpenAI(msgs: CanonicalMessage[]) {
  return {
    messages: msgs.map((m) => ({
      role: m.role,
      content: Array.isArray(m.content) ? m.content.map(c => c.type === "tool_result" ? { type: "text", text: c.content } : c) : m.content,
      tool_calls: m.tool_calls,
      tool_call_id: m.tool_call_id,
      name: m.name,
    })),
  };
}

// ===== OpenAI -> Anthropic =====

export function openaiToAnthropic(body: any) {
  const messages = (body.messages || []).map((m: any) => {
    if (m.role === "system") return null; // handled separately
    if (m.role === "tool") {
      return { role: "user", content: [{ type: "tool_result", tool_use_id: m.tool_call_id, content: m.content }] };
    }
    return {
      role: m.role === "assistant" ? "assistant" : "user",
      content: Array.isArray(m.content) ? m.content.map((c: any) =>
        c.type === "text" ? { type: "text", text: c.text } :
        c.type === "image_url" ? { type: "image", source: { type: "base64", media_type: "image/jpeg", data: c.image_url?.url?.split(",")[1] || "" } } :
        { type: "text", text: JSON.stringify(c) }
      ) : [{ type: "text", text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
      ...(m.tool_calls ? { tool_calls: m.tool_calls.map((tc: any) => ({ id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments) })) } : {}),
    };
  }).filter(Boolean);

  return {
    model: body.model,
    max_tokens: body.max_tokens || 1024,
    messages,
    system: body.messages?.find((m: any) => m.role === "system")?.content,
    tools: body.tools?.map((t: any) => ({ name: t.function.name, description: t.function.description, input_schema: t.function.parameters })),
    tool_choice: body.tool_choice,
  };
}

// ===== Anthropic -> OpenAI =====

export function anthropicToOpenAI(resp: any) {
  const content = resp.content?.filter((c: any) => c.type === "text").map((c: any) => c.text).join("") || "";
  const toolCalls = resp.content?.filter((c: any) => c.type === "tool_use").map((c: any) => ({
    id: c.id,
    type: "function",
    function: { name: c.name, arguments: JSON.stringify(c.input) },
  }));

  return {
    id: resp.id,
    object: "chat.completion",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: toolCalls?.length ? null : content,
        tool_calls: toolCalls?.length ? toolCalls : undefined,
      },
      finish_reason: resp.stop_reason === "tool_use" ? "tool_calls" : (resp.stop_reason || "stop"),
    }],
    usage: {
      prompt_tokens: resp.usage?.input_tokens || 0,
      completion_tokens: resp.usage?.output_tokens || 0,
      total_tokens: (resp.usage?.input_tokens || 0) + (resp.usage?.output_tokens || 0),
    },
  };
}

// ===== OpenAI -> Gemini =====

export function openaiToGemini(body: any) {
  const contents = (body.messages || []).map((m: any) => {
    if (m.role === "system") return null;
    if (m.role === "tool") {
      return {
        role: "function",
        parts: [{ functionResponse: { name: m.name || "function", response: { content: m.content } } }],
      };
    }
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: Array.isArray(m.content)
        ? m.content.map((c: any) =>
            c.type === "text" ? { text: c.text } :
            c.type === "image_url" ? { inlineData: { mimeType: "image/jpeg", data: c.image_url?.url?.split(",")[1] || "" } } :
            { text: JSON.stringify(c) }
          )
        : [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
    };
  }).filter(Boolean);

  return {
    contents,
    systemInstruction: body.messages?.find((m: any) => m.role === "system") ? { parts: [{ text: body.messages.find((m: any) => m.role === "system").content }] } : undefined,
    generationConfig: {
      maxOutputTokens: body.max_tokens,
      temperature: body.temperature,
      topP: body.top_p,
      candidateCount: 1,
    },
    tools: body.tools?.map((t: any) => ({ functionDeclarations: [{ name: t.function.name, description: t.function.description, parameters: t.function.parameters }] })),
    toolConfig: body.tool_choice ? { functionCallingConfig: { mode: body.tool_choice === "auto" ? "AUTO" : "ANY", allowedFunctionNames: body.tool_choice === "auto" ? undefined : [body.tool_choice.function?.name] } } : undefined,
  };
}

// ===== Gemini -> OpenAI =====

export function geminiToOpenAI(resp: any) {
  const candidate = resp.candidates?.[0];
  const content = candidate?.content?.parts?.filter((p: any) => p.text).map((p: any) => p.text).join("") || "";
  const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => ({
    id: `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: "function",
    function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args) },
  }));

  return {
    id: resp.id || `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: functionCalls?.length ? null : content,
        tool_calls: functionCalls?.length ? functionCalls : undefined,
      },
      finish_reason: candidate?.finishReason === "FUNCTION_CALL" ? "tool_calls" : (candidate?.finishReason?.toLowerCase() || "stop"),
    }],
    usage: {
      prompt_tokens: resp.usageMetadata?.promptTokenCount || 0,
      completion_tokens: resp.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: resp.usageMetadata?.totalTokenCount || 0,
    },
  };
}

// ===== OpenAI Responses API -> OpenAI Chat =====

export function responsesToChat(body: any) {
  const input = typeof body.input === "string" ? body.input : (body.input?.map?.((i: any) => i.content?.map?.((c: any) => c.text).join("")).join("\n") || "");
  return {
    model: body.model,
    messages: [{ role: "user", content: input }],
    max_tokens: body.max_output_tokens,
    temperature: body.temperature,
    top_p: body.top_p,
  };
}

// ===== Streaming chunk translators =====

export function openaiStreamToAnthropic(chunk: any) {
  // OpenAI streaming delta -> Anthropic streaming format
  // This is a placeholder - actual implementation depends on exact stream formats
  return chunk;
}

export function anthropicStreamToOpenAI(chunk: any) {
  // Anthropic streaming -> OpenAI streaming format
  return chunk;
}

// ===== Adapter helpers =====
export function toOpenAICompatible(body: any, provider: string): any {
  if (provider === "ollama") {
    return { ...body, model: body.model || "llama3", stream: body.stream ?? false };
  }
  if (provider === "cursor" || provider === "kiro" || provider === "antigravity") {
    return { ...body, model: body.model || "default", stream: body.stream ?? false };
  }
  if (provider === "vertex") {
    return { ...body, model: body.model?.replace("vertex/", "") || "gemini-1.5-pro", stream: body.stream ?? false };
  }
  return body;
}

export function fromOpenAICompatible(resp: any, provider: string): any {
  if (provider === "ollama" || provider === "cursor" || provider === "kiro" || provider === "antigravity") {
    return resp;
  }
  if (provider === "vertex") {
    return { ...resp, model: "vertex/" + (resp.model || "") };
  }
  return resp;
}
