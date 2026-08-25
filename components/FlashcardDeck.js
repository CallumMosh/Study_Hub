"use client";

import { useMemo, useState } from "react";
import { initCardProgress, reviewCard, isDue } from "../lib/spacedRepetition";

export default function FlashcardDeck({ flashcards, onUpdate }) {
  const [dueOnly, setDueOnly] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinedExample, setRefinedExample] = useState(null);

  const deck = useMemo(() => {
    const withProgress = flashcards.map((c) => ({ ...c, progress: c.progress || initCardProgress() }));
    return dueOnly ? withProgress.filter((c) => isDue(c.progress)) : withProgress;
  }, [flashcards, dueOnly]);

  const card = deck[index];

  function goNext() {
    setFlipped(false);
    setRefinedExample(null);
    setIndex((i) => Math.min(i + 1, deck.length - 1));
  }

  function handleReview(knewIt) {
    const updated = flashcards.map((c) =>
      c.id === card.id ? { ...c, progress: reviewCard(c.progress || initCardProgress(), knewIt) } : c
    );
    onUpdate(updated);
    if (index >= deck.length - 1) {
      setIndex(0);
    } else {
      goNext();
    }
    setFlipped(false);
    setRefinedExample(null);
  }

  async function handleExplainDifferently() {
    setRefining(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "refine", explanationToRefine: card.back }),
      });
      const data = await res.json();
      if (data.explanation) setRefinedExample(data.explanation);
    } catch (e) {
      // silent fail, keep original
    } finally {
      setRefining(false);
    }
  }

  if (flashcards.length === 0) {
    return <p className="text-muted text-sm">No flashcards yet.</p>;
  }

  if (deck.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-lg mb-1">All caught up</p>
        <p className="text-sm text-muted mb-4">Nothing due for review right now.</p>
        <button className="btn btn-ghost text-sm" onClick={() => setDueOnly(false)}>
          Review all cards anyway
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="eyebrow text-muted">
          card {index + 1} of {deck.length} {dueOnly ? "· due today" : "· all cards"}
        </p>
        <button className="text-xs text-muted hover:text-accent" onClick={() => { setDueOnly((v) => !v); setIndex(0); setFlipped(false); }}>
          {dueOnly ? "show all cards" : "show due only"}
        </button>
      </div>

      <div className="flip-scene h-64 sm:h-72 mb-5" onClick={() => setFlipped((f) => !f)}>
        <div className={`flip-card relative w-full h-full cursor-pointer ${flipped ? "flipped" : ""}`}>
          <div className="flip-face absolute inset-0 card p-6 sm:p-8 flex flex-col justify-center">
            <p className="eyebrow mb-3">question</p>
            <p className="font-display text-xl sm:text-2xl leading-snug">{card.front}</p>
            <p className="text-xs text-muted mt-6">tap to flip</p>
          </div>
          <div className="flip-face flip-back absolute inset-0 card p-6 sm:p-8 flex flex-col justify-center overflow-y-auto">
            <p className="eyebrow mb-3 text-accent">answer</p>
            <p className="text-lg leading-snug mb-3">{card.back}</p>
            {(refinedExample || card.example) && (
              <p className="text-sm text-muted border-t border-line pt-3">
                <span className="text-accent">example — </span>
                {refinedExample || card.example}
              </p>
            )}
          </div>
        </div>
      </div>

      {flipped && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            className="text-xs text-muted hover:text-accent underline"
            onClick={(e) => { e.stopPropagation(); handleExplainDifferently(); }}
            disabled={refining}
          >
            {refining ? "rewording…" : "explain this differently"}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button className="btn flex-1 justify-center" style={{ background: "rgba(196,116,106,0.12)", color: "#C4746A" }} onClick={() => handleReview(false)}>
          Didn't know it
        </button>
        <button className="btn btn-primary flex-1 justify-center" onClick={() => handleReview(true)}>
          Got it
        </button>
      </div>
    </div>
  );
}
