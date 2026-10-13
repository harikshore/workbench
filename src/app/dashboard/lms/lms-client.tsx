"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  createSampleCourse,
  updateCourse,
  updateLesson,
  addLesson,
  deleteLesson,
  reorderLessons,
  addQuestion,
  deleteQuestion,
  updateQuestion,
  publishCourse,
  deleteCourse,
  completeLesson as completeLessonAction,
  submitQuiz,
  resetQuiz,
} from "@/actions/lms";

// -- Types --

export interface CourseData {
  id: string;
  title: string;
  description: string;
  prompt: string;
  coverImage: string | null;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  lessons: LessonData[];
  quiz: QuizData | null;
  progress: ProgressData | null;
}

export interface LessonData {
  id: string;
  order: number;
  title: string;
  description: string | null;
  videoUrl: string | null;
  content: string;
}

export interface QuizData {
  id: string;
  questions: QuestionData[];
}

export interface QuestionData {
  id: string;
  order: number;
  type: "multiple_choice" | "true_false";
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

export interface ProgressData {
  id: string;
  completedLessons: string[];
  quizAnswers: Record<string, number> | null;
  quizScore: number | null;
  quizPassed: boolean | null;
}

type Screen = "list" | "prompt" | "generating" | "editor" | "learner";

// -- Constants --

const HOW_STEPS = [
  { no: "01", t: "Describe", d: "Tell the AI what to teach in a sentence." },
  { no: "02", t: "Edit", d: "Refine the lessons, quiz and cover image." },
  { no: "03", t: "Learn", d: "Take the course as a learner." },
];

const SUGGESTIONS = [
  "Brewing great pour-over coffee",
  "Intro to stargazing",
  "Basics of bread baking",
  "Reading financial statements",
];

const GEN_STAGES: { key: string; label: string }[] = [
  { key: "title", label: "Title & description" },
  { key: "lessons", label: "Writing lessons" },
  { key: "quiz", label: "Quiz questions" },
  { key: "cover", label: "Cover image" },
];

const ARROW = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const BACK_ARROW = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
  >
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function downloadCertificate(
  course: CourseData,
  userName: string,
  scoreDisplay: string,
) {
  const W = 2000, H = 1414;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const x = cv.getContext("2d")!;

  const ink = "#201e1d", bg = "#f3f2f2", acc = "#ec3013", mute = "rgba(32,30,29,0.6)";
  const F = "Archivo, Helvetica, Arial, sans-serif";
  const L = 160;

  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = ink;
  x.lineWidth = 6;
  x.strokeRect(60, 60, W - 120, H - 120);
  x.textBaseline = "alphabetic";

  x.fillStyle = acc;
  x.fillRect(L, 172, 36, 36);
  x.fillStyle = ink;
  x.font = `800 40px ${F}`;
  x.fillText("Workbench · Pocket LMS", L + 60, 206);

  x.fillStyle = acc;
  x.font = `700 30px ${F}`;
  x.letterSpacing = "4px";
  x.fillText("CERTIFICATE OF COMPLETION", L, 380);
  x.letterSpacing = "0px";

  const fit = (t: string, w: number, max: number, wt: string) => {
    let sz = max;
    do { x.font = `${wt} ${sz}px ${F}`; sz -= 4; } while (x.measureText(t).width > w && sz > 24);
  };

  const name = userName || "Learner";
  x.fillStyle = mute;
  x.font = `400 34px ${F}`;
  x.fillText("Awarded to", L, 490);
  x.fillStyle = ink;
  fit(name, W - 2 * L, 132, "800");
  x.fillText(name, L, 630);

  x.fillStyle = mute;
  x.font = `400 34px ${F}`;
  x.fillText("for completing", L, 750);
  x.fillStyle = ink;
  fit(course.title, W - 2 * L, 64, "700");
  x.fillText(course.title, L, 840);

  x.fillStyle = ink;
  x.fillRect(L, 1040, W - 2 * L, 4);

  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const stats: [string, string][] = [
    ["COMPLETED", date],
    ["SCORE", scoreDisplay],
    ["LESSONS", `${course.lessons.length} of ${course.lessons.length}`],
  ];
  stats.forEach(([k, v], i) => {
    const cx = L + i * ((W - 2 * L) / 3);
    x.fillStyle = mute;
    x.font = `400 26px ${F}`;
    x.letterSpacing = "3px";
    x.fillText(k, cx, 1110);
    x.letterSpacing = "0px";
    x.fillStyle = ink;
    x.font = `700 40px ${F}`;
    x.fillText(v, cx, 1170);
  });

  x.fillStyle = mute;
  x.font = `400 24px ${F}`;
  x.fillText(
    `Certificate ID ${course.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    L, 1280,
  );

  cv.toBlob((b) => {
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `Certificate - ${course.title.replace(/[\\/:*?"<>|]/g, "")}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, "image/png");
}

// -- Main --

export function LmsClient({
  course: initialCourse,
  userName,
}: {
  course: CourseData | null;
  userName: string;
}) {
  const [screen, setScreen] = useState<Screen>("list");
  const [course, setCourse] = useState<CourseData | null>(initialCourse);
  const [width, setWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prompt state
  const [prompt, setPrompt] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);
  const [lessonCount, setLessonCount] = useState(4);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner",
  );

  // Generation state
  const [genStages, setGenStages] = useState<Record<string, boolean>>({
    title: false,
    lessons: false,
    quiz: false,
    cover: false,
  });
  const [genError, setGenError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Timer during generation
  useEffect(() => {
    if (screen !== "generating" || genError) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, genError]);

  const narrow = width < 760;

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setPromptError("Enter a topic first.");
      return;
    }

    setScreen("generating");
    setGenStages({ title: false, lessons: false, quiz: false, cover: false });
    setGenError(null);

    try {
      const res = await fetch("/api/lms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, lessonCount, level }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Generation failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop()!;

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const data = JSON.parse(part.slice(6));

          switch (data.stage) {
            case "title":
              setGenStages((s) => ({ ...s, title: true }));
              break;
            case "lessons":
              setGenStages((s) => ({ ...s, lessons: true }));
              break;
            case "quiz":
              setGenStages((s) => ({ ...s, quiz: true }));
              break;
            case "cover":
              setGenStages((s) => ({ ...s, cover: true }));
              break;
            case "complete":
              setCourse(data.course);
              setTimeout(() => setScreen("list"), 800);
              break;
            case "error":
              setGenError(data.message);
              break;
          }
        }
      }
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }

  async function handleUseSample() {
    setGenError(null);
    setGenStages({ title: true, lessons: true, quiz: true, cover: true });
    try {
      const saved = await createSampleCourse();
      setCourse(saved);
      setTimeout(() => setScreen("list"), 500);
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Failed to create sample course",
      );
    }
  }

  async function handleDeleteCourse() {
    if (!course) return;
    setDeleting(true);
    try {
      await deleteCourse(course.id);
      setCourse(null);
      setDeleteOpen(false);
      setScreen("list");
    } catch {
      // keep dialog open
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: "clamp(24px,4vw,40px)" }}
    >
      {screen === "list" && (
        <CourseListScreen
          course={course}
          narrow={narrow}
          onCreateCourse={() => {
            setPromptError(null);
            setScreen("prompt");
          }}
          onEditCourse={() => setScreen("editor")}
          onViewCourse={() => setScreen("learner")}
          onDeleteCourse={() => setDeleteOpen(true)}
        />
      )}
      {screen === "prompt" && (
        <PromptScreen
          prompt={prompt}
          onPromptChange={(v) => {
            setPrompt(v);
            setPromptError(null);
          }}
          promptError={promptError}
          lessonCount={lessonCount}
          onLessonCountChange={setLessonCount}
          level={level}
          onLevelChange={setLevel}
          onBack={() => setScreen("list")}
          onGenerate={handleGenerate}
        />
      )}
      {screen === "generating" && (
        <GeneratingScreen
          prompt={prompt}
          stages={genStages}
          error={genError}
          elapsed={elapsed}
          narrow={narrow}
          lessonCount={lessonCount}
          onRetry={handleGenerate}
          onUseSample={handleUseSample}
          onEditPrompt={() => setScreen("prompt")}
        />
      )}
      {screen === "editor" && course && (
        <EditorScreen
          course={course}
          narrow={narrow}
          onCourseChange={setCourse}
          onBack={() => setScreen("list")}
          onPreview={() => setScreen("learner")}
          onPublished={(c) => {
            setCourse(c);
            setScreen("learner");
          }}
          onRequestDelete={() => setDeleteOpen(true)}
        />
      )}

      {screen === "learner" && course && (
        <LearnerScreen
          course={course}
          narrow={narrow}
          userName={userName}
          onCourseChange={setCourse}
          onExit={() => setScreen("list")}
          onEdit={() => setScreen("editor")}
        />
      )}

      {/* Delete dialog */}
      {deleteOpen && course && (
        <div
          className="dialog-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
          }}
        >
          <div className="dialog" style={{ width: "100%", maxWidth: 440 }}>
            <div className="dialog-title">Delete this course?</div>
            <div className="dialog-body">
              <p style={{ margin: 0 }}>
                &ldquo;{course.title}&rdquo;, its lessons, quiz and your
                progress will be removed. This frees your sandbox slot.
              </p>
            </div>
            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                style={{ color: "var(--color-text)" }}
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDeleteCourse}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Course List Screen --

function CourseListScreen({
  course,
  narrow,
  onCreateCourse,
  onEditCourse,
  onViewCourse,
  onDeleteCourse,
}: {
  course: CourseData | null;
  narrow: boolean;
  onCreateCourse: () => void;
  onEditCourse: () => void;
  onViewCourse: () => void;
  onDeleteCourse: () => void;
}) {
  const slotLabel = course ? "1 of 1 slot" : "0 of 1 slot";

  return (
    <>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          borderBottom: "2px solid var(--color-divider)",
          paddingBottom: "var(--space-6)",
        }}
      >
        <h6 className="text-muted" style={{ margin: "0 0 var(--space-1)" }}>
          Module 03
        </h6>
        <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 56px)" }}>
          Pocket LMS
        </h1>
        <p
          className="text-muted"
          style={{ margin: 0, maxWidth: "56ch", textWrap: "pretty" }}
        >
          Describe a course in a sentence. AI drafts the lessons and a quiz —
          you edit, publish, then take it as a learner.
        </p>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, marginRight: "auto" }}>Your courses</h2>
          <span className="text-muted" style={{ fontSize: 13 }}>
            {slotLabel}
          </span>
        </div>

        {!course ? (
          <EmptyState narrow={narrow} onCreateCourse={onCreateCourse} />
        ) : (
          <CourseCard
            course={course}
            narrow={narrow}
            onEdit={onEditCourse}
            onView={onViewCourse}
            onDelete={onDeleteCourse}
          />
        )}
      </section>
    </>
  );
}

// -- Empty State --

function EmptyState({
  narrow,
  onCreateCourse,
}: {
  narrow: boolean;
  onCreateCourse: () => void;
}) {
  return (
    <div
      style={{
        border: "2px solid var(--color-divider)",
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
      }}
    >
      <div
        style={{
          padding: "var(--space-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          alignItems: "flex-start",
          borderRight: narrow ? "none" : "2px solid var(--color-divider)",
          borderBottom: narrow ? "2px solid var(--color-divider)" : "none",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 24 }}>No course yet.</div>
        <p className="text-muted" style={{ margin: 0, maxWidth: "44ch" }}>
          Your sandbox holds one course. Start from a prompt — a full draft
          takes under a minute.
        </p>
        <button
          className="btn btn-primary"
          style={{ minHeight: 44, gap: 32, margin: 0 }}
          onClick={onCreateCourse}
        >
          Create course
          {ARROW}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: narrow
            ? "1fr"
            : "repeat(3, minmax(0, 1fr))",
        }}
      >
        {HOW_STEPS.map((st, i) => (
          <div
            key={st.no}
            style={{
              padding: "var(--space-4)",
              borderLeft:
                !narrow && i > 0
                  ? "2px solid var(--color-divider)"
                  : "none",
              borderTop:
                narrow && i > 0
                  ? "2px solid var(--color-divider)"
                  : "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: "var(--color-accent)",
              }}
            >
              {st.no}
            </span>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{st.t}</span>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {st.d}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Course Card --

function CourseCard({
  course,
  narrow,
  onEdit,
  onView,
  onDelete,
}: {
  course: CourseData;
  narrow: boolean;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const isDraft = course.status === "draft";
  const lessonCount = course.lessons.length;
  const questionCount = course.quiz?.questions.length ?? 0;

  const statusTag = isDraft ? "tag-outline" : "tag-accent";
  const statusLabel = isDraft ? "Draft" : "Published";

  const stats = [
    {
      k: "Lessons",
      v: `${lessonCount} lesson${lessonCount !== 1 ? "s" : ""}`,
    },
    {
      k: "Quiz",
      v: `${questionCount} question${questionCount !== 1 ? "s" : ""}`,
    },
    { k: "Status", v: statusLabel },
  ];

  return (
    <article
      style={{
        border: "2px solid var(--color-divider)",
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
      }}
    >
      <div
        className="grayscale"
        style={{
          background: "var(--color-neutral-200)",
          minHeight: 220,
          position: "relative",
          borderRight: narrow ? "none" : "2px solid var(--color-divider)",
          borderBottom: narrow ? "2px solid var(--color-divider)" : "none",
        }}
      >
        {course.coverImage && (
          <div
            role="img"
            aria-label="Course cover"
            style={{
              position: "absolute",
              inset: 0,
              background: `center/cover no-repeat url(${course.coverImage})`,
            }}
          />
        )}
      </div>

      <div
        style={{
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span className={`tag ${statusTag}`}>{statusLabel}</span>
          <span className="text-muted" style={{ fontSize: 12 }}>
            Updated {timeAgo(course.updatedAt)}
          </span>
        </div>

        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 26,
              lineHeight: 1.15,
              textWrap: "pretty",
            }}
          >
            {course.title}
          </div>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 15,
              opacity: 0.8,
              maxWidth: "60ch",
            }}
          >
            {course.description}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            borderTop: "2px solid var(--color-divider)",
            borderBottom: "2px solid var(--color-divider)",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.k}
              style={{
                padding: "var(--space-3) var(--space-3) var(--space-3) 0",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                className="text-muted"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {s.k}
              </span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{s.v}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            className="btn btn-primary"
            style={{ minHeight: 44, gap: 32, margin: 0 }}
            disabled={isDraft}
            onClick={onView}
          >
            View course
            {ARROW}
          </button>
          <button
            className="btn btn-secondary"
            style={{ minHeight: 44, margin: 0 }}
            onClick={onEdit}
          >
            Edit course
          </button>
          <button
            className="btn btn-ghost"
            style={{ color: "var(--color-text)", marginLeft: "auto" }}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
        {isDraft && (
          <span
            className="text-muted"
            style={{ fontSize: 12, marginTop: "calc(var(--space-2) * -1)" }}
          >
            Publish the course to open it as a learner.
          </span>
        )}
      </div>
    </article>
  );
}

// -- Prompt Screen --

function PromptScreen({
  prompt,
  onPromptChange,
  promptError,
  lessonCount,
  onLessonCountChange,
  level,
  onLevelChange,
  onBack,
  onGenerate,
}: {
  prompt: string;
  onPromptChange: (v: string) => void;
  promptError: string | null;
  lessonCount: number;
  onLessonCountChange: (n: number) => void;
  level: "beginner" | "intermediate" | "advanced";
  onLevelChange: (l: "beginner" | "intermediate" | "advanced") => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          borderBottom: "2px solid var(--color-divider)",
          paddingBottom: "var(--space-6)",
        }}
      >
        <div>
          <button
            className="btn btn-ghost"
            style={{ color: "var(--color-text)", gap: 8, paddingLeft: 0 }}
            onClick={onBack}
          >
            {BACK_ARROW}
            Courses
          </button>
        </div>
        <h6 style={{ color: "var(--color-accent)", margin: 0 }}>
          01 — Prompt
        </h6>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4.5vw, 48px)",
            textWrap: "pretty",
          }}
        >
          What should the course teach?
        </h1>
        <p className="text-muted" style={{ margin: 0, maxWidth: "56ch" }}>
          A sentence or two is enough. Mention who it&apos;s for if that
          matters.
        </p>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          maxWidth: 720,
        }}
      >
        <div className="field">
          <label>Course prompt</label>
          <textarea
            className="input"
            rows={4}
            placeholder="A beginner course on brewing great pour-over coffee at home"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            style={{
              resize: "vertical",
              minHeight: 120,
              font: "inherit",
              lineHeight: 1.5,
            }}
          />
          {promptError && (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-accent-700)",
                marginTop: 5,
              }}
            >
              {promptError}
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <span
            className="text-muted"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Try one
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="btn btn-secondary"
                style={{ minHeight: 36, fontSize: 13, margin: 0 }}
                onClick={() => onPromptChange(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson count + Level */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-4)",
            flexWrap: "wrap",
          }}
        >
          <div className="field" style={{ margin: 0 }}>
            <label>Lessons</label>
            <div className="seg">
              {[3, 4, 5].map((n) => (
                <label
                  key={n}
                  className="seg-opt"
                  style={{
                    background:
                      lessonCount === n
                        ? "var(--color-accent)"
                        : "transparent",
                    color:
                      lessonCount === n
                        ? "var(--color-bg)"
                        : "var(--color-text)",
                  }}
                >
                  <input
                    type="radio"
                    name="lcount"
                    checked={lessonCount === n}
                    onChange={() => onLessonCountChange(n)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                      pointerEvents: "none",
                    }}
                  />
                  {n}
                </label>
              ))}
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>Level</label>
            <div className="seg">
              {(
                ["beginner", "intermediate", "advanced"] as const
              ).map((l) => (
                <label
                  key={l}
                  className="seg-opt"
                  style={{
                    background:
                      level === l ? "var(--color-accent)" : "transparent",
                    color:
                      level === l ? "var(--color-bg)" : "var(--color-text)",
                  }}
                >
                  <input
                    type="radio"
                    name="llevel"
                    checked={level === l}
                    onChange={() => onLevelChange(l)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                      pointerEvents: "none",
                    }}
                  />
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Generate */}
        <div
          style={{
            borderTop: "2px solid var(--color-divider)",
            paddingTop: "var(--space-4)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-primary"
            style={{ minHeight: 44, gap: 32, margin: 0 }}
            onClick={onGenerate}
          >
            Generate draft
            {ARROW}
          </button>
          <span
            className="text-muted"
            style={{ fontSize: 13, flex: "1 1 240px" }}
          >
            You&apos;ll get a title, description, cover image, lessons and a
            quiz. Everything stays editable.
          </span>
        </div>
      </section>
    </>
  );
}

// -- Video URL helpers --

function parseVideoUrl(url: string): { type: "youtube" | "vimeo" | "mp4" | "bad" | "empty"; embed?: string } {
  if (!url.trim()) return { type: "empty" };
  try {
    const u = new URL(url.trim());
    // YouTube
    let vid: string | null = null;
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      vid = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
      if (vid) return { type: "youtube", embed: `https://www.youtube.com/embed/${vid}` };
    }
    // Vimeo
    const vimeoMatch = u.pathname.match(/^\/(\d+)/);
    if (u.hostname.includes("vimeo.com") && vimeoMatch) {
      return { type: "vimeo", embed: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    }
    // mp4
    if (u.pathname.endsWith(".mp4")) return { type: "mp4", embed: url.trim() };
    return { type: "bad" };
  } catch {
    return { type: "bad" };
  }
}

// -- Stock cover images --

const STOCK_COVERS = [
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800&q=80",
];

// -- Editor Screen --

type EditorSelection = { type: "course" } | { type: "lesson"; id: string } | { type: "quiz" };

function EditorScreen({
  course,
  narrow,
  onCourseChange,
  onBack,
  onPreview,
  onPublished,
  onRequestDelete,
}: {
  course: CourseData;
  narrow: boolean;
  onCourseChange: (c: CourseData) => void;
  onBack: () => void;
  onPreview: () => void;
  onPublished: (c: CourseData) => void;
  onRequestDelete: () => void;
}) {
  const [sel, setSel] = useState<EditorSelection>({ type: "course" });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [olOpen, setOlOpen] = useState(!narrow);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [pubOpen, setPubOpen] = useState(false);
  const [pubDone, setPubDone] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!narrow) setOlOpen(true);
  }, [narrow]);

  const savedLabel = saving
    ? "Saving..."
    : savedAt
      ? `Saved ${Math.floor((Date.now() - savedAt) / 1000)}s ago`
      : "Draft";

  const markSaved = useCallback(() => {
    setSaving(false);
    setSavedAt(Date.now());
  }, []);

  // Debounced course field save
  const saveCourseField = useCallback(
    (field: string, value: string) => {
      onCourseChange({ ...course, [field]: value });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaving(true);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateCourse(course.id, { [field]: value });
          markSaved();
        } catch {
          setSaving(false);
        }
      }, 600);
    },
    [course, onCourseChange, markSaved],
  );

  // Debounced lesson field save
  const saveLessonField = useCallback(
    (lessonId: string, field: string, value: string | null) => {
      onCourseChange({
        ...course,
        lessons: course.lessons.map((l) =>
          l.id === lessonId ? { ...l, [field]: value } : l,
        ),
      });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaving(true);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateLesson(lessonId, { [field]: value });
          markSaved();
        } catch {
          setSaving(false);
        }
      }, 600);
    },
    [course, onCourseChange, markSaved],
  );

  async function handleReorder(lessonId: string, dir: "up" | "down") {
    setSaving(true);
    try {
      const updated = await reorderLessons(course.id, lessonId, dir);
      onCourseChange(updated);
      markSaved();
    } catch {
      setSaving(false);
    }
  }

  async function handleAddLesson() {
    if (course.lessons.length >= 5) return;
    setSaving(true);
    try {
      const updated = await addLesson(course.id);
      onCourseChange(updated);
      const newLesson = updated.lessons[updated.lessons.length - 1];
      setSel({ type: "lesson", id: newLesson.id });
      markSaved();
    } catch {
      setSaving(false);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    setSaving(true);
    try {
      const updated = await deleteLesson(lessonId);
      onCourseChange(updated);
      if (sel.type === "lesson" && sel.id === lessonId) {
        setSel({ type: "course" });
      }
      markSaved();
    } catch {
      setSaving(false);
    }
  }

  async function handleAddQuestion() {
    if (!course.quiz) return;
    if (course.quiz.questions.length >= 10) return;
    setSaving(true);
    try {
      const updated = await addQuestion(course.quiz.id);
      onCourseChange(updated);
      markSaved();
    } catch {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(qId: string) {
    setSaving(true);
    try {
      const updated = await deleteQuestion(qId);
      onCourseChange(updated);
      markSaved();
    } catch {
      setSaving(false);
    }
  }

  async function handleUpdateQuestion(
    qId: string,
    data: Parameters<typeof updateQuestion>[1],
  ) {
    onCourseChange({
      ...course,
      quiz: course.quiz
        ? {
            ...course.quiz,
            questions: course.quiz.questions.map((q) =>
              q.id === qId ? { ...q, ...data } : q,
            ),
          }
        : null,
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      try {
        await updateQuestion(qId, data);
        markSaved();
      } catch {
        setSaving(false);
      }
    }, 600);
  }

  async function handleShuffleCover() {
    const current = course.coverImage;
    const others = STOCK_COVERS.filter((u) => u !== current);
    const pick = others[Math.floor(Math.random() * others.length)];
    onCourseChange({ ...course, coverImage: pick });
    setSaving(true);
    try {
      await updateCourse(course.id, { coverImage: pick });
      markSaved();
    } catch {
      setSaving(false);
    }
  }

  const checks = [
    { ok: !!course.title.trim(), label: "Title set" },
    { ok: !!course.description.trim(), label: "Description set" },
    { ok: course.lessons.some((l) => l.content.trim()), label: "At least one lesson with content" },
    { ok: (course.quiz?.questions.length ?? 0) > 0, label: "Quiz has at least one question" },
    {
      ok: course.quiz?.questions.every((q) => q.text.trim()) ?? false,
      label: "All questions have text",
    },
  ];
  const allReady = checks.every((c) => c.ok);

  async function handlePublish() {
    setPublishing(true);
    try {
      const updated = await publishCourse(course.id);
      onCourseChange(updated);
      setPubDone(true);
    } catch {
      // stay on checklist
    } finally {
      setPublishing(false);
    }
  }

  const isDraft = course.status === "draft";
  const statusTag = isDraft ? "tag-outline" : "tag-accent";
  const statusLabel = isDraft ? "Draft" : "Published";

  const selectedLesson =
    sel.type === "lesson"
      ? course.lessons.find((l) => l.id === sel.id) ?? null
      : null;

  const olCurrent =
    sel.type === "course"
      ? "Course details"
      : sel.type === "quiz"
        ? "Final quiz"
        : selectedLesson?.title ?? "Lesson";

  const questionCount = course.quiz?.questions.length ?? 0;

  return (
    <>
      {/* Top bar */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "var(--space-3)",
          borderBottom: "2px solid var(--color-divider)",
          paddingBottom: "var(--space-4)",
        }}
      >
        <button
          className="btn btn-ghost"
          style={{ color: "var(--color-text)", gap: 8, paddingLeft: 0 }}
          onClick={onBack}
        >
          {BACK_ARROW}
          Courses
        </button>
        <div
          style={{
            flex: "1 1 240px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            <span className={`tag ${statusTag}`}>{statusLabel}</span>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {savedLabel}
            </span>
          </div>
          <div
            title={course.title}
            style={{
              fontWeight: 800,
              fontSize: 22,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {course.title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            flex: narrow ? "1 0 100%" : undefined,
          }}
        >
          <button
            className="btn btn-secondary"
            style={{ minHeight: 44, margin: 0, flex: "1 1 auto" }}
            onClick={onPreview}
            disabled={isDraft}
          >
            {isDraft ? "Preview" : "View course"}
          </button>
          <button
            className="btn btn-primary"
            style={{
              minHeight: 44,
              gap: 24,
              margin: 0,
              flex: "1 1 auto",
              justifyContent: "space-between",
            }}
            onClick={() => { setPubOpen(true); setPubDone(false); }}
          >
            {isDraft ? "Publish" : "Published"}
            {ARROW}
          </button>
        </div>
      </section>

      {/* Two-panel editor */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: narrow ? "1fr" : "240px 1fr",
          border: "2px solid var(--color-divider)",
          borderLeftWidth: narrow ? 0 : undefined,
          borderRightWidth: narrow ? 0 : undefined,
          marginLeft: narrow ? "calc(var(--space-4) * -1)" : 0,
          marginRight: narrow ? "calc(var(--space-4) * -1)" : 0,
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            borderRight: narrow ? "none" : "2px solid var(--color-divider)",
            borderBottom: narrow ? "2px solid var(--color-divider)" : "none",
            display: "flex",
            flexDirection: "column",
            padding: narrow ? 0 : "var(--space-2) 0",
            minWidth: 0,
          }}
        >
          {narrow && (
            <button
              className="sidebar-btn"
              onClick={() => setOlOpen(!olOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "12px var(--space-4)",
                fontSize: 14,
                fontWeight: 700,
                minHeight: 48,
              }}
            >
              <span
                className="text-muted"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Editing
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {olCurrent}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                style={{ flex: "none" }}
              >
                <path d={olOpen ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
              </svg>
            </button>
          )}

          {olOpen && (
            <>
              <button
                onClick={() => { setSel({ type: "course" }); if (narrow) setOlOpen(false); }}
                className="sidebar-btn"
                style={{
                  padding: "10px var(--space-4) 10px calc(var(--space-4) - 3px)",
                  fontWeight: 700,
                  fontSize: 14,
                  borderLeft: `3px solid ${sel.type === "course" ? "var(--color-accent)" : "transparent"}`,
                  backgroundColor:
                    sel.type === "course"
                      ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                      : undefined,
                }}
              >
                Course details
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "var(--space-4) var(--space-4) var(--space-1)",
                }}
              >
                <h6 className="text-muted" style={{ margin: 0, fontSize: 11, flex: 1 }}>
                  Lessons
                </h6>
                <span className="text-muted" style={{ fontSize: 11 }}>
                  {course.lessons.length}
                </span>
              </div>

              {course.lessons.map((l, i) => (
                <div
                  key={l.id}
                  className="hover-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderLeft: `3px solid ${sel.type === "lesson" && sel.id === l.id ? "var(--color-accent)" : "transparent"}`,
                    backgroundColor:
                      sel.type === "lesson" && sel.id === l.id
                        ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                        : undefined,
                    paddingRight: "var(--space-2)",
                  }}
                >
                  <button
                    onClick={() => { setSel({ type: "lesson", id: l.id }); if (narrow) setOlOpen(false); }}
                    className="sidebar-btn"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      gap: 10,
                      padding: "9px 0 9px calc(var(--space-4) - 3px)",
                      fontSize: 14,
                      width: "auto",
                    }}
                  >
                    <span
                      className="text-muted"
                      style={{ fontWeight: 800, fontSize: 12, paddingTop: 2 }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.title}
                    </span>
                  </button>
                  <button
                    className="btn btn-icon hover-row"
                    style={{ width: 28, height: 28, margin: 0 }}
                    title="Move up"
                    disabled={i === 0}
                    onClick={() => handleReorder(l.id, "up")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="m18 15-6-6-6 6" /></svg>
                  </button>
                  <button
                    className="btn btn-icon hover-row"
                    style={{ width: 28, height: 28, margin: 0 }}
                    title="Move down"
                    disabled={i === course.lessons.length - 1}
                    onClick={() => handleReorder(l.id, "down")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  <button
                    className="btn btn-icon hover-row"
                    style={{ width: 28, height: 28, margin: 0 }}
                    title="Delete lesson"
                    onClick={() => handleDeleteLesson(l.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </div>
              ))}

              <button
                className="btn btn-ghost"
                style={{
                  justifyContent: "flex-start",
                  gap: 8,
                  margin: "var(--space-1) var(--space-4) 0",
                  paddingLeft: 0,
                }}
                disabled={course.lessons.length >= 5}
                onClick={handleAddLesson}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 5v14M5 12h14" /></svg>
                Add lesson
              </button>

              <h6
                className="text-muted"
                style={{ padding: "var(--space-4) var(--space-4) var(--space-1)", margin: 0, fontSize: 11 }}
              >
                Assessment
              </h6>
              <button
                onClick={() => { setSel({ type: "quiz" }); if (narrow) setOlOpen(false); }}
                className="sidebar-btn"
                style={{
                  padding: "10px var(--space-4) 10px calc(var(--space-4) - 3px)",
                  fontSize: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  borderLeft: `3px solid ${sel.type === "quiz" ? "var(--color-accent)" : "transparent"}`,
                  backgroundColor:
                    sel.type === "quiz"
                      ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                      : undefined,
                }}
              >
                <span style={{ fontWeight: 700 }}>Final quiz</span>
                <span className="text-muted">
                  {questionCount} Q{questionCount !== 1 ? "s" : ""}
                </span>
              </button>
            </>
          )}
        </nav>

        {/* Content pane */}
        <div
          style={{
            padding: narrow ? "var(--space-4)" : "var(--space-6)",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {sel.type === "course" && (
            <CourseDetailsPane
              course={course}
              onFieldChange={saveCourseField}
              onShuffleCover={handleShuffleCover}
            />
          )}
          {sel.type === "lesson" && selectedLesson && (
            <LessonEditorPane
              lesson={selectedLesson}
              index={course.lessons.findIndex((l) => l.id === selectedLesson.id)}
              onFieldChange={saveLessonField}
            />
          )}
          {sel.type === "quiz" && course.quiz && (
            <QuizEditorPane
              quiz={course.quiz}
              narrow={narrow}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onAddQuestion={handleAddQuestion}
            />
          )}
        </div>
      </section>

      {/* Publish dialog */}
      {pubOpen && (
        <div
          className="dialog-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: "var(--space-4)",
          }}
        >
          <div className="dialog" style={{ width: "100%", maxWidth: 480 }}>
            {!pubDone ? (
              <>
                <div className="dialog-title">
                  {allReady ? "Ready to publish" : "Not quite ready"}
                </div>
                <div
                  className="dialog-body"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <p style={{ margin: "0 0 var(--space-3)" }}>
                    {allReady
                      ? "Everything looks good. Publish to make the course available as a learner."
                      : "Fix these items before publishing."}
                  </p>
                  {checks.map((ch) => (
                    <div
                      key={ch.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        padding: "8px 0",
                        borderTop: "1px solid var(--color-divider)",
                        color: ch.ok
                          ? "var(--color-text)"
                          : "var(--color-accent-700)",
                        fontSize: 14,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="square"
                      >
                        <path
                          d={
                            ch.ok
                              ? "M20 6L9 17l-5-5"
                              : "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 8v4M12 16h.01"
                          }
                        />
                      </svg>
                      {ch.label}
                    </div>
                  ))}
                </div>
                <div className="dialog-actions">
                  <button
                    className="btn btn-ghost"
                    style={{ color: "var(--color-text)" }}
                    onClick={() => setPubOpen(false)}
                    disabled={publishing}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ gap: 24 }}
                    disabled={!allReady || publishing}
                    onClick={handlePublish}
                  >
                    {publishing ? "Publishing..." : "Publish"}
                    {ARROW}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="dialog-title">Your course is live.</div>
                <div className="dialog-body">
                  <p style={{ margin: 0 }}>
                    &ldquo;{course.title}&rdquo; is published. Open it from your
                    course list any time — edits you make go live right away.
                  </p>
                </div>
                <div className="dialog-actions">
                  <button
                    className="btn btn-ghost"
                    style={{ color: "var(--color-text)" }}
                    onClick={() => {
                      setPubOpen(false);
                      onBack();
                    }}
                  >
                    Back to courses
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ gap: 24 }}
                    onClick={() => {
                      setPubOpen(false);
                      onPublished(course);
                    }}
                  >
                    View course
                    {ARROW}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// -- Course Details Pane --

function CourseDetailsPane({
  course,
  onFieldChange,
  onShuffleCover,
}: {
  course: CourseData;
  onFieldChange: (field: string, value: string) => void;
  onShuffleCover: () => void;
}) {
  return (
    <>
      <h6 className="text-muted" style={{ margin: 0 }}>
        Course details
      </h6>
      <div className="field" style={{ margin: 0 }}>
        <label>Cover image</label>
        <div
          className="grayscale"
          style={{
            position: "relative",
            aspectRatio: "16/9",
            maxWidth: 560,
            background: "var(--color-neutral-200)",
            border: "2px solid var(--color-divider)",
          }}
        >
          {course.coverImage && (
            <div
              role="img"
              aria-label="Course cover"
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${course.coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            flexWrap: "wrap",
            marginTop: "var(--space-2)",
            alignItems: "center",
          }}
        >
          <button
            className="btn btn-ghost"
            style={{ color: "var(--color-text)", gap: 8 }}
            onClick={onShuffleCover}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M2 18h3l9-12h4M2 6h3l3 4M14 18h4M18 3l3 3-3 3M18 15l3 3-3 3" /></svg>
            Try another photo
          </button>
        </div>
        <div className="text-muted" style={{ fontSize: 12, marginTop: 5 }}>
          Stock photo from the draft — replace it with your own.
        </div>
      </div>
      <div className="field" style={{ margin: 0, maxWidth: 640 }}>
        <label>Title</label>
        <input
          className="input"
          value={course.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
        />
      </div>
      <div className="field" style={{ margin: 0, maxWidth: 640 }}>
        <label>Short description</label>
        <textarea
          className="input"
          rows={3}
          value={course.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          style={{ resize: "vertical", font: "inherit", lineHeight: 1.5 }}
        />
      </div>
      <div
        className="text-muted"
        style={{
          fontSize: 12,
          borderTop: "2px solid var(--color-divider)",
          paddingTop: "var(--space-3)",
          maxWidth: 640,
        }}
      >
        Drafted from: &ldquo;{course.prompt}&rdquo;
      </div>
    </>
  );
}

// -- Lesson Editor Pane --

function LessonEditorPane({
  lesson,
  index,
  onFieldChange,
}: {
  lesson: LessonData;
  index: number;
  onFieldChange: (lessonId: string, field: string, value: string | null) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const video = parseVideoUrl(lesson.videoUrl ?? "");
  const prevIdRef = useRef(lesson.id);

  useEffect(() => {
    if (editorRef.current && (prevIdRef.current !== lesson.id || !editorRef.current.innerHTML)) {
      editorRef.current.innerHTML = lesson.content;
      prevIdRef.current = lesson.id;
    }
  }, [lesson.id, lesson.content]);

  function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }

  const toolbar: { label: string; title: string; cmd: string; value?: string; weight?: number; fs?: string }[] = [
    { label: "B", title: "Bold", cmd: "bold", weight: 700 },
    { label: "I", title: "Italic", cmd: "italic", fs: "italic" },
    { label: "H3", title: "Heading", cmd: "formatBlock", value: "h3", weight: 700 },
    { label: "•", title: "Bullet list", cmd: "insertUnorderedList" },
    { label: "1.", title: "Numbered list", cmd: "insertOrderedList" },
    { label: "“", title: "Blockquote", cmd: "formatBlock", value: "blockquote" },
    { label: "🔗", title: "Link", cmd: "createLink" },
  ];

  return (
    <>
      <h6 className="text-muted" style={{ margin: 0 }}>
        Lesson {String(index + 1).padStart(2, "0")}
      </h6>
      <div className="field" style={{ margin: 0, maxWidth: 640 }}>
        <label>Lesson title</label>
        <input
          className="input"
          value={lesson.title}
          onChange={(e) => onFieldChange(lesson.id, "title", e.target.value)}
        />
      </div>
      <div className="field" style={{ margin: 0, maxWidth: 640 }}>
        <label>Short description</label>
        <textarea
          className="input"
          rows={2}
          value={lesson.description ?? ""}
          onChange={(e) =>
            onFieldChange(lesson.id, "description", e.target.value || null)
          }
          style={{ resize: "vertical", font: "inherit", lineHeight: 1.5 }}
        />
      </div>
      <div className="field" style={{ margin: 0, maxWidth: 640 }}>
        <label>Video</label>
        <input
          className="input"
          placeholder="Paste a YouTube, Vimeo or .mp4 link"
          value={lesson.videoUrl ?? ""}
          onChange={(e) =>
            onFieldChange(lesson.id, "videoUrl", e.target.value || null)
          }
        />
        {video.type === "youtube" || video.type === "vimeo" ? (
          <iframe
            title="Lesson video"
            src={video.embed}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            style={{
              width: "100%",
              aspectRatio: "16/9",
              border: 0,
              display: "block",
              marginTop: "var(--space-2)",
              background: "var(--color-text)",
            }}
          />
        ) : video.type === "mp4" ? (
          <video
            controls
            src={video.embed}
            style={{
              width: "100%",
              aspectRatio: "16/9",
              display: "block",
              marginTop: "var(--space-2)",
              background: "var(--color-text)",
            }}
          />
        ) : video.type === "bad" ? (
          <div style={{ fontSize: 12, color: "var(--color-accent-700)", marginTop: 5 }}>
            That link isn&apos;t a YouTube, Vimeo or .mp4 video.
          </div>
        ) : (
          <div className="text-muted" style={{ fontSize: 12, marginTop: 5 }}>
            Optional — paste a video link to embed it in the lesson.
          </div>
        )}
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Lesson content</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            border: "2px solid var(--color-divider)",
            borderBottom: 0,
          }}
        >
          {toolbar.map((tb) => (
            <button
              key={tb.cmd + (tb.value ?? "")}
              className="toolbar-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                if (tb.cmd === "createLink") {
                  const url = window.prompt("Link URL:");
                  if (url) execCmd(tb.cmd, url);
                } else {
                  execCmd(tb.cmd, tb.value);
                }
              }}
              title={tb.title}
              style={{
                fontWeight: tb.weight ?? 400,
                fontStyle: tb.fs ?? "normal",
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={() => {
            if (editorRef.current) {
              onFieldChange(lesson.id, "content", editorRef.current.innerHTML);
            }
          }}
          style={{
            border: "2px solid var(--color-divider)",
            padding: "var(--space-4)",
            minHeight: 320,
            fontSize: 16,
            lineHeight: 1.6,
            outline: "none",
            background: "var(--color-bg)",
          }}
        />
      </div>
    </>
  );
}

// -- Quiz Editor Pane --

function QuizEditorPane({
  quiz,
  narrow,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestion,
}: {
  quiz: QuizData;
  narrow: boolean;
  onUpdateQuestion: (qId: string, data: Parameters<typeof updateQuestion>[1]) => void;
  onDeleteQuestion: (qId: string) => void;
  onAddQuestion: () => void;
}) {
  return (
    <>
      <div>
        <h6 className="text-muted" style={{ margin: "0 0 var(--space-2)" }}>
          Final quiz
        </h6>
        <p className="text-muted" style={{ margin: 0, fontSize: 14, maxWidth: "60ch" }}>
          Learners see whether they&apos;re right after each answer, with your
          explanation. Pass mark is 70%.
        </p>
      </div>

      {quiz.questions.map((q) => (
        <div
          key={q.id}
          style={{
            border: "2px solid var(--color-divider)",
            padding: narrow ? "var(--space-3)" : "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            maxWidth: 720,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2) var(--space-3)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 13 }}>
              Q{q.order + 1}
            </span>
            <div className="seg" style={{ order: narrow ? 2 : undefined }}>
              {(["multiple_choice", "true_false"] as const).map((t) => (
                <label
                  key={t}
                  className="seg-opt"
                  style={{
                    background:
                      q.type === t ? "var(--color-accent)" : "transparent",
                    color:
                      q.type === t ? "var(--color-bg)" : "var(--color-text)",
                  }}
                >
                  <input
                    type="radio"
                    name={`qtype-${q.id}`}
                    checked={q.type === t}
                    onChange={() => onUpdateQuestion(q.id, { type: t })}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      width: 0,
                      height: 0,
                      pointerEvents: "none",
                    }}
                  />
                  {t === "multiple_choice" ? "Multiple choice" : "True / False"}
                </label>
              ))}
            </div>
            <button
              className="btn btn-icon hover-row"
              style={{ width: 28, height: 28, margin: "0 0 0 auto", order: 1 }}
              title="Delete question"
              onClick={() => onDeleteQuestion(q.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <input
            className="input"
            placeholder="Question"
            value={q.text}
            onChange={(e) => onUpdateQuestion(q.id, { text: e.target.value })}
            style={{ fontWeight: 600 }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <span className="text-muted" style={{ fontSize: 12 }}>
              Choose the correct answer
            </span>
            {q.options.map((opt, oi) => (
              <div
                key={oi}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <label className="radio" style={{ margin: 0, flex: "none" }}>
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctIndex === oi}
                    onChange={() => onUpdateQuestion(q.id, { correctIndex: oi })}
                  />
                  <span className="dot" />
                </label>
                {q.type === "multiple_choice" ? (
                  <input
                    className="input"
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...q.options];
                      newOpts[oi] = e.target.value;
                      onUpdateQuestion(q.id, { options: newOpts });
                    }}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                ) : (
                  <span style={{ fontSize: 15, padding: "8px 0" }}>{opt}</span>
                )}
              </div>
            ))}
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>Explanation</label>
            <input
              className="input"
              placeholder="Why this is the answer"
              value={q.explanation ?? ""}
              onChange={(e) =>
                onUpdateQuestion(q.id, {
                  explanation: e.target.value || null,
                })
              }
            />
          </div>
        </div>
      ))}

      <div>
        <button
          className="btn btn-secondary"
          style={{ gap: 8, margin: 0 }}
          disabled={quiz.questions.length >= 10}
          onClick={onAddQuestion}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M12 5v14M5 12h14" /></svg>
          Add question
        </button>
      </div>
    </>
  );
}

// -- Learner Screen --

type LearnerSub = "intro" | "lesson" | "quiz" | "results";

function LearnerScreen({
  course,
  narrow,
  userName,
  onCourseChange,
  onExit,
  onEdit,
}: {
  course: CourseData;
  narrow: boolean;
  userName: string;
  onCourseChange: (c: CourseData) => void;
  onExit: () => void;
  onEdit: () => void;
}) {
  const [sub, setSub] = useState<LearnerSub>("intro");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [olOpen, setOlOpen] = useState(!narrow);
  const contentRef = useRef<HTMLDivElement>(null);

  const progress = course.progress;
  const completedSet = new Set(progress?.completedLessons ?? []);
  const totalLessons = course.lessons.length;
  const completedCount = completedSet.size;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const questions = course.quiz?.questions ?? [];
  const currentQ = questions[qIdx] ?? null;

  useEffect(() => {
    if (!narrow) setOlOpen(true);
  }, [narrow]);

  useEffect(() => {
    if (sub === "lesson" && contentRef.current && course.lessons[lessonIdx]) {
      contentRef.current.innerHTML = course.lessons[lessonIdx].content;
    }
  }, [sub, lessonIdx, course.lessons]);

  async function handleCompleteLesson() {
    const lesson = course.lessons[lessonIdx];
    if (!lesson) return;

    try {
      const prog = await completeLessonAction(course.id, lesson.id);
      onCourseChange({ ...course, progress: prog });
    } catch { /* continue anyway */ }

    if (lessonIdx < totalLessons - 1) {
      setLessonIdx(lessonIdx + 1);
    } else {
      if (questions.length > 0) {
        setQIdx(0);
        setPicked(null);
        setAnswers({});
        setSub("quiz");
      } else {
        setSub("results");
      }
    }
  }

  function handlePick(optIdx: number) {
    if (picked !== null || !currentQ) return;
    setPicked(optIdx);
    setAnswers((a) => ({ ...a, [currentQ.id]: optIdx }));
  }

  async function handleNextQuestion() {
    setPicked(null);
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      try {
        const finalAnswers = { ...answers };
        const prog = await submitQuiz(course.id, finalAnswers);
        onCourseChange({ ...course, progress: prog });
      } catch { /* show results anyway */ }
      setSub("results");
    }
  }

  async function handleRetake() {
    try {
      await resetQuiz(course.id);
      onCourseChange({
        ...course,
        progress: course.progress
          ? { ...course.progress, quizAnswers: null, quizScore: null, quizPassed: null }
          : null,
      });
    } catch { /* continue */ }
    setQIdx(0);
    setPicked(null);
    setAnswers({});
    setSub("quiz");
  }

  function startLearning() {
    const firstIncomplete = course.lessons.findIndex((l) => !completedSet.has(l.id));
    setLessonIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
    setSub("lesson");
  }

  const currentLesson = course.lessons[lessonIdx] ?? null;
  const video = currentLesson ? parseVideoUrl(currentLesson.videoUrl ?? "") : null;

  const olCurrent =
    sub === "intro"
      ? "Overview"
      : sub === "lesson"
        ? currentLesson?.title ?? "Lesson"
        : sub === "quiz"
          ? "Final quiz"
          : "Results";

  const quizScore = progress?.quizScore;
  const quizPassed = progress?.quizPassed;
  const scoreDisplay = quizScore != null ? `${Math.round(quizScore * 100)}%` : "—";

  // sidebar items
  const sidebarItems = [
    ...course.lessons.map((l, i) => ({
      id: l.id,
      label: l.title,
      done: completedSet.has(l.id),
      active: sub === "lesson" && lessonIdx === i,
      meta: completedSet.has(l.id) ? "Done" : "",
      onClick: () => { setLessonIdx(i); setSub("lesson"); if (narrow) setOlOpen(false); },
    })),
    ...(questions.length > 0
      ? [{
          id: "quiz",
          label: "Final quiz",
          done: quizPassed === true,
          active: sub === "quiz" || sub === "results",
          meta: quizScore != null ? scoreDisplay : `${questions.length} Qs`,
          onClick: () => {
            if (quizScore != null) { setSub("results"); }
            else { setQIdx(0); setPicked(null); setAnswers({}); setSub("quiz"); }
            if (narrow) setOlOpen(false);
          },
        }]
      : []),
  ];

  return (
    <>
      {/* Dark banner */}
      <section
        style={{
          background: "var(--color-text)",
          color: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "10px var(--space-4)",
          flexWrap: "wrap",
          marginLeft: narrow ? "calc(var(--space-4) * -1)" : 0,
          marginRight: narrow ? "calc(var(--space-4) * -1)" : 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Learner view
        </span>
        <span style={{ fontSize: 13, flex: "1 1 200px", minWidth: 0, opacity: 0.85 }}>
          You&apos;re previewing the course as a learner.
        </span>
        <button
          className="btn learner-exit"
          style={{
            background: "transparent",
            color: "var(--color-bg)",
            border: "2px solid var(--color-bg)",
            minHeight: 36,
            margin: 0,
            gap: 8,
          }}
          onClick={onExit}
        >
          {BACK_ARROW}
          Exit
        </button>
      </section>

      {/* Two-panel layout */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: narrow ? "1fr" : "240px 1fr",
          border: "2px solid var(--color-divider)",
          borderLeftWidth: narrow ? 0 : undefined,
          borderRightWidth: narrow ? 0 : undefined,
          marginLeft: narrow ? "calc(var(--space-4) * -1)" : 0,
          marginRight: narrow ? "calc(var(--space-4) * -1)" : 0,
        }}
      >
        {/* Sidebar */}
        <nav
          style={{
            borderRight: narrow ? "none" : "2px solid var(--color-divider)",
            borderBottom: narrow ? "2px solid var(--color-divider)" : "none",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Course title + progress */}
          <div
            style={{
              padding: "var(--space-4)",
              borderBottom: "2px solid var(--color-divider)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
              {course.title}
            </span>
            <div style={{ height: 6, background: "var(--color-neutral-200)" }}>
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--color-accent)",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {completedCount} of {totalLessons} lessons complete
            </span>
          </div>

          {narrow && (
            <button
              className="sidebar-btn"
              onClick={() => setOlOpen(!olOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "12px var(--space-4)",
                fontSize: 14,
                fontWeight: 700,
                minHeight: 48,
              }}
            >
              <span
                className="text-muted"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Now
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {olCurrent}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                style={{ flex: "none" }}
              >
                <path d={olOpen ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
              </svg>
            </button>
          )}

          {olOpen && (
            <div
              style={{
                padding: "var(--space-2) 0",
                display: "flex",
                flexDirection: "column",
                borderTop: narrow ? "2px solid var(--color-divider)" : "none",
              }}
            >
              {sidebarItems.map((it) => (
                <button
                  key={it.id}
                  onClick={it.onClick}
                  className="sidebar-btn hover-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px var(--space-4) 9px calc(var(--space-4) - 3px)",
                    fontSize: 14,
                    borderLeft: `3px solid ${it.active ? "var(--color-accent)" : "transparent"}`,
                    backgroundColor: it.active
                      ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                      : undefined,
                    fontWeight: it.active ? 700 : 400,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      flex: "none",
                      boxSizing: "border-box",
                      border: `2px solid ${it.done ? "var(--color-accent)" : "var(--color-divider)"}`,
                      background: it.done ? "var(--color-accent)" : "transparent",
                      color: "var(--color-bg)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {it.done && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {it.label}
                  </span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {it.meta}
                  </span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Content */}
        <div
          style={{
            padding: narrow ? "var(--space-4)" : "var(--space-6)",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {/* Intro */}
          {sub === "intro" && (
            <>
              <div
                className="grayscale"
                style={{
                  position: "relative",
                  aspectRatio: "21/9",
                  background: "var(--color-neutral-200)",
                }}
              >
                {course.coverImage && (
                  <div
                    role="img"
                    aria-label="Course cover"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${course.coverImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}
              </div>
              <div style={{ maxWidth: "64ch" }}>
                <h6 className="text-muted" style={{ margin: "0 0 var(--space-2)" }}>
                  Course
                </h6>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(28px, 4.5vw, 48px)",
                    textWrap: "pretty",
                  }}
                >
                  {course.title}
                </h1>
                <p
                  style={{
                    margin: "var(--space-3) 0 0",
                    fontSize: 17,
                    opacity: 0.85,
                  }}
                >
                  {course.description}
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                  borderTop: "2px solid var(--color-divider)",
                  borderBottom: "2px solid var(--color-divider)",
                  maxWidth: 720,
                }}
              >
                {[
                  { k: "Lessons", v: `${totalLessons}` },
                  { k: "Quiz", v: `${questions.length} questions` },
                  { k: "Progress", v: `${pct}%` },
                ].map((cs) => (
                  <div
                    key={cs.k}
                    style={{
                      padding: "var(--space-3) var(--space-3) var(--space-3) 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      className="text-muted"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {cs.k}
                    </span>
                    <span style={{ fontWeight: 700 }}>{cs.v}</span>
                  </div>
                ))}
              </div>
              <div>
                <button
                  className="btn btn-primary"
                  style={{ minHeight: 44, gap: 32, margin: 0 }}
                  onClick={startLearning}
                >
                  {completedCount > 0 ? "Continue learning" : "Start learning"}
                  {ARROW}
                </button>
              </div>
            </>
          )}

          {/* Lesson */}
          {sub === "lesson" && currentLesson && (
            <>
              <div style={{ maxWidth: "68ch" }}>
                <h6 className="text-muted" style={{ margin: "0 0 var(--space-2)" }}>
                  Lesson {lessonIdx + 1} of {totalLessons}
                </h6>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(28px, 4vw, 44px)",
                    textWrap: "pretty",
                  }}
                >
                  {currentLesson.title}
                </h1>
                {currentLesson.description && (
                  <p
                    className="text-muted"
                    style={{ margin: "var(--space-2) 0 0", fontSize: 17 }}
                  >
                    {currentLesson.description}
                  </p>
                )}
              </div>
              {video?.type === "youtube" || video?.type === "vimeo" ? (
                <iframe
                  title="Lesson video"
                  src={video.embed}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  style={{
                    width: "100%",
                    maxWidth: 880,
                    aspectRatio: "16/9",
                    border: 0,
                    display: "block",
                    background: "var(--color-text)",
                  }}
                />
              ) : video?.type === "mp4" ? (
                <video
                  controls
                  src={video.embed}
                  style={{
                    width: "100%",
                    maxWidth: 880,
                    aspectRatio: "16/9",
                    display: "block",
                    background: "var(--color-text)",
                  }}
                />
              ) : null}
              <div
                ref={contentRef}
                style={{ maxWidth: "68ch", fontSize: 17, lineHeight: 1.65 }}
              />
              <div
                style={{
                  borderTop: "2px solid var(--color-divider)",
                  paddingTop: "var(--space-4)",
                  display: "flex",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                  alignItems: "center",
                  maxWidth: 880,
                }}
              >
                {lessonIdx > 0 && (
                  <button
                    className="btn btn-ghost"
                    style={{ color: "var(--color-text)", gap: 8, paddingLeft: 0 }}
                    onClick={() => setLessonIdx(lessonIdx - 1)}
                  >
                    {BACK_ARROW}
                    Previous lesson
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  style={{ minHeight: 44, gap: 32, margin: "0 0 0 auto" }}
                  onClick={handleCompleteLesson}
                >
                  {lessonIdx < totalLessons - 1
                    ? "Complete & next"
                    : questions.length > 0
                      ? "Complete & start quiz"
                      : "Complete course"}
                  {ARROW}
                </button>
              </div>
            </>
          )}

          {/* Quiz */}
          {sub === "quiz" && currentQ && (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                  maxWidth: 720,
                }}
              >
                <h6 className="text-muted" style={{ margin: 0 }}>
                  Question {qIdx + 1} of {questions.length}
                </h6>
                <div style={{ display: "flex", gap: 4 }}>
                  {questions.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        flex: 1,
                        height: 6,
                        background:
                          i < qIdx
                            ? "var(--color-accent)"
                            : i === qIdx
                              ? "var(--color-text)"
                              : "var(--color-neutral-200)",
                      }}
                    />
                  ))}
                </div>
                <h2
                  style={{
                    margin: "var(--space-2) 0 0",
                    textWrap: "pretty",
                  }}
                >
                  {currentQ.text}
                </h2>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  maxWidth: 720,
                }}
              >
                {currentQ.options.map((opt, oi) => {
                  const isCorrect = oi === currentQ.correctIndex;
                  const isPicked = picked === oi;
                  const locked = picked !== null;
                  let bd = "var(--color-divider)";
                  let bg = "transparent";
                  let col = "var(--color-text)";
                  let op = "1";
                  let status = "";

                  if (locked) {
                    if (isCorrect) {
                      bd = "var(--color-accent)";
                      bg = "var(--color-accent-100)";
                      status = "Correct";
                    } else if (isPicked) {
                      bd = "var(--color-accent-700)";
                      bg = "color-mix(in srgb, var(--color-accent-700) 8%, transparent)";
                      col = "var(--color-accent-700)";
                      status = "Wrong";
                    } else {
                      op = "0.4";
                    }
                  }

                  return (
                    <button
                      key={oi}
                      className="quiz-opt"
                      onClick={() => handlePick(oi)}
                      disabled={locked}
                      style={{
                        background: bg,
                        border: `2px solid ${bd}`,
                        cursor: locked ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "14px var(--space-4)",
                        color: col,
                        opacity: op,
                        fontSize: 16,
                        fontWeight: 600,
                        minHeight: 56,
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: 13, width: 18 }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span style={{ flex: 1 }}>{opt}</span>
                      {status && (
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          {status}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {picked !== null && (
                <div
                  style={{
                    maxWidth: 720,
                    borderTop: "2px solid var(--color-divider)",
                    paddingTop: "var(--space-4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      color:
                        picked === currentQ.correctIndex
                          ? "var(--color-accent)"
                          : "var(--color-accent-700)",
                    }}
                  >
                    {picked === currentQ.correctIndex ? "Correct!" : "Not quite."}
                  </div>
                  {currentQ.explanation && (
                    <p style={{ margin: 0, fontSize: 15, opacity: 0.85 }}>
                      {currentQ.explanation}
                    </p>
                  )}
                  <div>
                    <button
                      className="btn btn-primary"
                      style={{ minHeight: 44, gap: 32, margin: 0 }}
                      onClick={handleNextQuestion}
                    >
                      {qIdx < questions.length - 1 ? "Next question" : "See results"}
                      {ARROW}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Results */}
          {sub === "results" && (
            <>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                  gap: "var(--space-4)",
                  borderBottom: "2px solid var(--color-divider)",
                  paddingBottom: "var(--space-4)",
                  maxWidth: 880,
                }}
              >
                <div>
                  <h6 className="text-muted" style={{ margin: "0 0 var(--space-2)" }}>
                    Quiz results
                  </h6>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "clamp(56px, 9vw, 96px)",
                      lineHeight: 0.9,
                    }}
                  >
                    {scoreDisplay}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                    paddingBottom: 6,
                  }}
                >
                  <span
                    className={`tag ${quizPassed ? "tag-accent" : "tag-outline"}`}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {quizPassed ? "Passed" : "Not passed"}
                  </span>
                  <span className="text-muted" style={{ fontSize: 14 }}>
                    {quizPassed
                      ? `You scored above the 70% pass mark.`
                      : `Score needed: 70%. You can retake the quiz.`}
                  </span>
                </div>
              </div>

              {/* Certificate */}
              {quizPassed && (
                <div
                  style={{
                    border: "2px solid var(--color-text)",
                    padding: "clamp(20px, 4vw, 40px)",
                    maxWidth: 880,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                    background: "var(--color-bg)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontWeight: 800,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        background: "var(--color-accent)",
                        display: "block",
                      }}
                    />
                    Workbench &middot; Pocket LMS
                  </div>
                  <h6 style={{ color: "var(--color-accent)", margin: "var(--space-3) 0 0" }}>
                    Certificate of completion
                  </h6>
                  {userName && (
                    <div>
                      <div className="text-muted" style={{ fontSize: 14 }}>
                        Awarded to
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "clamp(32px, 5vw, 52px)",
                          lineHeight: 1.05,
                        }}
                      >
                        {userName}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted" style={{ fontSize: 14 }}>
                      for completing
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 22, textWrap: "pretty" }}>
                      {course.title}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                      borderTop: "2px solid var(--color-divider)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    {[
                      { k: "Score", v: scoreDisplay },
                      { k: "Lessons", v: `${totalLessons} completed` },
                      {
                        k: "Date",
                        v: new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }),
                      },
                    ].map((cs) => (
                      <div
                        key={cs.k}
                        style={{
                          padding: "var(--space-3) var(--space-3) 0 0",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span
                          className="text-muted"
                          style={{
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          {cs.k}
                        </span>
                        <span style={{ fontWeight: 700 }}>{cs.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not passed hint */}
              {!quizPassed && (
                <div
                  style={{
                    border: "2px solid var(--color-divider)",
                    padding: "var(--space-4)",
                    maxWidth: 880,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>Almost there</div>
                  <div className="text-muted" style={{ fontSize: 14 }}>
                    Review the lessons and retake the quiz to earn your certificate. You need 70% to pass.
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                {quizPassed && (
                  <button
                    className="btn btn-primary"
                    style={{ minHeight: 44, gap: 32, margin: 0 }}
                    onClick={() => downloadCertificate(course, userName, scoreDisplay)}
                  >
                    Download certificate
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                      <path d="M12 3v12M7 10l5 5 5-5M3 21h18" />
                    </svg>
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  style={{ minHeight: 44, margin: 0 }}
                  onClick={handleRetake}
                >
                  Retake quiz
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ color: "var(--color-text)" }}
                  onClick={() => setSub("intro")}
                >
                  Course overview
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

// -- Generating Screen --

function WaveGrid({ stage, narrow, lessonCount }: { stage: number; narrow: boolean; lessonCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [aw, setAw] = useState(340);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setAw(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const R = narrow ? 4 : 8;
  const C = Math.max(narrow ? 12 : 8, Math.round((aw - 10) / (narrow ? 22 : 34)));
  const per = R / 4;
  const err = stage < 0;
  const rnd = (i: number) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const labels = ["Outline", "Lessons", "Quiz", "Cover"];

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const band = Math.floor(r / per);
      const i = r * C + c;
      const j = rnd(i);
      let st: React.CSSProperties;

      if (err) {
        st = {
          backgroundColor: band < Math.max(0, stage) ? "var(--color-neutral-400)" : "transparent",
          outline: "1px solid var(--color-neutral-200)",
        };
      } else if (band < stage) {
        st = {
          backgroundColor: j > 0.86 ? "var(--color-accent)" : "var(--color-text)",
          animation: `wbLand .5s ${(c * 0.03 + j * 0.15).toFixed(2)}s both`,
        };
      } else if (band === stage) {
        st = {
          animation: `wbWave ${(1.6 + j * 0.9).toFixed(2)}s ${((c + (r % per) * 2) * 0.09 + j * 0.4).toFixed(2)}s infinite ease-in-out`,
          outline: "1px solid var(--color-neutral-200)",
        };
      } else {
        st = {
          backgroundColor: "var(--color-neutral-200)",
          animation: `wbIdle 2.4s ${(j * 2.4).toFixed(2)}s infinite ease-in-out`,
        };
      }

      cells.push(
        <span
          key={`${i}-${band < stage ? "d" : band === stage ? "a" : "p"}${err ? "e" : ""}`}
          style={{ aspectRatio: "1", ...st }}
        />,
      );
    }
  }

  const bandPct = 100 / 4;

  return (
    <div ref={ref} data-wb="1" aria-hidden="true" style={{ border: "2px solid var(--color-text)", background: "var(--color-bg)" }}>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${C},minmax(0,1fr))`, gap: 3, padding: 3, background: "var(--color-bg)" }}>
        {cells}
        {!err && stage < 4 && (
          <span style={{
            position: "absolute", left: 0, right: 0,
            top: `${stage * bandPct}%`, height: `${bandPct}%`,
            transition: "top .5s", pointerEvents: "none",
            borderTop: "2px solid var(--color-text)", borderBottom: "2px solid var(--color-text)",
            boxSizing: "border-box",
          }}>
            <span style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: "var(--color-accent)",
              animation: "wbSweep 1.8s ease-in-out infinite alternate",
            }} />
          </span>
        )}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderTop: "2px solid var(--color-text)",
        fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        <span style={{
          width: 10, height: 10, flex: "none",
          background: err ? "var(--color-neutral-400)" : "var(--color-accent)",
          animation: err ? "none" : "wbBlink 1s steps(1) infinite",
        }} />
        <span style={{ flex: 1 }}>
          {err ? "Stopped" : `Stage ${String(Math.min(stage, 3) + 1).padStart(2, "0")} / 04`}
        </span>
        <span style={{
          fontWeight: 400, opacity: 0.7, letterSpacing: 0,
          textTransform: "none", fontFamily: "'Courier New',Courier,monospace",
        }}>
          {err ? "—" : `${labels[Math.min(stage, 3)].toLowerCase()}${stage === 1 ? `[${lessonCount}]` : ""}…`}
        </span>
      </div>
    </div>
  );
}

function GeneratingScreen({
  prompt,
  stages,
  error,
  elapsed,
  narrow,
  lessonCount,
  onRetry,
  onUseSample,
  onEditPrompt,
}: {
  prompt: string;
  stages: Record<string, boolean>;
  error: string | null;
  elapsed: number;
  narrow: boolean;
  lessonCount: number;
  onRetry: () => void;
  onUseSample: () => void;
  onEditPrompt: () => void;
}) {
  const allDone = GEN_STAGES.every((s) => stages[s.key]);
  const title = error
    ? "Something went wrong"
    : allDone
      ? "Your draft is ready"
      : "Generating your course…";

  const stageIdx = error
    ? -1
    : GEN_STAGES.findIndex((s) => !stages[s.key]);
  const waveStage = stageIdx === -1 && !error ? 4 : stageIdx;

  return (
    <>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          borderBottom: "2px solid var(--color-divider)",
          paddingBottom: "var(--space-6)",
        }}
      >
        <h6 style={{ color: "var(--color-accent)", margin: 0 }}>
          02 — Drafting
        </h6>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4.5vw, 48px)",
          }}
        >
          {title}
        </h1>
        <p className="text-muted" style={{ margin: 0, maxWidth: "60ch" }}>
          &ldquo;{prompt}&rdquo;
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: narrow ? "minmax(0,1fr)" : "minmax(280px,400px) minmax(0,1fr)",
          gap: "var(--space-4) var(--space-6)",
          alignItems: "start",
        }}
      >
        <div style={{ order: narrow ? 0 : 2, minWidth: 0 }}>
          <WaveGrid stage={waveStage} narrow={narrow} lessonCount={lessonCount} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {GEN_STAGES.map((s) => {
            const done = stages[s.key];
            const firstIncomplete = GEN_STAGES.find((g) => !stages[g.key]);
            const isActive = !done && firstIncomplete?.key === s.key && !error;
            const isPending = !done && !isActive;

            return (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  padding: "var(--space-3) 0",
                  borderBottom: "2px solid var(--color-divider)",
                  opacity: isPending ? 0.4 : 1,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    flex: "none",
                    display: "grid",
                    placeItems: "center",
                    background: done
                      ? "var(--color-accent)"
                      : "transparent",
                    color: "var(--color-bg)",
                    border: `2px solid ${done ? "var(--color-accent)" : "var(--color-divider)"}`,
                    boxSizing: "border-box",
                  }}
                >
                  {done && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="square"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span style={{ fontWeight: 600, flex: 1 }}>{s.label}</span>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {done ? "Done" : isActive ? "In progress…" : ""}
                </span>
              </div>
            );
          })}

          {!error && (
            <div
              className="text-muted"
              style={{ fontSize: 13, marginTop: "var(--space-3)" }}
            >
              {elapsed}s elapsed · usually 20–45s
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "var(--space-4)",
                border: "2px solid var(--color-accent)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: "var(--color-accent-700)",
                }}
              >
                {error}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-primary"
                  style={{ margin: 0 }}
                  onClick={onRetry}
                >
                  Try again
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ margin: 0 }}
                  onClick={onUseSample}
                >
                  Use a sample draft
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ color: "var(--color-text)" }}
                  onClick={onEditPrompt}
                >
                  Edit prompt
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
