// Simple localStorage-backed persistence for v1.
// Everything lives in the browser, scoped to this device.

const COURSES_KEY = "studyhub:courses";
const lecturesKey = (courseId) => `studyhub:lectures:${courseId}`;

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getCourses() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(COURSES_KEY), []);
}

export function addCourse(name) {
  const courses = getCourses();
  const course = { id: uid(), name, createdAt: Date.now() };
  localStorage.setItem(COURSES_KEY, JSON.stringify([course, ...courses]));
  return course;
}

export function deleteCourse(courseId) {
  const courses = getCourses().filter((c) => c.id !== courseId);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  localStorage.removeItem(lecturesKey(courseId));
}

export function getCourse(courseId) {
  return getCourses().find((c) => c.id === courseId) || null;
}

export function getLectures(courseId) {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(lecturesKey(courseId)), []);
}

export function getLecture(courseId, lectureId) {
  return getLectures(courseId).find((l) => l.id === lectureId) || null;
}

export function addLecture(courseId, title) {
  const lectures = getLectures(courseId);
  const lecture = {
    id: uid(),
    title,
    content: "",
    images: [],
    generated: null, // { summary, analogies, examples, flashcards, quiz }
    quizHistory: [], // [{ date, score, total }]
    createdAt: Date.now(),
  };
  localStorage.setItem(lecturesKey(courseId), JSON.stringify([lecture, ...lectures]));
  return lecture;
}

export function updateLecture(courseId, lectureId, updates) {
  const lectures = getLectures(courseId).map((l) =>
    l.id === lectureId ? { ...l, ...updates } : l
  );
  localStorage.setItem(lecturesKey(courseId), JSON.stringify(lectures));
  return lectures.find((l) => l.id === lectureId);
}

export function deleteLecture(courseId, lectureId) {
  const lectures = getLectures(courseId).filter((l) => l.id !== lectureId);
  localStorage.setItem(lecturesKey(courseId), JSON.stringify(lectures));
}

export { uid };
