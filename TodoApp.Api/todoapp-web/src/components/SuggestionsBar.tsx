"use client";

import { AnimatePresence, motion } from "framer-motion";

type SuggestionsBarProps = {
  suggestions: string[];
  loading: boolean;
  warmingUp?: boolean;
  onSuggestionClick: (suggestion: string) => void;
};

export default function SuggestionsBar({
  suggestions,
  loading,
  warmingUp,
  onSuggestionClick,
}: SuggestionsBarProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <p className="text-sm text-neutral-400">
          {warmingUp ? "Suggestions are warming up..." : "Thinking..."}
        </p>
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
        <AnimatePresence>
            {suggestions.map((suggestion) => (
                <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={() => onSuggestionClick(suggestion)}
                    className="rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-100 transition hover:scale-[1.02] hover:bg-neutral-700"
                >
                    {suggestion}
                </motion.button>
                
            ))}
        </AnimatePresence>
        
      </div>
    </div>
  );
}