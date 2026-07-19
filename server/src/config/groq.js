import Groq from "groq-sdk";

let client = null;

export function getGroqClient() {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  client = new Groq({ apiKey });
  return client;
}
