const EmptyState = ({ onGenerate, generating }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-5 text-center fade-up">
    <div className="relative">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 border border-orange-100 flex items-center justify-center shadow-sm">
        <span className="text-3xl">⚡</span>
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center">
        <span className="text-white text-[9px]">AI</span>
      </div>
    </div>
    <div>
      <p className="text-gray-800 font-semibold text-base">No questions generated yet</p>
      <p className="text-gray-400 text-sm mt-1 max-w-xs">
        Hit the button below to generate AI-powered questions tailored to this role.
      </p>
    </div>
    <button
      onClick={onGenerate}
      disabled={generating}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold transition shadow-sm"
    >
      {generating ? (
        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
      ) : (
        <>⚡ Generate Questions</>
      )}
    </button>
  </div>
);

export default EmptyState;
