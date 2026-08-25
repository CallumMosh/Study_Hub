"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCourse, getLectures } from "../../../../lib/storage";
import { uid } from "../../../../lib/storage";
import Quiz from "../../../../components/Quiz";

export default function CourseQuizPage({ params }) {
  const { courseId } = params;
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sourceLectures, setSourceLectures] = useState([]);

  useEffect(() => {
    const c = getCourse(courseId);
    if (!c) {
      router.replace("/");
      return;
    }
    setCourse(c);

    const lectures = getLectures(courseId);
    const withQuiz = lectures.filter((l) => l.generated?.quiz?.length > 0);
    setSourceLectures(withQuiz);

    const combined = withQuiz.flatMap((l) =>
      l.generated.quiz.map((q) => ({ ...q, id: uid(), lectureTitle: l.title }))
    );
    setQuestions(combined);
  }, [courseId, router]);

  if (!course) return null;

  return (
    <div>
      <section className="pt-6 pb-6 border-b border-line">
        <Link href={`/course/${courseId}`} className="eyebrow hover:text-accent">
          ← {course.name}
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl mt-3">Course quiz</h1>
        {sourceLectures.length > 0 && (
          <p className="text-sm text-muted mt-2">
            {questions.length} questions from {sourceLectures.length} lecture
            {sourceLectures.length === 1 ? "" : "s"}
          </p>
        )}
      </section>

      <section className="pt-8">
        {sourceLectures.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            <p className="mb-1">No quiz material yet.</p>
            <p className="text-sm">Generate study material for at least one lecture first.</p>
          </div>
        ) : (
          <Quiz questions={questions} />
        )}
      </section>
    </div>
  );
}
