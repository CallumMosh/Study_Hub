// Lightweight Leitner-system spaced repetition.
// Box 1 = review tomorrow, box 5 = review in 2 weeks.
const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14];
const MAX_BOX = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export function initCardProgress() {
  return { box: 1, nextReview: Date.now() };
}

export function reviewCard(progress, knewIt) {
  const current = progress?.box || 1;
  const box = knewIt ? Math.min(current + 1, MAX_BOX) : 1;
  const intervalDays = BOX_INTERVAL_DAYS[box];
  return { box, nextReview: Date.now() + intervalDays * DAY_MS, lastReviewed: Date.now() };
}

export function isDue(progress) {
  if (!progress) return true;
  return Date.now() >= progress.nextReview;
}

export function dueCount(flashcards) {
  return flashcards.filter((c) => isDue(c.progress)).length;
}
