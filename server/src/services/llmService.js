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

function isValidResult(parsed) {
  if (!parsed?.reply || typeof parsed.reply !== "string") return false;
  if (!parsed.state || typeof parsed.state !== "object") return false;

  const { brandName, tagline, targetAudience } = parsed.state;
  return (
    typeof brandName === "string" &&
    brandName.trim() &&
    typeof tagline === "string" &&
    tagline.trim() &&
    typeof targetAudience === "string" &&
    targetAudience.trim()
  );
}

async function callGroq({ system, user }, { strict = false } = {}) {
  const groq = getGroqClient();

  const systemContent = strict
    ? `${system}\n\nIMPORTANT: Return ONLY a valid JSON object. brandName, tagline, and targetAudience must be non-empty strings.`
    : system;

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return completion.choices[0]?.message?.content ?? "";
}

function fallbackResult(brand) {
  const current = brand.state?.toObject?.() ?? brand.state ?? {};
  return {
    reply:
      "I had trouble updating the brand just now. Please try your message again.",
    state: current,
  };
}

/**
 * Calls Groq and returns { reply, state }.
 * Retries once on parse/validation failure; returns a safe fallback if still invalid.
 */
export async function generateBrandUpdate(prompt, brand) {
  try {
    const raw = await callGroq(prompt);
    const parsed = parseLlmJson(raw);

    if (!isValidResult(parsed)) {
      throw new Error("Invalid or incomplete LLM JSON");
    }

    return { reply: parsed.reply, state: parsed.state };
  } catch (firstErr) {
    console.warn("LLM parse/call failed, retrying once:", firstErr.message);

    try {
      const raw = await callGroq(prompt, { strict: true });
      const parsed = parseLlmJson(raw);

      if (!isValidResult(parsed)) {
        throw new Error("Invalid or incomplete LLM JSON on retry");
      }

      return { reply: parsed.reply, state: parsed.state };
    } catch (retryErr) {
      console.error("LLM retry failed:", retryErr.message);
      return fallbackResult(brand);
    }
  }
}
