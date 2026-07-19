import express from "express";
import cors from "cors";
import brandRoutes from "./routes/brandRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

// Allow browser calls from a separate frontend origin (local Vite or deployed UI)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
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
