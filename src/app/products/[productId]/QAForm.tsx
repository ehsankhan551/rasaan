"use client";

import { useState, useTransition } from "react";
import { askQuestion } from "./actions";

export default function QAForm({ productId }: { productId: string }) {
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await askQuestion(productId, question);
      if (res?.error) {
        setError(res.error);
      } else {
        setDone(true);
        setQuestion("");
      }
    });
  }

  if (done) {
    return (
      <p className="text-sm text-green-600 mb-4 border border-green-200 bg-green-50 rounded-lg px-3 py-2">
        Question submitted -- the seller will answer here soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-900 mb-2">Ask a question</p>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask the seller about sizing, ingredients, delivery time..."
        rows={2}
        maxLength={500}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <button
        type="submit"
        disabled={isPending || !question.trim()}
        className="mt-3 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Ask Question"}
      </button>
    </form>
  );
}
