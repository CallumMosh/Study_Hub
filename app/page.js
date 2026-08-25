"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCourses, addCourse, deleteCourse, getLectures } from "../lib/storage";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [lectureCounts, setLectureCounts] = useState({});
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const c = getCourses();
    setCourses(c);
    const counts = {};
    c.forEach((course) => {
      counts[course.id] = getLectures(course.id).length;
    });
    setLectureCounts(counts);
  }, []);

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const course = addCourse(name.trim());
    setCourses((prev) => [course, ...prev]);
    setName("");
    setAdding(false);
  }

  function handleDelete(id) {
    if (!confirm("Delete this course and all its lectures?")) return;
    deleteCourse(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <section className="pt-6 pb-14 border-b border-line">
        <p className="eyebrow mb-3">your courses</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-tight max-w-xl">
          Notes in.
          <br />
          <span className="italic text-accent">Understanding</span> out.
        </h1>
      </section>

      <section className="pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm text-muted eyebrow">
            {courses.length} course{courses.length !== 1 ? "s" : ""}
          </h2>
          {!adding && (
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              + New course
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="card p-4 mb-6 flex gap-3">
            <input
              autoFocus
              className="input"
              placeholder="e.g. Organic Chemistry"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary whitespace-nowrap">
              Add
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAdding(false);
                setName("");
              }}
            >
              Cancel
            </button>
          </form>
        )}

        {courses.length === 0 && !adding && (
          <div className="card p-10 text-center text-muted">
            <p className="mb-1">No courses yet.</p>
            <p className="text-sm">Add one to start uploading lecture notes.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="card p-5 group relative">
              <Link href={`/course/${course.id}`} className="block">
                <p className="font-display text-xl mb-2">{course.name}</p>
                <p className="text-sm text-muted">
                  {lectureCounts[course.id] || 0} lecture
                  {lectureCounts[course.id] === 1 ? "" : "s"}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(course.id)}
                className="absolute top-4 right-4 text-muted hover:text-bad text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
