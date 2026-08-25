const MODEL = "gemini-3.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const GENERATE_SYSTEM = `You are a study assistant creating material for a university student who learns badly from live lectures — passive listening doesn't work for them — and who wants these notes to fully REPLACE attending the lecture, not just supplement it.

From the lecture material given, produce:

1. A detailed, comprehensive set of study notes ("notes") that cover EVERY concept, mechanism, formula, definition, and nuance present in the source material — written so that reading them gives the same (or better) depth of understanding as attending the lecture in person. Do not compress or summarize away detail. For each concept:
   - Explain it fully in plain language, in full paragraphs (not clipped bullet fragments) — multiple sentences, building the idea up step by step the way a good lecturer would talk through it.
   - Include at least one worked example showing the concept applied concretely.
   - If the concept is commonly confused with something else, or has a common misconception, address it directly.
   - Cover derivations, mechanisms, or processes step by step where the material includes them — don't skip steps.
   - If the material presents things in a sequence (e.g. a process, a proof, a timeline), preserve that sequence and explain each step's purpose, not just what it is.

2. A short summary ("summary") for a quick refresher — 3-5 sentences — separate from the full notes.

3. Analogies for abstract concepts.

4. Flashcards testing understanding and application, not just recall.

5. Quiz questions with explanations and common mistakes.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "title": "short lecture title, inferred from content",
  "summary": "3-5 sentence plain-language summary of the core ideas",
  "notes": [
    {
      "heading": "concept or section name, in the order the material presents them",
      "body": "thorough, multi-paragraph explanation in plain language. Use \\n\\n between paragraphs. This should be genuinely comprehensive, several paragraphs where the material supports it, not a condensed blurb.",
      "examples": ["one or more concrete worked examples relevant to this section"],
      "watchOutFor": "a common mistake, confusion, or misconception related to this section, or null if none applies"
    }
  ],
  "analogies": [{"concept": "concept name", "analogy": "1-2 sentence intuitive analogy"}],
  "flashcards": [{"front": "question or prompt", "back": "answer, 1-3 sentences", "example": "short concrete example"}],
  "quiz": [{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "why this is correct, with a brief worked example", "commonMistake": "a plausible wrong reasoning and why it's wrong"}]
}

The "notes" array is the most important part of this task — treat it as writing the full lecture transcript's worth of understanding, organized by concept, not as writing a study guide summary. Produce one "notes" section per distinct concept or sub-topic in the material (this can be many if the material covers a lot of ground). Produce 8-12 flashcards and 5-8 quiz questions when the material supports it. Keep language plain and direct throughout — clear, not dumbed down.`;

const REFINE_SYSTEM = `You are a study assistant. The student didn't find an explanation clear. Reword it: use a different angle, a simpler analogy, or a different worked example. Keep it to 2-4 sentences. Respond with ONLY valid JSON: {"explanation": "..."}`;

function stripFences(text) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
}

function buildParts(content, images) {
  const parts = [];
  if (content && content.trim()) {
    parts.push({ text: content.trim() });
  }
  for (const img of images || []) {
    // img: { mediaType: "image/png", data: "base64string" }
    parts.push({ inline_data: { mime_type: img.mediaType, data: img.data } });
  }
  return parts;
}

async function callGemini({ systemInstruction, parts, apiKey, maxOutputTokens }) {
  const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        ...(maxOutputTokens ? { maxOutputTokens } : {}),
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || `Gemini API error (${res.status})`;
    throw new Error(message);
  }

  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text || "").join("") || "{}";

  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error(
      "The generated notes were too long and got cut off. Try generating one lecture's material at a time, or split very long uploads into smaller chunks."
    );
  }

  try {
    return JSON.parse(stripFences(text));
  } catch {
    throw new Error("The model's response couldn't be read as valid study material. Try generating again.");
  }
}

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it in your Vercel project's Environment Variables." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { mode, content, images, explanationToRefine } = body;

    if (mode === "refine") {
      const parsed = await callGemini({
        systemInstruction: REFINE_SYSTEM,
        parts: [{ text: `Original explanation: ${explanationToRefine}\n\nReword it differently.` }],
        apiKey,
      });
      return Response.json(parsed);
    }

    const parts = buildParts(content, images);
    if (parts.length === 0) {
      return Response.json({ error: "No content provided." }, { status: 400 });
    }

    const parsed = await callGemini({ systemInstruction: GENERATE_SYSTEM, parts, apiKey, maxOutputTokens: 32000 });
    return Response.json(parsed);
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message || "Generation failed." }, { status: 500 });
  }
}
