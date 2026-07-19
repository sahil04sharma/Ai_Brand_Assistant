import express from "express";
import cors from "cors";
import brandRoutes from "./routes/brandRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

function normalizeOrigin(origin) {
  return origin ? origin.replace(/\/$/, "") : origin;
}

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-brand-assistant-seven.vercel.app",
  process.env.CLIENT_ORIGIN,
]
  .filter(Boolean)
  .map(normalizeOrigin);

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) have no Origin
      if (!origin) {
        return callback(null, true);
      }

      const normalized = normalizeOrigin(origin);

      // If CLIENT_ORIGIN is unset, reflect any origin (local demos)
      if (!process.env.CLIENT_ORIGIN) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/brands", brandRoutes);
app.use("/chat", chatRoutes);

export default app;
