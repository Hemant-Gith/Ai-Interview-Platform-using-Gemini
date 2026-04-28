import { useState } from "react";
import axios from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(API_PATHS.AUTH.LOGIN, form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="min-h-screen flex bg-[#fdfcfb]">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gray-900 p-10 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-bold text-white text-[15px]">PrepAI</span>
        </div>
        <div>
          <blockquote className="text-xl font-semibold leading-snug text-white/90 mb-3">
            "Preparation is the key to success. Let AI be your practice partner."
          </blockquote>
          <p className="text-white/40 text-sm">Thousands of devs prep smarter with PrepAI</p>
        </div>
        <div className="flex gap-3">
          {["⚡ AI Questions", "🧪 Evaluator", "🎙️ Simulation"].map((t) => (
            <span key={t} className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full border border-white/10">{t}</span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 fade-up">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back 👋</h2>
            <p className="text-gray-400 text-sm">Login to continue your interview prep</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-5 w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition"
          >
            {loading ? "Logging in…" : "Login →"}
          </button>

          <p className="text-center text-sm text-gray-400 mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-orange-500 font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
