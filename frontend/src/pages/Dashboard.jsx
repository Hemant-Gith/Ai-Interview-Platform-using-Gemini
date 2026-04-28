import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "../utils/apiPaths";
import axios from "../utils/axiosInstance";
import Navbar from "../components/Navbar";

const PREDEFINED_ROLES = [
  "Frontend Developer","Backend Developer","Full Stack Developer",
  "MERN Stack Developer","React Developer","Node.js Developer",
  "DevOps Engineer","Data Scientist","Machine Learning Engineer",
  "Mobile Developer (React Native)","Java Developer","Python Developer",
  "Cloud Engineer (AWS/GCP/Azure)","QA Engineer",
];

const DIFF_DOT = { easy: "bg-green-400", medium: "bg-amber-400", hard: "bg-red-400" };

const SessionCard = ({ session, onDelete, onToggleSave, onClick }) => {
  const qCount = session.questions?.length || 0;
  const difficulties = session.questions?.map((q) => q.difficulty) || [];
  const counts = difficulties.reduce((a, d) => { a[d] = (a[d] || 0) + 1; return a; }, {});

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Saved ribbon */}
      {session.isSaved && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-xl">
          SAVED
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(session._id); }}
          className="w-7 h-7 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-sm transition"
          title={session.isSaved ? "Unsave" : "Save"}
        >
          {session.isSaved ? "🔖" : "🏷️"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(e, session._id); }}
          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-sm transition"
          title="Delete"
        >
          🗑️
        </button>
      </div>

      {/* Role avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 border border-orange-100 flex items-center justify-center text-lg mb-3">
        💼
      </div>

      <h2 className="font-semibold text-gray-800 text-sm leading-snug pr-8">{session.role}</h2>
      <p className="text-gray-400 text-xs mt-0.5">{session.experience} experience</p>
      {session.topicsToFocus && (
        <p className="text-gray-400 text-[11px] mt-1 truncate">📌 {session.topicsToFocus}</p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">{qCount} question{qCount !== 1 ? "s" : ""}</span>
        {/* Difficulty dots */}
        {qCount > 0 && (
          <div className="flex gap-1 items-center">
            {Object.entries(counts).map(([d, n]) => (
              <span key={d} className="flex items-center gap-0.5 text-[10px] text-gray-400">
                <span className={`w-1.5 h-1.5 rounded-full ${DIFF_DOT[d] || "bg-gray-300"}`} />
                {n}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [inputMode, setInputMode] = useState("role");
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [experience, setExperience] = useState("");
  const [topicsToFocus, setTopicsToFocus] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchSessions = async () => {
    try {
      const res = await axios.get(API_PATHS.SESSION.GET_ALL);
      setSessions(res.data.sessions);
    } catch {}
  };

  const createSession = async () => {
    const role = inputMode === "role"
      ? (selectedRole === "__custom__" ? customRole : selectedRole)
      : "Custom Role (from JD)";
    if (!role || !experience) return alert("Please fill in Role and Experience");
    if (inputMode === "jd" && !jobDescription.trim()) return alert("Please paste a job description");
    try {
      setCreating(true);
      await axios.post(API_PATHS.SESSION.CREATE, {
        role, experience, topicsToFocus,
        description: inputMode === "jd" ? jobDescription : "",
        questions: [],
      });
      setSelectedRole(""); setCustomRole(""); setExperience("");
      setTopicsToFocus(""); setJobDescription(""); setShowForm(false);
      fetchSessions();
    } catch { alert("Failed to create session"); } finally { setCreating(false); }
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this session and all its questions?")) return;
    try {
      await axios.delete(`${API_PATHS.SESSION.DELETE}/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch { alert("Failed to delete session"); }
  };

  const toggleSave = async (sessionId) => {
    try {
      const res = await axios.patch(`${API_PATHS.SESSION.SAVE}/${sessionId}/save`);
      setSessions((prev) => prev.map((s) => s._id === sessionId ? { ...s, isSaved: res.data.isSaved } : s));
    } catch { alert("Failed to update session"); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const displayed = tab === "saved" ? sessions.filter((s) => s.isSaved) : sessions;
  const savedCount = sessions.filter((s) => s.isSaved).length;

  return (
    <div className="min-h-screen bg-[#f9f9f8]">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-8 px-4 pb-20 fade-up">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} · {savedCount} saved
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              showForm
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-100"
            }`}
          >
            {showForm ? "✕ Cancel" : "+ New Session"}
          </button>
        </div>

        {/* Create session form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 scale-in">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">New Session</h2>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
              {[["role","📋 Select Role"],["jd","📄 Paste JD"]].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`text-sm px-4 py-1.5 rounded-lg font-medium transition ${
                    inputMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {inputMode === "role" ? (
              <div className="space-y-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700"
                >
                  <option value="">— Select a role —</option>
                  {PREDEFINED_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  <option value="__custom__">✏️ Enter custom role…</option>
                </select>
                {selectedRole === "__custom__" && (
                  <input
                    placeholder="e.g. Rust Systems Engineer"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                )}
              </div>
            ) : (
              <textarea
                placeholder="Paste the full job description — AI will extract role & generate questions…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[130px] resize-none"
              />
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <input
                placeholder="Experience (e.g. 2 years)"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 sm:w-48"
              />
              <input
                placeholder="Topics (e.g. React, Node, System Design)"
                value={topicsToFocus}
                onChange={(e) => setTopicsToFocus(e.target.value)}
                className="border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 flex-1"
              />
            </div>

            <button
              onClick={createSession}
              disabled={creating}
              className="mt-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              {creating ? "Creating…" : "Create Session →"}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "all",   label: `All (${sessions.length})` },
            { key: "saved", label: `🔖 Saved (${savedCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
                tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sessions grid */}
        {displayed.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-4xl mb-3">{tab === "saved" ? "🔖" : "📋"}</p>
            <p className="text-sm font-medium text-gray-500">
              {tab === "saved" ? "No saved sessions yet" : "No sessions yet"}
            </p>
            <p className="text-xs mt-1 text-gray-400">
              {tab === "saved" ? "Hover a card and click 🏷️ to save" : "Click '+ New Session' to get started"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayed.map((s) => (
              <SessionCard
                key={s._id}
                session={s}
                onDelete={deleteSession}
                onToggleSave={toggleSave}
                onClick={() => navigate(`/interview/${s._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
