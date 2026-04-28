import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import Navbar from "../components/Navbar";

// ─── Helpers ────────────────────────────────────────────────────────────────

const VERDICT_STYLES = {
  "Excellent":         { cls: "bg-green-50 text-green-700 border-green-300", icon: "🏆" },
  "Good":              { cls: "bg-blue-50 text-blue-700 border-blue-300",    icon: "👍" },
  "Needs Improvement": { cls: "bg-amber-50 text-amber-700 border-amber-300", icon: "📈" },
  "Insufficient":      { cls: "bg-red-50 text-red-700 border-red-300",       icon: "📚" },
};

const GRADE_STYLES = {
  A: "text-green-600 bg-green-50 border-green-300",
  B: "text-blue-600 bg-blue-50 border-blue-300",
  C: "text-amber-600 bg-amber-50 border-amber-300",
  D: "text-orange-600 bg-orange-50 border-orange-300",
  F: "text-red-600 bg-red-50 border-red-300",
};

const useCountdown = (seconds, onExpire) => {
  const [remaining, setRemaining] = useState(seconds);
  const timer = useRef(null);

  const start = useCallback(() => {
    setRemaining(seconds);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(timer.current); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [seconds, onExpire]);

  const stop = useCallback(() => clearInterval(timer.current), []);

  useEffect(() => () => clearInterval(timer.current), []);

  return { remaining, start, stop };
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ─── ScoreRing ───────────────────────────────────────────────────────────────

const ScoreRing = ({ score, size = 80 }) => {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#3b82f6" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" style={{ width: size, height: size }} className="-rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-800"
        style={{ fontSize: size * 0.18 }}>
        {score}/10
      </span>
    </div>
  );
};

// ─── SimulationResult ────────────────────────────────────────────────────────

const SimulationResult = ({ sessionId, results, role, onRestart }) => {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.post(API_PATHS.AI.SIMULATION_FEEDBACK, { sessionId, results });
        setFeedback(res.data.data);
      } catch {
        setFeedback(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const avg = results.length ? (results.reduce((a, r) => a + r.score, 0) / results.length).toFixed(1) : 0;

  return (
    <div className="max-w-3xl mx-auto pt-10 px-4 pb-20">
      <div className="text-center mb-8">
        <p className="text-4xl mb-2">🎉</p>
        <h1 className="text-2xl font-bold text-gray-900">Interview Complete!</h1>
        <p className="text-gray-500 text-sm mt-1">{role}</p>
      </div>

      {/* Per-question recap */}
      <div className="space-y-3 mb-8">
        {results.map((r, i) => {
          const vs = VERDICT_STYLES[r.verdict] || { cls: "bg-gray-50 text-gray-600 border-gray-200", icon: "•" };
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
              <ScoreRing score={r.score} size={52} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-snug truncate">Q{i + 1}: {r.question}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${vs.cls}`}>
                    {vs.icon} {r.verdict}
                  </span>
                  {r.suggestion && (
                    <span className="text-xs text-gray-400 truncate max-w-xs">{r.suggestion}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Overall Feedback */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
        ) : feedback ? (
          <>
            <div className="flex items-center gap-5 mb-5">
              <ScoreRing score={parseFloat(feedback.overallScore)} size={72} />
              <div>
                <span className={`text-2xl font-black px-3 py-1 rounded-lg border ${GRADE_STYLES[feedback.grade] || "text-gray-700 bg-gray-50 border-gray-200"}`}>
                  {feedback.grade}
                </span>
                <p className="text-sm font-semibold text-gray-800 mt-2">{feedback.headline}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {feedback.topStrengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">✅ Top Strengths</p>
                  <ul className="space-y-1">
                    {feedback.topStrengths.map((s, i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-green-500">•</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {feedback.areasToImprove?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">📈 Areas to Improve</p>
                  <ul className="space-y-1">
                    {feedback.areasToImprove.map((a, i) => <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-amber-500">•</span>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
            {feedback.finalAdvice && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-700 mb-1">💬 Interviewer's Advice</p>
                <p className="text-sm text-indigo-800">{feedback.finalAdvice}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400">
            <p className="text-2xl mb-1">📊</p>
            <p className="font-medium">Average Score: {avg}/10</p>
            <p className="text-sm mt-1">Completed {results.length} question{results.length !== 1 ? "s" : ""}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 justify-center flex-wrap">
        <button onClick={onRestart} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">
          🔁 Restart Simulation
        </button>
        <button onClick={() => navigate(`/interview/${sessionId}`)} className="bg-white border border-gray-200 hover:border-gray-400 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium transition">
          📚 Review All Answers
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const QUESTION_TIME = 120; // 2 min per question

const InterviewSimulation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulation state
  const [step, setStep] = useState("intro"); // intro | question | evaluating | result
  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [evaluating, setEvaluating] = useState(false);

  const handleTimeUp = useCallback(() => {
    if (step === "question") handleSubmitAnswer(true);
  }, [step, userAnswer, current]);

  const { remaining, start: startTimer, stop: stopTimer } = useCountdown(QUESTION_TIME, handleTimeUp);

  // Load session
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_PATHS.SESSION.GET_ONE}/${id}`);
        setSession(res.data.session);
        setQuestions(res.data.session?.questions || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const startSimulation = () => {
    setStep("question");
    setCurrent(0);
    setResults([]);
    setUserAnswer("");
    startTimer();
  };

  const handleSubmitAnswer = async (timedOut = false) => {
    stopTimer();
    setEvaluating(true);
    setStep("evaluating");

    const q = questions[current];
    let evalResult = { score: 0, verdict: "Insufficient", suggestion: "No answer provided.", strengths: [], gaps: ["No answer submitted"] };

    if (userAnswer.trim() && !timedOut) {
      try {
        const res = await axios.post(API_PATHS.AI.EVALUATE_ANSWER, { questionId: q._id, userAnswer });
        evalResult = res.data.data;
      } catch {
        evalResult = { score: 0, verdict: "Insufficient", suggestion: "Evaluation failed.", strengths: [], gaps: [] };
      }
    }

    const newResult = {
      question: q.question,
      score: evalResult.score ?? 0,
      verdict: evalResult.verdict ?? "Insufficient",
      suggestion: evalResult.suggestion ?? "",
      timedOut,
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    setEvaluating(false);

    if (current + 1 >= questions.length) {
      setStep("result");
    } else {
      setCurrent((prev) => prev + 1);
      setUserAnswer("");
      setStep("question");
      startTimer();
    }
  };

  // ── Loading / error ──────────────────────────────────────────────────────
  if (loading) return (
    <div><Navbar />
      <div className="max-w-3xl mx-auto pt-20 px-4 text-center text-gray-400">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div><Navbar />
      <div className="max-w-3xl mx-auto pt-20 px-4 text-center">
        <p className="text-red-500">{error}</p>
        <button onClick={() => navigate(`/interview/${id}`)} className="mt-4 text-sm text-indigo-500 underline">← Back to prep</button>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div><Navbar />
      <div className="max-w-3xl mx-auto pt-20 px-4 text-center text-gray-500">
        <p className="text-4xl mb-3">⚡</p>
        <p className="font-medium">No questions yet. Generate questions first.</p>
        <button onClick={() => navigate(`/interview/${id}`)} className="mt-4 text-sm text-indigo-500 underline">← Back to prep</button>
      </div>
    </div>
  );

  // ── Result screen ────────────────────────────────────────────────────────
  if (step === "result") return (
    <div><Navbar />
      <SimulationResult
        sessionId={id}
        results={results}
        role={session?.role || "Interview"}
        onRestart={startSimulation}
      />
    </div>
  );

  const q = questions[current];
  const timerPct = (remaining / QUESTION_TIME) * 100;
  const timerColor = remaining > 60 ? "#22c55e" : remaining > 30 ? "#f59e0b" : "#ef4444";

  // ── Intro screen ─────────────────────────────────────────────────────────
  if (step === "intro") return (
    <div><Navbar />
      <div className="max-w-2xl mx-auto pt-16 px-4 pb-20 text-center">
        <p className="text-5xl mb-4">🎙️</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Simulation</h1>
        <p className="text-gray-500 text-sm mb-6">
          {session?.role} · {questions.length} questions · {QUESTION_TIME / 60} min per question
        </p>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left space-y-3 mb-8 shadow-sm">
          <p className="text-sm font-semibold text-gray-700">How it works:</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span className="text-orange-500 font-bold">1.</span>One question shown at a time</li>
            <li className="flex gap-2"><span className="text-orange-500 font-bold">2.</span>You have {QUESTION_TIME / 60} minutes to type your answer</li>
            <li className="flex gap-2"><span className="text-orange-500 font-bold">3.</span>AI scores each answer (0–10) in real time</li>
            <li className="flex gap-2"><span className="text-orange-500 font-bold">4.</span>Final report + grade shown at the end</li>
          </ul>
        </div>
        <button onClick={startSimulation} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold text-sm transition">
          Start Simulation →
        </button>
        <div className="mt-4">
          <button onClick={() => navigate(`/interview/${id}`)} className="text-sm text-gray-400 hover:text-gray-600 underline">
            ← Back to prep mode
          </button>
        </div>
      </div>
    </div>
  );

  // ── Question screen ──────────────────────────────────────────────────────
  return (
    <div><Navbar />
      <div className="max-w-2xl mx-auto pt-10 px-4 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Question {current + 1} of {questions.length}</p>
            <p className="text-sm text-gray-600 font-medium mt-0.5">{session?.role}</p>
          </div>
          {/* Countdown ring */}
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={timerColor} strokeWidth="3"
                strokeDasharray={`${timerPct} ${100 - timerPct}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
              {fmt(remaining)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${((current) / questions.length) * 100}%` }} />
        </div>

        {step === "evaluating" ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">AI is evaluating your answer…</p>
          </div>
        ) : (
          <>
            {/* Question card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">💬</span>
                <p className="text-gray-800 font-medium leading-relaxed">{q?.question}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  q?.difficulty === "easy" ? "bg-green-50 text-green-700 border-green-200"
                  : q?.difficulty === "hard" ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {q?.difficulty || "medium"}
                </span>
              </div>
            </div>

            {/* Answer textarea */}
            <textarea
              className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[180px] shadow-sm"
              placeholder="Type your answer here. Be as thorough as you would in a real interview…"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              autoFocus
            />

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-400">
                {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </p>
              <button
                onClick={() => handleSubmitAnswer(false)}
                disabled={evaluating}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
              >
                {current + 1 === questions.length ? "Submit & Finish →" : "Submit & Next →"}
              </button>
            </div>

            {/* Skip */}
            <div className="text-center mt-3">
              <button onClick={() => handleSubmitAnswer(true)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Skip this question
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewSimulation;
