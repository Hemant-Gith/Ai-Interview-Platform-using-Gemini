import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_PATHS } from "../utils/apiPaths";
import axios from "../utils/axiosInstance";

const SignUp = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) { setError("Please fill in all fields."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError(null);
    try {
      await axios.post(API_PATHS.AUTH.SIGNUP, form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSignup(); };

  return (
    <div className="min-h-screen flex bg-[#fdfcfb]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-orange-500 p-10 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-bold text-white text-[15px]">PrepAI</span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold leading-tight mb-4">Start interviewing smarter today</h2>
          <ul className="space-y-2 text-white/80 text-sm">
            {["Generate role-specific questions instantly", "Get your answers evaluated by AI", "Run timed mock interview simulations", "Track your progress across sessions"].map((item) => (
              <li key={item} className="flex gap-2"><span className="text-white">✓</span>{item}</li>
            ))}
          </ul>
        </div>
        <p className="text-white/50 text-xs">No credit card required.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 fade-up">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account 🚀</h2>
            <p className="text-gray-400 text-sm">Free forever. No credit card needed.</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {[
              { label: "Name", key: "name", type: "text", placeholder: "Your full name" },
              { label: "Email", key: "email", type: "email", placeholder: "you@example.com" },
              { label: "Password", key: "password", type: "password", placeholder: "Min. 6 characters" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="mt-5 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition shadow-md shadow-orange-100"
          >
            {loading ? "Creating account…" : "Create Account →"}
          </button>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
