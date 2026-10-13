# Pocket LMS — Implementation Plan

## Summary

AI-powered micro LMS. User describes a course in a sentence, AI generates lessons + quiz, user edits and publishes, then takes the course as a learner. One course per user (sandbox slot). Max 5 lessons, max 10 quiz questions per course.

Design source: Claude Design project `d4529474`, file `Workbench.dc.html`, `isLms` section.

---

## Data Model

### Prisma schema additions

```prisma
enum CourseStatus {
  draft
  published
}

enum QuestionType {
  multiple_choice
  true_false
}

model Course {
  id          String       @id @default(auto()) @map("_id") @db.ObjectId
  userId      String       @unique @db.ObjectId
  title       String
  description String
  prompt      String
  coverImage  String?
  status      CourseStatus  @default(draft)
  lessons     Lesson[]
  quiz        Quiz?
  progress    Progress?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Lesson {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  courseId     String   @db.ObjectId
  order       Int
  title       String
  description String?
  videoUrl    String?
  content     String   // HTML from rich-text editor
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
}

model Quiz {
  id        String     @id @default(auto()) @map("_id") @db.ObjectId
  courseId   String     @unique @db.ObjectId
  questions QuizQuestion[]
  course    Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
}

model QuizQuestion {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  quizId      String   @db.ObjectId
  order       Int
  type        QuestionType @default(multiple_choice)
  text        String
  options     String[] // JSON-encoded option labels
  correctIndex Int
  explanation String?
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
}
```

#### Progress (embedded in Course or separate)

```prisma
model Progress {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  courseId         String   @unique @db.ObjectId
  completedLessons String[] @db.ObjectId  // lesson IDs
  quizAnswers      Json?    // { questionId: selectedIndex }
  quizScore        Float?
  quizPassed       Boolean?
  course           Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
}
```

> **Note:** `userId` on Course is `@unique` — enforces one course per user. Add a `User` → `Course` relation field too.

---

## Phases

### Phase 1 — Skeleton + Data Layer

**Goal:** Route exists, Prisma models work, empty state renders.

Files to create/modify:
- `prisma/schema.prisma` — add Course, Lesson, Quiz, QuizQuestion, Progress models + User relation
- `src/app/dashboard/lms/page.tsx` — server component, fetches course for user
- `src/app/dashboard/lms/lms-client.tsx` — client component, state machine for all LMS screens
- `src/actions/lms.ts` — server actions (CRUD stubs)
- `src/lib/modules.ts` — change Pocket LMS status from "planned" to "live" (or "building")

What it looks like:
- Course list screen with "No course yet" empty state (matching design)
- "Create course" button navigates to prompt step (client-side state, no route change)
- Sidebar module link is clickable

### Phase 2 — Course Creation (Prompt + AI Generation)

**Goal:** User enters a prompt, AI generates a full course draft.

Files:
- `src/app/api/lms/generate/route.ts` — streaming route handler, calls Claude API
- `src/actions/lms.ts` — `saveCourse` action to persist the generated draft
- `src/app/dashboard/lms/lms-client.tsx` — prompt step UI + generation progress UI

Flow:
1. User enters prompt, picks lesson count (3/4/5) and level (beginner/intermediate/advanced)
2. Client POSTs to `/api/lms/generate` with those params
3. Route handler streams a structured JSON response from Claude:
   - Title → stream to client
   - Description → stream to client
   - Each lesson (title, description, content HTML) → stream to client
   - Quiz questions (3–5 questions) → stream to client
   - Cover image keyword → use Unsplash or placeholder
4. Generation progress UI shows staged checklist (title ✓, lessons ✓, quiz ✓, cover ✓)
5. On complete, save to MongoDB via server action
6. Redirect to editor

AI prompt structure:
- System: "You are a course designer. Output valid JSON matching the schema..."
- User: course prompt + constraints (lesson count, level)
- Response format: structured JSON with `title`, `description`, `lessons[]`, `quiz[]`

Error handling:
- Network/API failure → error banner with "Try again" / "Use a sample draft" / "Edit prompt"
- Sample draft: a hardcoded fallback course for demo purposes

Dependencies:
- `@google/generative-ai` package
- `GEMINI_API_KEY` env var (Google AI Studio free tier)

### Phase 3 — Course Editor

**Goal:** Two-panel editor for editing the AI-generated draft.

Files:
- `src/app/dashboard/lms/lms-client.tsx` — editor screen
- `src/actions/lms.ts` — `updateCourse`, `updateLesson`, `addLesson`, `deleteLesson`, `reorderLessons`, `updateQuiz`, `addQuestion`, `deleteQuestion`

Left sidebar:
- "Course details" nav item
- Lesson list with reorder (up/down buttons), delete (X button), add lesson button
- "Final quiz" nav item with question count

Right panel (switches based on selection):
- **Course details:** cover image (upload via UploadThing or shuffle stock), title input, description textarea, "Drafted from: ..." label
- **Lesson editor:** title, description, video URL (YouTube/Vimeo/.mp4 with embed preview), rich-text content editor with toolbar (bold, italic, H3, bullet list, numbered list, blockquote, link, image insert)
- **Quiz editor:** questions list, each with type toggle (multiple-choice/true-false), question text, answer options with correct-answer radio, explanation input, add/delete question

Rich text: `contentEditable` div with `execCommand`-based toolbar (matching the design's toolbar buttons). No external editor library needed — keeps bundle small.

Cover image: reuse UploadThing for custom uploads. For "shuffle" (stock photos), use a set of curated placeholder images or Unsplash API.

Auto-save: debounced server action calls on input changes. Show "Saved" / "Saving..." label.

### Phase 4 — Publish Flow

**Goal:** Publish dialog with readiness checklist, status change.

Files:
- `src/app/dashboard/lms/lms-client.tsx` — publish dialog
- `src/actions/lms.ts` — `publishCourse`, `deleteCourse`

Publish dialog checks:
- ✓ Title set
- ✓ Description set
- ✓ At least 1 lesson with content
- ✓ Quiz has at least 1 question
- ✓ All questions have correct answer set

On publish: update course `status` to "published", show success dialog.
On delete: confirmation dialog → delete course + lessons + quiz + progress → back to empty state.

Course list card (has-course state):
- Cover image, title, description, status tag (Draft/Published), stats (lessons count, quiz questions count, status)
- "View course" (disabled if draft), "Edit course", "Delete" buttons

### Phase 5 — Learner View

**Goal:** Full learner experience — intro, lessons, quiz, results, certificate.

Files:
- `src/app/dashboard/lms/lms-client.tsx` — learner view screens
- `src/actions/lms.ts` — `updateProgress`, `submitQuizAnswer`, `resetQuiz`

Dark "Learner view" banner at top with exit button.

Sub-screens (all client-side state within learner mode):

**Intro:** cover image (21:9), course title, description, stats (lessons, quiz questions, level), "Start learning" button.

**Lesson:** lesson kicker ("Lesson 1 of 4"), title, description, video embed (YouTube/Vimeo iframe or HTML5 video), rendered content (read-only HTML), prev/next navigation. Mark lesson complete on "Next" click → update Progress.

**Quiz:** question-by-question flow:
- Progress pips at top
- Question text, answer options as large clickable cards (A/B/C/D)
- On answer: lock choices, highlight correct (green) / wrong (red), show explanation
- "Next question" / "See results" button

**Results:**
- Big score display (e.g. "80%")
- Pass/fail tag (70% threshold)
- If passed: certificate card (Workbench · Pocket LMS branding, user's name, course title, score, date, "Download certificate" button)
- If failed: "Score needed: 70%" hint
- "Retake quiz" / "Course overview" buttons

Certificate download: generate a styled HTML → canvas → PNG/PDF on client side.

Sidebar in learner mode:
- Course title + progress bar (% complete)
- Lesson list with checkmarks for completed, highlight for current
- Quiz item at bottom

### Phase 6 — Polish & Integration

- Responsive layout: `grid-template-columns` switches between sidebar+content (desktop) and stacked (mobile) based on container width (matching existing `narrow` pattern from dashboard-shell)
- Add `tag` and `tag-accent`/`tag-neutral` CSS classes to `globals.css` (for status tags)
- Dialog backdrop + dialog CSS classes to `globals.css`
- Segmented control (`.seg`, `.seg-opt`) CSS classes to `globals.css`
- Radio button (`.radio`, `.dot`) CSS classes to `globals.css`
- Update sidebar nav in `dashboard-shell.tsx` to make Pocket LMS link clickable
- Loading state for the `/dashboard/lms` route
- Update module status to "live" in `modules.ts`

---

## File Tree (new files)

```
src/
├── app/
│   └── dashboard/
│       └── lms/
│           ├── page.tsx              # server component
│           └── lms-client.tsx        # all LMS UI (state machine)
├── actions/
│   └── lms.ts                       # server actions for course CRUD + progress
└── app/
    └── api/
        └── lms/
            └── generate/
                └── route.ts          # streaming AI generation endpoint
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Routing | Single route `/dashboard/lms` with client-side state machine | Design is a single-page app with screen transitions, not separate routes. Keeps URL simple. |
| AI provider | Google Gemini (AI Studio free tier) | Free tier, fast generation with `gemini-2.0-flash`. |
| Rich text editor | `contentEditable` + `execCommand` | Lightweight, no deps, matches design's inline toolbar exactly. |
| Cover images | UploadThing (custom) + bundled stock set | Reuses existing UploadThing setup. Stock images avoid external API dependency. |
| Progress tracking | Separate Progress model | Clean separation from course content. Easy to reset for quiz retake. |
| Certificate | Client-side HTML-to-canvas | No server-side rendering needed. User downloads directly. |

---

## Open Items

- [x] `GEMINI_API_KEY` env var (Google AI Studio free tier)
- [ ] Decide on stock cover images — bundle a small set or use Unsplash API?
- [ ] Confirm UploadThing file router needs a new "courseCover" endpoint or reuse avatar one
- [ ] Rich text: decide if `execCommand` is sufficient or if we need a lightweight lib (Tiptap, etc.)
