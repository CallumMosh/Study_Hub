"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCourse, getLectures, addLecture, deleteLecture } from "../../../lib/storage";
import { dueCount } from "../../../lib/spacedRepetition";
export default function CoursePage({ params }) {
  const { courseId } = params;
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const c = getCourse(courseId);
    if (!c) {
      router.replace("/");
      return;
    }
    setCourse(c);
    setLectures(getLectures(courseId));
  }, [courseId, router]);

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const lecture = addLecture(courseId, title.trim());
    router.push(`/course/${courseId}/lecture/${lecture.id}`);
  }

  function handleDelete(id) {
    if (!confirm("Delete this lecture?")) return;
    deleteLecture(courseId, id);
    setLectures((prev) => prev.filter((l) => l.id !== id));
  }

  if (!course) return null;

  return (
    <div>
      <section className="pt-6 pb-8 border-b border-line">
        <Link href="/" className="eyebrow hover:text-accent">
          ← all courses
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl mt-3">{course.name}</h1>
      </section>

      {lectures.some((l) => l.generated?.quiz?.length > 0) && (
        <section className="pt-8">
          <Link href={`/course/${courseId}/quiz`} className="card p-5 flex items-center justify-between hover:border-accent transition-colors block">
            <div>
              <p className="font-display text-lg">Quiz me on the whole course</p>
              <p className="text-sm text-muted mt-1">Mixes questions from every generated lecture</p>
            </div>
            <span className="text-accent text-sm">start →</span>
          </Link>
        </section>
      )}

      <section className="pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="eyebrow text-muted">
            {lectures.length} lecture{lectures.length !== 1 ? "s" : ""}
          </h2>
          {!adding && (
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              + New lecture
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="card p-4 mb-6 flex gap-3">
            <input
              autoFocus
              className="input"
              placeholder="e.g. Week 4 — Reaction Mechanisms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button type="submit" className="btn btn-primary whitespace-nowrap">
              Add
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAdding(false);
                setTitle("");
              }}
            >
              Cancel
            </button>
          </form>
        )}

        {lectures.length === 0 && !adding && (
          <div className="card p-10 text-center text-muted">
            <p className="mb-1">No lectures yet.</p>
            <p className="text-sm">Add one, then paste in notes or upload slide images.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {lectures.map((lecture) => {
            const due = lecture.generated ? dueCount(lecture.generated.flashcards || []) : 0;
            return (
              <div key={lecture.id} className="card p-5 flex items-center justify-between group">
                <Link href={`/course/${courseId}/lecture/${lecture.id}`} className="flex-1">
                  <p className="font-display text-lg">{lecture.title}</p>
                  <p className="text-sm text-muted mt-1">
                    {lecture.generated
                      ? `${lecture.generated.flashcards?.length || 0} cards · ${lecture.generated.quiz?.length || 0} quiz questions${due ? ` · ${due} due` : ""}`
                      : "Not generated yet"}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(lecture.id)}
                  className="text-muted hover:text-bad text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-4"
                >
                  delete
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
