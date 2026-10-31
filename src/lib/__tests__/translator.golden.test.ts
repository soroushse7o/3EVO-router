import { describe, it, expect } from 'vitest';
import {
  openaiToAnthropic,
  anthropicToOpenAI,
  openaiToGemini,
  geminiToOpenAI,
  responsesToChat,
  toCanonical,
  fromCanonicalOpenAI,
} from '@/lib/translator';

describe('Translator Golden Tests', () => {
  // ===== OpenAI -> Anthropic =====
  it('OpenAI -> Anthropic basic text', () => {
    const openai = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Hello" },
      ],
    };
    const result = openaiToAnthropic(openai);
    expect(result.system).toBe("You are helpful");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content[0].text).toBe("Hello");
  });

  it('OpenAI -> Anthropic with tool calls', () => {
    const openai = {
      model: "gpt-4",
      messages: [{
        role: "assistant",
        tool_calls: [{ id: "call_1", type: "function", function: { name: "get_weather", arguments: '{"city":"NYC"}' } }],
      }],
    };
    const result = openaiToAnthropic(openai);
    expect(result.messages[0].tool_calls).toBeDefined();
    expect(result.messages[0].tool_calls[0].name).toBe("get_weather");
    expect(result.messages[0].tool_calls[0].input).toEqual({ city: "NYC" });
  });

  it('OpenAI -> Anthropic with images', () => {
    const openai = {
      model: "gpt-4-vision",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "What's this?" },
          { type: "image_url", image_url: { url: "data:image/png;base64,ABC123" } },
        ],
      }],
    };
    const result = openaiToAnthropic(openai);
    expect(result.messages[0].content).toHaveLength(2);
    expect(result.messages[0].content[0].type).toBe("text");
    expect(result.messages[0].content[1].type).toBe("image");
  });

  // ===== Anthropic -> OpenAI =====
  it('Anthropic -> OpenAI basic text', () => {
    const anthropic = {
      id: "msg_1",
      content: [{ type: "text", text: "Hello there!" }],
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    };
    const result = anthropicToOpenAI(anthropic);
    expect(result.choices[0].message.content).toBe("Hello there!");
    expect(result.usage.prompt_tokens).toBe(10);
    expect(result.usage.completion_tokens).toBe(5);
  });

  it('Anthropic -> OpenAI with tool use', () => {
    const anthropic = {
      id: "msg_1",
      content: [
        { type: "text", text: "I'll check" },
        { type: "tool_use", id: "tool_1", name: "get_weather", input: { city: "NYC" } },
      ],
      stop_reason: "tool_use",
      usage: { input_tokens: 10, output_tokens: 20 },
    };
    const result = anthropicToOpenAI(anthropic);
    expect(result.choices[0].message.content).toBeNull();
    expect(result.choices[0].message.tool_calls).toHaveLength(1);
    expect(result.choices[0].message.tool_calls[0].function.name).toBe("get_weather");
    expect(result.choices[0].finish_reason).toBe("tool_calls");
  });

  // ===== OpenAI -> Gemini =====
  it('OpenAI -> Gemini basic', () => {
    const openai = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "System prompt" },
        { role: "user", content: "Hello" },
      ],
    };
    const result = openaiToGemini(openai);
    expect(result.systemInstruction).toBeDefined();
    expect(result.systemInstruction?.parts[0].text).toBe("System prompt");
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].role).toBe("user");
    expect(result.contents[0].parts[0].text).toBe("Hello");
  });

  // ===== Gemini -> OpenAI =====
  it('Gemini -> OpenAI basic', () => {
    const gemini = {
      id: "gem_1",
      candidates: [{
        content: { parts: [{ text: "Hello from Gemini" }] },
        finishReason: "STOP",
      }],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, totalTokenCount: 8 },
    };
    const result = geminiToOpenAI(gemini);
    expect(result.choices[0].message.content).toBe("Hello from Gemini");
    expect(result.usage.total_tokens).toBe(8);
  });

  // ===== Responses API -> Chat =====
  it('Responses -> Chat simple', () => {
    const responses = {
      model: "gpt-4",
      input: "Hello world",
      max_output_tokens: 100,
    };
    const result = responsesToChat(responses);
    expect(result.messages[0].content).toBe("Hello world");
    expect(result.max_tokens).toBe(100);
  });

  // ===== Canonical roundtrip =====
  it('Canonical roundtrip OpenAI', () => {
    const openai = {
      messages: [
        { role: "system", content: "System" },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
    };
    const canonical = toCanonical(openai);
    const back = fromCanonicalOpenAI(canonical);
    expect(back.messages).toHaveLength(3);
    expect(back.messages[0].role).toBe("system");
    expect(back.messages[1].content).toBe("Hello");
  });

  it('Canonical preserves tool calls', () => {
    const openai = {
      messages: [{
        role: "assistant",
        tool_calls: [{ id: "call_1", type: "function", function: { name: "fn", arguments: '{"a":1}' } }],
      }],
    };
    const canonical = toCanonical(openai);
    expect(canonical[0].tool_calls!).toHaveLength(1);
    expect(canonical[0].tool_calls![0].function.name).toBe("fn");
  });
});
