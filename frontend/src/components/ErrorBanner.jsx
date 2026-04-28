const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
    <span className="text-red-400 text-lg shrink-0 mt-0.5">⚠️</span>
    <div className="flex-1">
      <p className="text-sm text-red-700 font-medium">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0 underline"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorBanner;
