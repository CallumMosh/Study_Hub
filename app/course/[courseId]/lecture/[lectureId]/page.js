"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLecture, updateLecture, getCourse, uid } from "../../../../../lib/storage";
import UploadPanel from "../../../../../components/UploadPanel";
import FlashcardDeck from "../../../../../components/FlashcardDeck";
import Quiz from "../../../../../components/Quiz";

export default function LecturePage({ params }) {
  const { courseId, lectureId } = params;
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [lecture, setLecture] = useState(null);
  const [tab, setTab] = useState("notes");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const c = getCourse(courseId);
    const l = getLecture(courseId, lectureId);
    if (!c || !l) {
      router.replace("/");
      return;
    }
    setCourse(c);
    setLecture(l);
    setTab(l.generated ? "study" : "source");
  }, [courseId, lectureId, router]);

  async function handleGenerate({ content, images }) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", content, images }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong generating your material.");
        return;
      }
      const withIds = {
        ...data,
        flashcards: (data.flashcards || []).map((c) => ({ ...c, id: uid() })),
        quiz: (data.quiz || []).map((q) => ({ ...q, id: uid() })),
      };
      const updated = updateLecture(courseId, lectureId, {
        content,
        images: images?.map((i) => ({ mediaType: i.mediaType, name: i.name })) || [],
        generated: withIds,
        title: lecture.title === "" ? data.title : lecture.title,
      });
      setLecture(updated);
      setTab("study");
    } catch (e) {
      setError("Couldn't reach the generation service. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleFlashcardUpdate(updatedCards) {
    const updated = updateLecture(courseId, lectureId, {
      generated: { ...lecture.generated, flashcards: updatedCards },
    });
    setLecture(updated);
  }

  function handleQuizComplete({ finalScore, total }) {
    const entry = { date: Date.now(), score: finalScore, total };
    const updated = updateLecture(courseId, lectureId, {
      quizHistory: [...(lecture.quizHistory || []), entry],
    });
    setLecture(updated);
  }

  if (!lecture || !course) return null;

  const hasGenerated = !!lecture.generated;

  return (
    <div>
      <section className="pt-6 pb-6 border-b border-line">
        <Link href={`/course/${courseId}`} className="eyebrow hover:text-accent">
          ← {course.name}
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl mt-3">{lecture.title}</h1>
      </section>

      <nav className="flex gap-6 mt-6 border-b border-line overflow-x-auto">
        <button className={`tab ${tab === "source" ? "active" : ""}`} onClick={() => setTab("source")}>
          Source
        </button>
        {hasGenerated && (
          <>
            <button className={`tab ${tab === "study" ? "active" : ""}`} onClick={() => setTab("study")}>
              Study Notes
            </button>
            <button className={`tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>
              Quick Summary
            </button>
            <button className={`tab ${tab === "flashcards" ? "active" : ""}`} onClick={() => setTab("flashcards")}>
              Flashcards
            </button>
            <button className={`tab ${tab === "quiz" ? "active" : ""}`} onClick={() => setTab("quiz")}>
              Quiz
            </button>
          </>
        )}
      </nav>

      <section className="pt-8">
        {tab === "source" && (
          <UploadPanel
            initialContent={lecture.content}
            onGenerate={handleGenerate}
            generating={generating}
            error={error}
          />
        )}

        {tab === "study" && hasGenerated && (
          <div className="flex flex-col gap-5">
            {(lecture.generated.notes || []).length === 0 && (
              <p className="text-muted text-sm">No detailed notes were generated for this upload.</p>
            )}
            {(lecture.generated.notes || []).map((section, i) => (
              <div key={i} className="card p-6 sm:p-8">
                <p className="font-display text-xl mb-4">{section.heading}</p>
                <div className="flex flex-col gap-4">
                  {(section.body || "").split(/\n\n+/).map((para, pi) => (
                    <p key={pi} className="leading-relaxed text-[15px]">{para}</p>
                  ))}
                </div>
                {section.examples?.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-line flex flex-col gap-3">
                    {section.examples.map((ex, ei) => (
                      <p key={ei} className="text-sm leading-relaxed">
                        <span className="text-accent">example — </span>
                        {ex}
                      </p>
                    ))}
                  </div>
                )}
                {section.watchOutFor && (
                  <p className="text-sm text-muted leading-relaxed mt-4 border-l-2 border-bad pl-4">
                    <span className="text-bad">watch out — </span>
                    {section.watchOutFor}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "summary" && hasGenerated && (
          <div className="card p-6 sm:p-8">
            <p className="eyebrow mb-3">summary</p>
            <p className="leading-relaxed mb-8">{lecture.generated.summary}</p>

            {lecture.generated.analogies?.length > 0 && (
              <>
                <p className="eyebrow mb-3 text-accent">ways to think about it</p>
                <div className="flex flex-col gap-4">
                  {lecture.generated.analogies.map((a, i) => (
                    <div key={i} className="border-l-2 border-accent pl-4">
                      <p className="text-sm font-medium mb-1">{a.concept}</p>
                      <p className="text-sm text-muted leading-relaxed">{a.analogy}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "flashcards" && hasGenerated && (
          <FlashcardDeck flashcards={lecture.generated.flashcards || []} onUpdate={handleFlashcardUpdate} />
        )}

        {tab === "quiz" && hasGenerated && (
          <Quiz questions={lecture.generated.quiz || []} onComplete={handleQuizComplete} />
        )}
      </section>
    </div>
  );
}
