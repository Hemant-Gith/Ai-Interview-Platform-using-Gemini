import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axios from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const DIFFICULTY_STYLES = {
  easy:   { label: "Easy",   cls: "bg-green-50 text-green-700 border-green-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  hard:   { label: "Hard",   cls: "bg-red-50 text-red-700 border-red-200" },
};

const VERDICT_STYLES = {
  "Excellent":         "bg-green-50 text-green-700 border-green-300",
  "Good":              "bg-blue-50 text-blue-700 border-blue-300",
  "Needs Improvement": "bg-amber-50 text-amber-700 border-amber-300",
  "Insufficient":      "bg-red-50 text-red-700 border-red-300",
};

const ScoreRing = ({ score }) => {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "#22c55e" : score >= 6 ? "#3b82f6" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
        {score}/10
      </span>
    </div>
  );
};

const EvaluationPanel = ({ questionId, onClose }) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(API_PATHS.AI.EVALUATE_ANSWER, { questionId, userAnswer });
      setEvaluation(res.data.data);
    } catch {
      setError("Failed to evaluate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">🧪 AI Answer Evaluator</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>
      {!evaluation ? (
        <>
          <p className="text-xs text-gray-400 mb-2">Write your answer below — AI will score it and give feedback.</p>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[100px]"
            placeholder="Type your answer here as if in a real interview…"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <button
            onClick={handleEvaluate}
            disabled={loading || !userAnswer.trim()}
            className="mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
          >
            {loading ? "Evaluating…" : "🤖 Evaluate My Answer"}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <ScoreRing score={evaluation.score} />
            <div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${VERDICT_STYLES[evaluation.verdict] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {evaluation.verdict}
              </span>
              <p className="text-xs text-gray-500 mt-1">{evaluation.suggestion}</p>
            </div>
          </div>
          {evaluation.strengths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">✅ Strengths</p>
              <ul className="space-y-0.5">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-green-500 mt-px">•</span>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.gaps?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Gaps</p>
              <ul className="space-y-0.5">
                {evaluation.gaps.map((g, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span className="text-amber-500 mt-px">•</span>{g}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => { setEvaluation(null); setUserAnswer(""); }} className="text-xs text-indigo-500 hover:text-indigo-700 underline">
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

const ExplainModal = ({ question, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.post(API_PATHS.AI.EXPLAIN, { question });
        setData(res.data.data);
      } catch {
        setError("Failed to generate explanation. Try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-base text-gray-800">
            {loading ? "Loading explanation…" : data?.title || "Concept Explanation"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
              <div className="h-3 bg-gray-100 rounded w-4/6" />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {data && <div className="prose prose-sm max-w-none text-gray-700"><ReactMarkdown>{data.explanation}</ReactMarkdown></div>}
        </div>
      </div>
    </div>
  );
};

const QAItem = ({ item, onPin, onNoteChange, onRegenerate, simulationMode = false }) => {
  const [open, setOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showEvaluate, setShowEvaluate] = useState(false);
  const [note, setNote] = useState(item.note || "");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const saveTimer = useRef(null);

  const difficulty = DIFFICULTY_STYLES[item.difficulty] || DIFFICULTY_STYLES.medium;

  const handleNoteChange = (val) => {
    setNote(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await axios.patch(`${API_PATHS.SESSION.NOTE_QUESTION}/${item._id}/note`, { note: val });
        onNoteChange?.(item._id, val);
      } catch {} finally { setSaving(false); }
    }, 800);
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await axios.post(API_PATHS.AI.REGENERATE_QUESTION, { questionId: item._id });
      onRegenerate?.(res.data.data);
      setOpen(false);
      setShowNotes(false);
    } catch {} finally { setRegenerating(false); }
  };

  return (
    <>
      {showExplain && <ExplainModal question={item.question} onClose={() => setShowExplain(false)} />}
      <div className={`bg-white rounded-xl border transition-shadow ${item.isPinned ? "border-orange-200 shadow-sm" : "border-gray-100 shadow-sm"} hover:shadow-md`}>
        <div className="flex items-start gap-3 p-4">
          {!simulationMode && (
            <button onClick={() => onPin?.(item._id)} className="mt-0.5 text-base shrink-0 opacity-50 hover:opacity-100 transition" title={item.isPinned ? "Unpin" : "Pin"}>
              {item.isPinned ? "📌" : "📍"}
            </button>
          )}
          <div className="flex-1 cursor-pointer" onClick={() => !simulationMode && setOpen(!open)}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800 text-sm leading-snug">{item.question}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${difficulty.cls}`}>{difficulty.label}</span>
              {item.note && !simulationMode && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium">📝 Note</span>
              )}
            </div>
          </div>
          {!simulationMode && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setShowExplain(true)} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium transition">💡 Explain</button>
              <button
                onClick={() => { setShowEvaluate(!showEvaluate); setOpen(true); }}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${showEvaluate ? "bg-indigo-600 text-white" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"}`}
              >
                🧪 Evaluate
              </button>
              <button onClick={handleRegenerate} disabled={regenerating} className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium transition disabled:opacity-40">
                {regenerating ? "…" : "🔄"}
              </button>
            </div>
          )}
        </div>

        {open && !simulationMode && (
          <div className="px-4 pb-3 border-t border-gray-50">
            <div className="prose prose-sm max-w-none text-gray-700 mt-3">
              <ReactMarkdown>{item.answer}</ReactMarkdown>
            </div>
            {showEvaluate ? (
              <EvaluationPanel questionId={item._id} onClose={() => setShowEvaluate(false)} />
            ) : (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setShowNotes(!showNotes)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1">
                  📝 {showNotes ? "Hide notes" : (item.note ? "Edit your note" : "Add a note")}
                </button>
                {showNotes && (
                  <div className="mt-2 relative">
                    <textarea
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[80px]"
                      placeholder="Write your own understanding, a tip, or a gotcha…"
                      value={note}
                      onChange={(e) => handleNoteChange(e.target.value)}
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-gray-300">{saving ? "saving…" : "auto-saved"}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default QAItem;
