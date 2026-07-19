import express from "express";
import cors from "cors";
import brandRoutes from "./routes/brandRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/brands", brandRoutes);
app.use("/chat", chatRoutes);

export default app;
