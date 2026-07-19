import Brand from "../models/Brand.js";
import { buildPrompt } from "../services/contextService.js";
import { generateBrandUpdate } from "../services/llmService.js";

function mergeState(current, incoming) {
  if (!incoming || typeof incoming !== "object") return current;

  const next = {
    brandName: current.brandName || "",
    tagline: current.tagline || "",
    targetAudience: current.targetAudience || "",
    tone: current.tone || "",
    keywords: Array.isArray(current.keywords) ? [...current.keywords] : [],
  };

  for (const key of ["brandName", "tagline", "targetAudience", "tone"]) {
    if (typeof incoming[key] !== "string") continue;
    const value = incoming[key].trim();
    // Never wipe an existing value with an empty LLM field
    if (!value) continue;
    next[key] = value;
  }

  if (Array.isArray(incoming.keywords)) {
    const keywords = incoming.keywords
      .filter((k) => typeof k === "string" && k.trim())
      .map((k) => k.trim());
    if (keywords.length > 0) {
      next.keywords = keywords;
    }
  }

  return next;
}

export async function chat(req, res) {
  try {
    const { brand_id, message } = req.body;

    if (!brand_id) {
      return res.status(400).json({ message: "brand_id is required" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const brand = await Brand.findById(brand_id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const userMessage = message.trim();
    const prompt = buildPrompt(brand, userMessage);
    const { reply, state } = await generateBrandUpdate(prompt, brand);

    brand.messages.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: reply }
    );

    const currentState = brand.state?.toObject?.() ?? brand.state;
    brand.state = mergeState(currentState, state);
    brand.markModified("state");

    await brand.save();

    return res.json({ response: reply });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Brand not found" });
    }
    console.error("chat error:", err.message);
    return res.status(500).json({ message: "Failed to process chat" });
  }
}
