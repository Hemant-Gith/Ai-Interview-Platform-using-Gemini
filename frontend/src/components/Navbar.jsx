import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-bold text-gray-900 tracking-tight text-[15px]">PrepAI</span>
        </button>

        {/* Nav links + logout */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/dashboard")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isActive("/dashboard")
                ? "bg-orange-50 text-orange-600"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={logout}
            className="ml-2 px-3.5 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
