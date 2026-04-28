import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import QAItem from "../components/QAItems";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import SkeletonCard from "../components/SkeletonCard";
import FilterBar from "../components/FilterBar";

const InterviewPrep = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axios.get(`${API_PATHS.SESSION.GET_ONE}/${id}`);
      setSession(res.data.session);
      setQuestions(res.data.session?.questions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load session");
    } finally { setLoading(false); }
  };

  const generateQuestions = async () => {
    try {
      setGenerating(true); setError(null);
      await axios.post(API_PATHS.AI.GENERATE_QUESTIONS, { sessionId: id });
      await fetchSession();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate questions");
    } finally { setGenerating(false); }
  };

  const handlePin = async (questionId) => {
    try {
      const res = await axios.patch(`${API_PATHS.SESSION.PIN_QUESTION}/${questionId}/pin`);
      setQuestions((prev) => prev.map((q) => q._id === questionId ? { ...q, isPinned: res.data.isPinned } : q));
    } catch {}
  };

  const handleNoteChange = (questionId, note) => {
    setQuestions((prev) => prev.map((q) => q._id === questionId ? { ...q, note } : q));
  };

  const handleRegenerate = (newQuestion) => {
    setQuestions((prev) => prev.map((q) => q._id === newQuestion._id ? newQuestion : q));
  };

  useEffect(() => { fetchSession(); }, []);

  const filtered = useMemo(() => {
    let result = [...questions];
    result.sort((a, b) => b.isPinned - a.isPinned);
    if (pinnedOnly) result = result.filter((q) => q.isPinned);
    if (difficulty !== "all") result = result.filter((q) => q.difficulty === difficulty);
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((q) =>
        q.question.toLowerCase().includes(term) ||
        q.answer?.toLowerCase().includes(term) ||
        q.note?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [questions, search, difficulty, pinnedOnly]);

  const reviewed = questions.filter((q) => q.isPinned || q.note?.trim()).length;
  const progress = questions.length ? Math.round((reviewed / questions.length) * 100) : 0;
  const pinnedCount = questions.filter((q) => q.isPinned).length;
  const notedCount = questions.filter((q) => q.note?.trim()).length;
  const hasFilters = search || difficulty !== "all" || pinnedOnly;

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <Navbar />
      <div className="max-w-4xl mx-auto pt-8 px-4 pb-20 fade-up">

        {/* Breadcrumb */}
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4 transition">
          ← Dashboard
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{session?.role || "Interview Prep"}</h1>
            {session && (
              <p className="text-gray-400 text-sm mt-0.5">
                {session.experience} experience
                {session.topicsToFocus && ` · ${session.topicsToFocus}`}
              </p>
            )}

            {/* Progress bar */}
            {questions.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{reviewed}/{questions.length} reviewed</span>
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>📌 {pinnedCount} pinned</span>
                  <span>📝 {notedCount} noted</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap items-center">
            {questions.length > 0 && (
              <button
                onClick={() => navigate(`/interview/${id}/simulate`)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition text-sm font-semibold shadow-sm shadow-indigo-100"
              >
                🎙️ Simulate
              </button>
            )}
            <button
              onClick={generateQuestions}
              disabled={generating || loading}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition text-sm font-semibold shadow-sm shadow-orange-100"
            >
              {generating ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
              ) : "⚡ Generate"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="mb-4"><ErrorBanner message={error} onRetry={fetchSession} /></div>}

        {/* Skeletons */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <EmptyState onGenerate={generateQuestions} generating={generating} />
        )}

        {!loading && questions.length > 0 && (
          <FilterBar
            search={search} onSearch={setSearch}
            difficulty={difficulty} onDifficulty={setDifficulty}
            pinnedOnly={pinnedOnly} onPinnedOnly={setPinnedOnly}
            total={questions.length} filtered={filtered.length}
          />
        )}

        {!loading && questions.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-medium text-gray-500 text-sm">No questions match your filters</p>
            <button
              onClick={() => { setSearch(""); setDifficulty("all"); setPinnedOnly(false); }}
              className="mt-2 text-sm text-orange-500 hover:text-orange-700 underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((q) => (
              <QAItem
                key={q._id}
                item={q}
                onPin={handlePin}
                onNoteChange={handleNoteChange}
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPrep;
