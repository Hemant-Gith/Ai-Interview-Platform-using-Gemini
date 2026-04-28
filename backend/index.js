import dotenv from "dotenv";
dotenv.config({ quiet: true });

import path from "node:path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/database-config.js";

import {
  evaluateUserAnswer,
  generateConceptExplanation,
  generateInterviewQuestions,
  generateSimulationFeedback,
  regenerateSingleQuestion,
} from "./controller/ai-controller.js";

import { protect } from "./middlewares/auth-middleware.js";
import authRoutes from "./routes/auth-route.js";
import authSessions from "./routes/session-route.js";

connectDB();

const app = express();

/* FIX for __dirname in ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* PORT safety */
const PORT = process.env.PORT || 5000;

/* CORS */
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-interview-prep-kwfpbg3d0-sarveshs-projects-eba40f12.vercel.app",
  "https://ai-interview-prep-app-git-main-sarveshs-projects-eba40f12.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/* Routes */
app.use("/api/auth", authRoutes);
app.use("/api/sessions", authSessions);

app.use("/api/ai/generate-questions", protect, generateInterviewQuestions);
app.use("/api/ai/generate-explanation", protect, generateConceptExplanation);
app.use("/api/ai/regenerate-question", protect, regenerateSingleQuestion);
app.use("/api/ai/evaluate-answer", protect, evaluateUserAnswer);
app.use("/api/ai/simulation-feedback", protect, generateSimulationFeedback);

/* Static uploads */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ status: "backend is working 🚀" });
});

/* Server start */
app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});