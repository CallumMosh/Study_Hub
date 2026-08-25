# Study Hub — v1

Upload lecture notes (text or slide images), and generate flashcards, quizzes,
summaries, and analogies — focused on understanding, not just recall.

## What's in v1

- Course → Lecture organization
- Paste notes directly, or upload slide photos/screenshots
- One click generates: a plain-language summary, analogies, flashcards
  (with worked examples), and a quiz (with explanations + common mistakes)
- Flashcards use spaced repetition (Leitner boxes) — cards you know drift
  further out, cards you miss come back sooner
- "Explain this differently" on any flashcard or quiz answer, for when the
  first explanation doesn't click
- Everything saves automatically in your browser (localStorage) — private to you

**v1 limitation:** data is stored per-browser, not in a shared database. It
won't sync between your phone and laptop yet. That's the natural next step
if you want it (a small Postgres database on Vercel) — flagging it now so
it's not a surprise.

## 1. Get the code onto GitHub

From this project folder:

```bash
git init
git add .
git commit -m "Study Hub v1"
```

Then create a new repository on GitHub (github.com/new — don't initialize it
with a README), and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/study-hub.git
git branch -M main
git push -u origin main
```

## 2. Get a Gemini API key (free)

The "generate" feature calls Google's Gemini API, using the free tier —
no card required, no cost for personal use at this volume:

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with a Google account and click "Create API key"
3. Copy the key — you'll paste it into Vercel in the next step

Free tier limits are generous for personal use (15 requests/minute, 1,500/day),
so generating lecture material won't cost anything. One thing worth knowing:
on the free tier, Google may use your prompts to improve their products —
fine for lecture notes, just worth being aware of. If that ever matters to
you, switching to a paid Gemini tier or another provider later is a small
code change, not a rebuild.

## 3. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo
   you just pushed
2. Before deploying, add an Environment Variable:
   - Name: `GEMINI_API_KEY`
   - Value: the key from step 2
3. Click Deploy

Vercel will give you a live URL (e.g. `study-hub-yourname.vercel.app`) — add
it to your phone's home screen for an app-like feel.

## Running it locally (optional)

```bash
npm install
cp .env.example .env.local   # then paste your Gemini API key into .env.local
npm run dev
```

Then open http://localhost:3000

## Project structure

```
app/
  page.js                              — dashboard (course list)
  course/[courseId]/page.js            — lecture list within a course
  course/[courseId]/lecture/[id]/      — upload, summary, flashcards, quiz
  api/generate/route.js                — calls Gemini to generate material
components/
  UploadPanel.js                       — paste notes / upload slide images
  FlashcardDeck.js                     — flip cards + spaced repetition
  Quiz.js                              — multiple choice + explanations
lib/
  storage.js                           — localStorage data layer
  spacedRepetition.js                  — Leitner box scheduling
```
