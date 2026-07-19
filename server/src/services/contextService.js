const RECENT_MESSAGE_LIMIT = 4;

export function buildPrompt(brand, newMessage) {
  const stateJson = JSON.stringify(brand.state ?? {}, null, 2);

  const recentMessages = (brand.messages ?? [])
    .slice(-RECENT_MESSAGE_LIMIT)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  return `You are a branding assistant helping a user develop a brand concept through
conversation. You must always respond with a single valid JSON object and
nothing else — no markdown, no commentary outside the JSON.

Current brand state:
${stateJson}

Recent conversation:
${recentMessages || "(none yet)"}

The user's new message: "${newMessage}"

Update the brand concept based on this new message, building on the
existing state rather than starting over — unless the user clearly wants
to pivot. Return exactly this JSON shape:

{
  "reply": "<a short, natural conversational reply to the user, explaining or presenting the update>",
  "state": {
    "brandName": "<updated or unchanged brand name>",
    "tagline": "<updated or unchanged tagline>",
    "targetAudience": "<updated or unchanged target audience>",
    "tone": "<updated or unchanged tone, e.g. premium, playful, minimal>",
    "keywords": ["<updated or unchanged keyword list>"]
  }
}`;
}
