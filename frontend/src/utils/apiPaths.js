/*
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const API_PATHS = {
  AUTH: {
  LOGIN: `${BASE_URL}/api/auth/login`,
  SIGNUP: `${BASE_URL}/api/auth/register`,
  },
  SESSION: {
    CREATE: `${BASE_URL}/sessions/create`,
    GET_ALL: `${BASE_URL}/sessions/my-sessions`,
    GET_ONE: `${BASE_URL}/sessions`,
    DELETE: `${BASE_URL}/sessions`,
    SAVE: `${BASE_URL}/sessions`,            // + /:id/save
    PIN_QUESTION: `${BASE_URL}/sessions/questions`,
    NOTE_QUESTION: `${BASE_URL}/sessions/questions`,
  },
  AI: {
    GENERATE_QUESTIONS: `${BASE_URL}/ai/generate-questions`,
    EXPLAIN: `${BASE_URL}/ai/generate-explanation`,
    REGENERATE_QUESTION: `${BASE_URL}/ai/regenerate-question`,
    EVALUATE_ANSWER: `${BASE_URL}/ai/evaluate-answer`,
    SIMULATION_FEEDBACK: `${BASE_URL}/ai/simulation-feedback`,
  },
};
*/

const BASE_URL = ""; // IMPORTANT: keep empty because axiosInstance already has /api

export const API_PATHS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/register",
  },

  SESSION: {
    CREATE: "/sessions/create",
    GET_ALL: "/sessions/my-sessions",
    GET_ONE: "/sessions",
    DELETE: "/sessions",
    SAVE: "/sessions",
    PIN_QUESTION: "/sessions/questions",
    NOTE_QUESTION: "/sessions/questions",
  },

  AI: {
    GENERATE_QUESTIONS: "/ai/generate-questions",
    EXPLAIN: "/ai/generate-explanation",
    REGENERATE_QUESTION: "/ai/regenerate-question",
    EVALUATE_ANSWER: "/ai/evaluate-answer",
    SIMULATION_FEEDBACK: "/ai/simulation-feedback",
  },
};