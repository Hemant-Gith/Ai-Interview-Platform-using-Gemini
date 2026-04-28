import express from "express";
import {
  createSession,
  getMySessions,
  getSessionById,
  deleteSession,
  togglePinQuestion,
  updateQuestionNote,
  toggleSaveSession,
} from "../controller/session-controller.js";
import { protect } from "../middlewares/auth-middleware.js";

const router = express.Router();

router.post("/create", protect, createSession);
router.get("/my-sessions", protect, getMySessions);

// specific routes before wildcard /:id
router.patch("/questions/:questionId/pin", protect, togglePinQuestion);
router.patch("/questions/:questionId/note", protect, updateQuestionNote);

router.get("/:id", protect, getSessionById);
router.delete("/:id", protect, deleteSession);
router.patch("/:id/save", protect, toggleSaveSession);

export default router;
