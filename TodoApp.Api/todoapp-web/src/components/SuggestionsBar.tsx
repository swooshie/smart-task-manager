"use client";

type SuggestionsBarProps = {
  suggestions: string[];
  loading: boolean;
  onSuggestionClick: (suggestion: string) => void;
};

export default function SuggestionsBar({
  suggestions,
  loading,
  onSuggestionClick,
}: SuggestionsBarProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <p className="text-sm text-neutral-400">Thinking...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <p className="text-sm text-neutral-400">No strong suggestions right now</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-neutral-200">Suggested tasks</p>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className="rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-100 transition hover:scale-[1.02] hover:bg-neutral-700"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}