const MODEL = "gemini-3.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const GENERATE_SYSTEM = `You are a study assistant helping a university student who struggles with retention and fully understanding concepts, not just memorizing them.

From the lecture material given, produce study material that prioritizes UNDERSTANDING:
- Every explanation must include a concrete worked example, not just a definition.
- Where a concept is abstract, include one short, intuitive analogy.
- Flashcards should test understanding and application, not just recall of a term.
- Quiz questions must include an explanation of why the correct answer is right AND a "commonMistake" describing a plausible wrong way of thinking about it.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "title": "short lecture title, inferred from content",
  "summary": "3-5 sentence plain-language summary of the core ideas",
  "analogies": [{"concept": "concept name", "analogy": "1-2 sentence intuitive analogy"}],
  "flashcards": [{"front": "question or prompt", "back": "answer, 1-3 sentences", "example": "short concrete example"}],
  "quiz": [{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "why this is correct, with a brief worked example", "commonMistake": "a plausible wrong reasoning and why it's wrong"}]
}

Produce 8-12 flashcards and 5-8 quiz questions when the material supports it. Keep language plain and direct.`;

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

async function callGemini({ systemInstruction, parts, apiKey }) {
  const url = `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || `Gemini API error (${res.status})`;
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "{}";
  return JSON.parse(stripFences(text));
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

    const parsed = await callGemini({ systemInstruction: GENERATE_SYSTEM, parts, apiKey });
    return Response.json(parsed);
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message || "Generation failed." }, { status: 500 });
  }
}
