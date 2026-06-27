import 'dotenv/config';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { sendMessage } from "./claude.js";
import type { ConversationMessage } from "./claude.js";
import { systemPrompt } from "./systemPrompt.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Required for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the public folder
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body as { messages: ConversationMessage[] };
    const response = await sendMessage(messages, systemPrompt);
    res.json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get response from Claude" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
