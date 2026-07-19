const RECENT_MESSAGE_LIMIT = 4;

const SYSTEM_PROMPT = `You are a branding assistant helping a user develop a brand concept through conversation.

You must always respond with a single valid JSON object and nothing else — no markdown, no commentary outside the JSON.

Your job every turn:
1. Propose or refine a concrete brandName, tagline, and targetAudience.
2. Keep tone and keywords aligned with the conversation.
3. Build on the existing brand state — do not reset fields unless the user clearly wants a pivot.
4. Never leave brandName, tagline, or targetAudience as empty strings once you have enough direction (even a short cue like "fitness brand" is enough to invent a strong first draft).
5. When the user says something like "make it more premium", refine the EXISTING name/tagline/audience/tone — do not wipe them.

Return exactly this JSON shape:
{
  "reply": "<short natural conversational reply presenting the update>",
  "state": {
    "brandName": "<concrete brand name>",
    "tagline": "<concrete tagline>",
    "targetAudience": "<concrete target audience>",
    "tone": "<tone, e.g. premium, playful, minimal>",
    "keywords": ["keyword1", "keyword2"]
  }
}`;

export function buildPrompt(brand, newMessage) {
  const state = brand.state?.toObject?.() ?? brand.state ?? {};
  const stateJson = JSON.stringify(state, null, 2);

  const recentMessages = (brand.messages ?? [])
    .slice(-RECENT_MESSAGE_LIMIT)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const userContent = `Brand label (user-created workspace name): "${brand.name}"

Current brand state:
${stateJson}

Recent conversation:
${recentMessages || "(none yet)"}

The user's new message: "${newMessage}"

Update the brand concept based on this message. Always return filled brandName, tagline, and targetAudience in state.`;

  return {
    system: SYSTEM_PROMPT,
    user: userContent,
  };
}
