const DIFFICULTIES = ["all", "easy", "medium", "hard"];

const DIFF_STYLES = {
  all:    "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200",
  easy:   "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  medium: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  hard:   "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
};

const DIFF_ACTIVE = {
  all:    "bg-gray-700 text-white border-gray-700",
  easy:   "bg-green-600 text-white border-green-600",
  medium: "bg-amber-500 text-white border-amber-500",
  hard:   "bg-red-600 text-white border-red-600",
};

const FilterBar = ({ search, onSearch, difficulty, onDifficulty, pinnedOnly, onPinnedOnly, total, filtered }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-sm space-y-3">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
        />
        {search && (
          <button
            onClick={() => onSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Difficulty pills */}
        <div className="flex gap-1.5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => onDifficulty(d)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition capitalize ${
                difficulty === d ? DIFF_ACTIVE[d] : DIFF_STYLES[d]
              }`}
            >
              {d === "all" ? "All levels" : d}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* Pinned only toggle */}
        <button
          onClick={() => onPinnedOnly(!pinnedOnly)}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition ${
            pinnedOnly
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
          }`}
        >
          📌 Pinned only
        </button>

        {/* Result count */}
        <span className="ml-auto text-xs text-gray-400">
          {filtered === total
            ? `${total} question${total !== 1 ? "s" : ""}`
            : `${filtered} of ${total}`}
        </span>
      </div>
    </div>
  );
};

export default FilterBar;
