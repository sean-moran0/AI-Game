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

// Serve the installed Leaflet library (CSS, JS, marker images)
app.use("/leaflet", express.static(path.join(__dirname, "../node_modules/leaflet/dist")));

// Serve the installed simplex-noise ESM build for the map generator
app.use("/simplex-noise", express.static(path.join(__dirname, "../node_modules/simplex-noise/dist/esm")));

// Serve jQuery (loaded as a global <script> on every page)
app.use("/jquery", express.static(path.join(__dirname, "../node_modules/jquery/dist")));

// Serve Bootstrap's compiled CSS + JS bundle (Popper included)
app.use("/bootstrap", express.static(path.join(__dirname, "../node_modules/bootstrap/dist")));

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
