/*

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import Question from "../models/question-model.js";
import Session from "../models/session-model.js";
import {
  conceptExplainPrompt,
  evaluateAnswerPrompt,
  questionAnswerPrompt,
  regenerateQuestionPrompt,
  simulationFeedbackPrompt,
} from "../utils/prompts-util.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const parseJSON = (text) => {
  const cleaned = text
    .replace(/^```json\s*/
    /*
    , "")
    .replace(/^```\s*/
    /*
    , "")
    .replace(/```$/, "")
    .replace(/^json\s*/
    /*
    , "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    throw new Error("Failed to parse AI response as JSON");
  }
};

// @desc    Generate + SAVE interview questions for a session
// @route   POST /api/ai/generate-questions
// @access  Private
export const generateInterviewQuestions = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ success: false, message: "sessionId is required" });

    const session = await Session.findById(sessionId);
    if (!session)
      return res.status(404).json({ success: false, message: "Session not found" });
    if (session.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const { role, experience, topicsToFocus, description } = session;

    const prompt = questionAnswerPrompt(role, experience, topicsToFocus, 10, description);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const rawText = parts
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("");

    const questions = parseJSON(rawText);
    if (!Array.isArray(questions)) throw new Error("Response is not an array");

    const saved = await Question.insertMany(
      questions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer || "",
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
        note: "",
        isPinned: false,
      })),
    );

    session.questions.push(...saved.map((q) => q._id));
    await session.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to generate questions", error: error.message });
  }
};

// @desc    Generate explanation for an interview question
// @route   POST /api/ai/generate-explanation
// @access  Private
export const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question)
      return res.status(400).json({ success: false, message: "Question is required" });

    const prompt = conceptExplainPrompt(question);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const explanation = parseJSON(response.text);
    if (!explanation.title || !explanation.explanation)
      throw new Error("Response missing required fields: title and explanation");

    res.status(200).json({ success: true, data: explanation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to generate explanation", error: error.message });
  }
};

// @desc    Regenerate a single question
// @route   POST /api/ai/regenerate-question
// @access  Private
export const regenerateSingleQuestion = async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId)
      return res.status(400).json({ success: false, message: "questionId is required" });

    const question = await Question.findById(questionId).populate("session");
    if (!question)
      return res.status(404).json({ success: false, message: "Question not found" });

    const session = question.session;
    if (session.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Get existing questions to avoid repeats
    const allQuestions = await Question.find({ session: session._id });
    const existingTexts = allQuestions.map((q) => q.question);

    const prompt = regenerateQuestionPrompt(
      session.role,
      session.experience,
      session.topicsToFocus,
      existingTexts,
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const newQ = parseJSON(response.text);
    if (!newQ.question || !newQ.answer)
      throw new Error("Response missing required fields");

    question.question = newQ.question;
    question.answer = newQ.answer;
    question.difficulty = ["easy", "medium", "hard"].includes(newQ.difficulty)
      ? newQ.difficulty
      : "medium";
    question.note = "";
    await question.save();

    res.status(200).json({ success: true, data: question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to regenerate question", error: error.message });
  }
};

// @desc    Evaluate a user's written answer against the model answer
// @route   POST /api/ai/evaluate-answer
// @access  Private
export const evaluateUserAnswer = async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    if (!questionId || !userAnswer?.trim())
      return res.status(400).json({ success: false, message: "questionId and userAnswer are required" });

    const question = await Question.findById(questionId).populate("session");
    if (!question)
      return res.status(404).json({ success: false, message: "Question not found" });

    if (question.session.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const prompt = evaluateAnswerPrompt(question.question, question.answer, userAnswer);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const evaluation = parseJSON(response.text);
    if (typeof evaluation.score !== "number")
      throw new Error("Response missing required field: score");

    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to evaluate answer", error: error.message });
  }
};

// @desc    Generate simulation feedback after completing all questions
// @route   POST /api/ai/simulation-feedback
// @access  Private
export const generateSimulationFeedback = async (req, res) => {
  try {
    const { sessionId, results } = req.body;
    // results = [{ question, score, verdict }, ...]
    if (!sessionId || !Array.isArray(results) || results.length === 0)
      return res.status(400).json({ success: false, message: "sessionId and results array are required" });

    const session = await Session.findById(sessionId);
    if (!session)
      return res.status(404).json({ success: false, message: "Session not found" });
    if (session.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    const prompt = simulationFeedbackPrompt(session.role, results);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const feedback = parseJSON(response.text);
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to generate feedback", error: error.message });
  }
};*/

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import Question from "../models/question-model.js";
import Session from "../models/session-model.js";
import {
  conceptExplainPrompt,
  evaluateAnswerPrompt,
  questionAnswerPrompt,
  regenerateQuestionPrompt,
  simulationFeedbackPrompt,
} from "../utils/prompts-util.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// ================================
// SAFE GEMINI RESPONSE EXTRACTOR
// ================================
const getAIText = (response) => {
  try {
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    return parts
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("")
      .trim();
  } catch {
    return "";
  }
};


// ================================
// SAFE JSON PARSER
// ================================
const parseJSON = (text) => {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Invalid JSON from AI: " + cleaned);
  }
};


// ================================
// GENERATE QUESTIONS
// ================================
export const generateInterviewQuestions = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const prompt = questionAnswerPrompt(
      session.role,
      session.experience,
      session.topicsToFocus,
      10,
      session.description
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = getAIText(response);
    const questions = parseJSON(rawText);

    if (!Array.isArray(questions)) {
      throw new Error("AI did not return array");
    }

    const saved = await Question.insertMany(
      questions.map((q) => ({
        session: sessionId,
        question: q.question,
        answer: q.answer || "",
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty)
          ? q.difficulty
          : "medium",
        note: "",
        isPinned: false,
      }))
    );

    session.questions.push(...saved.map((q) => q._id));
    await session.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};


// ================================
// EXPLANATION
// ================================
export const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    const prompt = conceptExplainPrompt(question);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const rawText = getAIText(response);
    const explanation = parseJSON(rawText);

    if (!explanation.title || !explanation.explanation) {
      throw new Error("Invalid explanation format");
    }

    res.json({ success: true, data: explanation });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};


// ================================
// REGENERATE QUESTION
// ================================
export const regenerateSingleQuestion = async (req, res) => {
  try {
    const { questionId } = req.body;

    const question = await Question.findById(questionId).populate("session");

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const session = question.session;

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const allQuestions = await Question.find({ session: session._id });
    const existingTexts = allQuestions.map((q) => q.question);

    const prompt = regenerateQuestionPrompt(
      session.role,
      session.experience,
      session.topicsToFocus,
      existingTexts
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const rawText = getAIText(response);
    const newQ = parseJSON(rawText);

    question.question = newQ.question;
    question.answer = newQ.answer || "";
    question.difficulty = ["easy", "medium", "hard"].includes(newQ.difficulty)
      ? newQ.difficulty
      : "medium";

    question.note = "";

    await question.save();

    res.json({ success: true, data: question });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate question",
      error: error.message,
    });
  }
};


// ================================
// EVALUATION
// ================================
export const evaluateUserAnswer = async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;

    const question = await Question.findById(questionId).populate("session");

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    if (question.session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const prompt = evaluateAnswerPrompt(
      question.question,
      question.answer,
      userAnswer
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const rawText = getAIText(response);
    const evaluation = parseJSON(rawText);

    if (typeof evaluation.score !== "number") {
      throw new Error("Invalid evaluation format");
    }

    res.json({ success: true, data: evaluation });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to evaluate answer",
      error: error.message,
    });
  }
};


// ================================
// SIMULATION FEEDBACK
// ================================
export const generateSimulationFeedback = async (req, res) => {
  try {
    const { sessionId, results } = req.body;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const prompt = simulationFeedbackPrompt(session.role, results);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });

    const rawText = getAIText(response);
    const feedback = parseJSON(rawText);

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate feedback",
      error: error.message,
    });
  }
};