import { getGroqClient } from "../config/groq.js";

const MODEL = "llama-3.3-70b-versatile";

function stripMarkdownFences(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function parseLlmJson(raw) {
  return JSON.parse(stripMarkdownFences(raw));
}

async function callGroq(prompt, { strict = false } = {}) {
  const groq = getGroqClient();

  const content = strict
    ? `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. No markdown fences, no extra text.`
    : prompt;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content },
      { role: "user", content: "Respond with the JSON object now." },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return completion.choices[0]?.message?.content ?? "";
}

function fallbackResult(brand) {
  return {
    reply:
      "I had trouble updating the brand just now. Please try your message again.",
    state: brand.state ?? {},
  };
}

/**
 * Calls Groq and returns { reply, state }.
 * Retries once on parse failure; returns a safe fallback if still invalid.
 */
export async function generateBrandUpdate(prompt, brand) {
  try {
    const raw = await callGroq(prompt);
    const parsed = parseLlmJson(raw);

    if (!parsed.reply || typeof parsed.reply !== "string") {
      throw new Error("Missing reply field");
    }

    return {
      reply: parsed.reply,
      state: parsed.state && typeof parsed.state === "object" ? parsed.state : {},
    };
  } catch (firstErr) {
    console.warn("LLM parse/call failed, retrying once:", firstErr.message);

    try {
      const raw = await callGroq(prompt, { strict: true });
      const parsed = parseLlmJson(raw);

      if (!parsed.reply || typeof parsed.reply !== "string") {
        throw new Error("Missing reply field on retry");
      }

      return {
        reply: parsed.reply,
        state: parsed.state && typeof parsed.state === "object" ? parsed.state : {},
      };
    } catch (retryErr) {
      console.error("LLM retry failed:", retryErr.message);
      return fallbackResult(brand);
    }
  }
}
