"use client";

import { useState, useMemo } from "react";
import { shuffleQuiz } from "../lib/quizUtils";

export default function Quiz({ questions, onComplete }) {
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const shuffled = useMemo(() => shuffleQuiz(questions), [questions, shuffleSeed]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinedExplanation, setRefinedExplanation] = useState(null);

  const q = shuffled[index];
  const isCorrect = selected === q?.correctIndex;

  function handleSelect(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function handleNext() {
    setRefinedExplanation(null);
    if (index >= shuffled.length - 1) {
      setFinished(true);
      onComplete?.({ score: score + (isCorrect ? 0 : 0), total: shuffled.length, finalScore: score });
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  async function handleExplainDifferently() {
    setRefining(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "refine", explanationToRefine: q.explanation }),
      });
      const data = await res.json();
      if (data.explanation) setRefinedExplanation(data.explanation);
    } catch (e) {
      // silent fail
    } finally {
      setRefining(false);
    }
  }

  function restart() {
    setShuffleSeed((s) => s + 1);
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setRefinedExplanation(null);
  }

  if (!questions || questions.length === 0) {
    return <p className="text-muted text-sm">No quiz questions yet.</p>;
  }

  if (finished) {
    const pct = Math.round((score / shuffled.length) * 100);
    return (
      <div className="card p-8 text-center">
        <p className="eyebrow mb-2">quiz complete</p>
        <p className="font-display text-3xl mb-2">
          {score} / {shuffled.length}
        </p>
        <p className="text-muted mb-6">{pct}% correct</p>
        <button className="btn btn-primary" onClick={restart}>
          Retake quiz
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="eyebrow text-muted">
          question {index + 1} of {shuffled.length}
        </p>
        <p className="eyebrow text-accent">
          {score} correct so far
        </p>
      </div>

      <div className="card p-6 sm:p-7">
        <p className="font-display text-xl leading-snug mb-5">{q.question}</p>

        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            let style = "border-line";
            if (answered) {
              if (i === q.correctIndex) style = "border-good text-good";
              else if (i === selected) style = "border-bad text-bad";
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className={`text-left px-4 py-3 rounded-md border transition-colors ${style} ${!answered ? "hover:border-accent" : ""}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-5 pt-5 border-t border-line">
            <p className={`text-sm font-medium mb-2 ${isCorrect ? "text-good" : "text-bad"}`}>
              {isCorrect ? "Correct" : "Not quite"}
            </p>
            <p className="text-sm leading-relaxed mb-3">{refinedExplanation || q.explanation}</p>
            {q.commonMistake && (
              <p className="text-sm text-muted leading-relaxed">
                <span className="text-accent">common mistake — </span>
                {q.commonMistake}
              </p>
            )}
            <button
              className="text-xs text-muted hover:text-accent underline mt-3"
              onClick={handleExplainDifferently}
              disabled={refining}
            >
              {refining ? "rewording…" : "explain this differently"}
            </button>
          </div>
        )}
      </div>

      {answered && (
        <button className="btn btn-primary w-full justify-center mt-5" onClick={handleNext}>
          {index >= shuffled.length - 1 ? "Finish quiz" : "Next question"}
        </button>
      )}
    </div>
  );
}
