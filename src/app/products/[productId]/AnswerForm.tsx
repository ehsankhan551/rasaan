"use client";

import { useState, useTransition } from "react";
import { answerQuestion } from "./actions";

export default function AnswerForm({
  questionId,
  productId,
}: {
  questionId: string;
  productId: string;
}) {
  const [answer, setAnswer] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await answerQuestion(questionId, productId, answer);
      if (res?.error) {
        setError(res.error);
      } else {
        setDone(true);
      }
    });
  }

  if (done) {
    return <p className="text-xs text-green-600 mt-2">Answer posted.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Reply as the seller..."
        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
      />
      <button
        type="submit"
        disabled={isPending || !answer.trim()}
        className="rounded-lg bg-green-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50 shrink-0"
      >
        {isPending ? "..." : "Reply"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </form>
  );
}
