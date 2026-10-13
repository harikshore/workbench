"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const COURSE_INCLUDE = {
  lessons: { orderBy: { order: "asc" } as const },
  quiz: {
    include: {
      questions: { orderBy: { order: "asc" } as const },
    },
  },
  progress: true,
};

export async function getUserCourse() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.course.findUnique({
    where: { userId: session.user.id },
    include: COURSE_INCLUDE,
  });
}

export async function updateCourse(
  courseId: string,
  data: { title?: string; description?: string; coverImage?: string | null },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");

  const updated = await db.course.update({
    where: { id: courseId },
    data,
    include: COURSE_INCLUDE,
  });
  return JSON.parse(JSON.stringify(updated));
}

export async function updateLesson(
  lessonId: string,
  data: {
    title?: string;
    description?: string | null;
    videoUrl?: string | null;
    content?: string;
  },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { userId: true } } },
  });
  if (!lesson || lesson.course.userId !== session.user.id)
    throw new Error("Not found");

  return db.lesson.update({ where: { id: lessonId }, data });
}

export async function addLesson(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { lessons: true },
  });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");
  if (course.lessons.length >= 5) throw new Error("Maximum 5 lessons");

  const maxOrder = course.lessons.reduce(
    (m, l) => Math.max(m, l.order),
    -1,
  );

  const lesson = await db.lesson.create({
    data: {
      courseId,
      order: maxOrder + 1,
      title: `Lesson ${course.lessons.length + 1}`,
      content: "<p>Start writing here...</p>",
    },
  });

  const updated = await db.course.findUnique({
    where: { id: courseId },
    include: COURSE_INCLUDE,
  });
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteLesson(lessonId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { userId: true, id: true } } },
  });
  if (!lesson || lesson.course.userId !== session.user.id)
    throw new Error("Not found");

  await db.lesson.delete({ where: { id: lessonId } });

  const remaining = await db.lesson.findMany({
    where: { courseId: lesson.course.id },
    orderBy: { order: "asc" },
  });
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) {
      await db.lesson.update({
        where: { id: remaining[i].id },
        data: { order: i },
      });
    }
  }

  const updated = await db.course.findUnique({
    where: { id: lesson.course.id },
    include: COURSE_INCLUDE,
  });
  return JSON.parse(JSON.stringify(updated));
}

export async function reorderLessons(
  courseId: string,
  lessonId: string,
  direction: "up" | "down",
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");

  const idx = course.lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) throw new Error("Lesson not found");

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= course.lessons.length)
    throw new Error("Cannot move");

  const a = course.lessons[idx];
  const b = course.lessons[swapIdx];

  await db.lesson.update({ where: { id: a.id }, data: { order: b.order } });
  await db.lesson.update({ where: { id: b.id }, data: { order: a.order } });

  const updated = await db.course.findUnique({
    where: { id: courseId },
    include: COURSE_INCLUDE,
  });
  return JSON.parse(JSON.stringify(updated));
}

export async function addQuestion(quizId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      course: { select: { userId: true, id: true } },
      questions: true,
    },
  });
  if (!quiz || quiz.course.userId !== session.user.id)
    throw new Error("Not found");
  if (quiz.questions.length >= 10) throw new Error("Maximum 10 questions");

  const maxOrder = quiz.questions.reduce(
    (m, q) => Math.max(m, q.order),
    -1,
  );

  await db.quizQuestion.create({
    data: {
      quizId,
      order: maxOrder + 1,
      type: "multiple_choice",
      text: "",
      options: ["", "", "", ""],
      correctIndex: 0,
    },
  });

  const updated = await db.course.findUnique({
    where: { id: quiz.course.id },
    include: COURSE_INCLUDE,
  });
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteQuestion(questionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        select: {
          id: true,
          courseId: true,
          course: { select: { userId: true } },
        },
      },
    },
  });
  if (!question || question.quiz.course.userId !== session.user.id)
    throw new Error("Not found");

  await db.quizQuestion.delete({ where: { id: questionId } });

  const remaining = await db.quizQuestion.findMany({
    where: { quizId: question.quiz.id },
    orderBy: { order: "asc" },
  });
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) {
      await db.quizQuestion.update({
        where: { id: remaining[i].id },
        data: { order: i },
      });
    }
  }

  const updated = await db.course.findUnique({
    where: { id: question.quiz.courseId },
    include: COURSE_INCLUDE,
  });
  return JSON.parse(JSON.stringify(updated));
}

export async function updateQuestion(
  questionId: string,
  data: {
    type?: "multiple_choice" | "true_false";
    text?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string | null;
  },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const question = await db.quizQuestion.findUnique({
    where: { id: questionId },
    include: {
      quiz: { select: { course: { select: { userId: true } } } },
    },
  });
  if (!question || question.quiz.course.userId !== session.user.id)
    throw new Error("Not found");

  if (data.type === "true_false") {
    data.options = ["True", "False"];
    if ((data.correctIndex ?? question.correctIndex) > 1) {
      data.correctIndex = 0;
    }
  }

  return db.quizQuestion.update({ where: { id: questionId }, data });
}

export async function publishCourse(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: COURSE_INCLUDE,
  });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");

  const errors: string[] = [];
  if (!course.title.trim()) errors.push("Title is required");
  if (!course.description.trim()) errors.push("Description is required");
  if (!course.lessons.some((l) => l.content.trim()))
    errors.push("At least one lesson needs content");
  const quiz = course.quiz;
  if (!quiz || quiz.questions.length === 0)
    errors.push("Quiz needs at least one question");
  if (quiz?.questions.some((q) => !q.text.trim()))
    errors.push("All questions need text");
  if (errors.length > 0) throw new Error(errors.join("; "));

  const updated = await db.course.update({
    where: { id: courseId },
    data: { status: "published" },
    include: COURSE_INCLUDE,
  });
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteCourse(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");

  await db.course.delete({ where: { id: courseId } });
}

export async function completeLesson(courseId: string, lessonId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");

  let progress = await db.progress.findUnique({ where: { courseId } });
  if (!progress) {
    progress = await db.progress.create({
      data: { courseId, completedLessons: [lessonId] },
    });
  } else if (!progress.completedLessons.includes(lessonId)) {
    progress = await db.progress.update({
      where: { id: progress.id },
      data: { completedLessons: { push: lessonId } },
    });
  }
  return JSON.parse(JSON.stringify(progress));
}

export async function submitQuiz(
  courseId: string,
  answers: Record<string, number>,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { quiz: { include: { questions: true } } },
  });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");
  if (!course.quiz) throw new Error("No quiz");

  let correct = 0;
  for (const q of course.quiz.questions) {
    if (answers[q.id] === q.correctIndex) correct++;
  }
  const score = course.quiz.questions.length > 0
    ? correct / course.quiz.questions.length
    : 0;
  const passed = score >= 0.7;

  let progress = await db.progress.findUnique({ where: { courseId } });
  const data = { quizAnswers: answers, quizScore: score, quizPassed: passed };
  if (!progress) {
    progress = await db.progress.create({
      data: { courseId, completedLessons: [], ...data },
    });
  } else {
    progress = await db.progress.update({
      where: { id: progress.id },
      data,
    });
  }
  return JSON.parse(JSON.stringify(progress));
}

export async function resetQuiz(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.userId !== session.user.id)
    throw new Error("Not found");

  const progress = await db.progress.findUnique({ where: { courseId } });
  if (progress) {
    await db.progress.update({
      where: { id: progress.id },
      data: { quizAnswers: null, quizScore: null, quizPassed: null },
    });
  }
}

export async function createSampleCourse() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const existing = await db.course.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    await db.course.delete({ where: { id: existing.id } });
  }

  const saved = await db.course.create({
    data: {
      userId: session.user.id,
      title: "Introduction to Pour-Over Coffee",
      description:
        "Learn the art of brewing exceptional pour-over coffee at home. From choosing beans to mastering technique, this hands-on course covers everything you need.",
      prompt: "A beginner course on brewing great pour-over coffee at home",
      status: "draft",
      lessons: {
        create: [
          {
            order: 0,
            title: "Choosing Your Beans",
            description:
              "How origin, roast level, and freshness shape your cup.",
            content:
              '<h3>It starts with the bean</h3><p>Great coffee begins long before water hits grounds. The beans you choose determine most of your cup\'s character.</p><h3>Origin matters</h3><p>Beans from <strong>Ethiopia</strong> tend toward fruity and floral. <strong>Colombia</strong> offers balanced sweetness and nuttiness. <strong>Sumatra</strong> brings earthy, full-bodied depth.</p><h3>Roast level</h3><ul><li><strong>Light roast</strong> — preserves origin flavors, higher acidity</li><li><strong>Medium roast</strong> — balanced sweetness and body</li><li><strong>Dark roast</strong> — bold, smoky, lower acidity</li></ul><p>For pour-over, medium or light roasts let the brewing method shine.</p><h3>Freshness</h3><p>Buy whole beans roasted within the last <strong>2-4 weeks</strong>. Grind just before brewing. Pre-ground coffee loses flavor within days of opening.</p>',
          },
          {
            order: 1,
            title: "Equipment & Setup",
            description: "The gear you need and how to prepare it.",
            content:
              '<h3>Essential equipment</h3><ul><li><strong>Pour-over dripper</strong> — Hario V60, Kalita Wave, or Chemex</li><li><strong>Paper filters</strong> — matched to your dripper</li><li><strong>Gooseneck kettle</strong> — for precise pouring control</li><li><strong>Scale</strong> — measuring by weight, not volume</li><li><strong>Grinder</strong> — burr grinder for consistent particle size</li></ul><h3>The golden ratio</h3><p>Start with <strong>1:16</strong> — that\'s 1 gram of coffee for every 16 grams of water. For one cup, use 15g coffee and 240g water.</p><h3>Grind size</h3><p>Aim for <strong>medium-fine</strong>, roughly the texture of table salt. Too fine and your coffee will be bitter; too coarse and it will taste weak and sour.</p><h3>Water temperature</h3><p>Heat water to <strong>92-96°C</strong> (197-205°F). If you don\'t have a thermometer, bring water to a boil and let it sit for 30 seconds.</p>',
          },
          {
            order: 2,
            title: "The Brewing Technique",
            description: "Step-by-step pour-over method.",
            content:
              '<h3>Step 1: Rinse the filter</h3><p>Place your filter in the dripper and pour hot water through it. This removes paper taste and preheats the vessel. Discard the rinse water.</p><h3>Step 2: The bloom</h3><p>Add your ground coffee and pour <strong>twice the weight of the coffee</strong> in water (30g for 15g of coffee). Wait <strong>30-45 seconds</strong>. You\'ll see the grounds bubble and expand — that\'s CO₂ releasing, and it\'s a sign of fresh coffee.</p><h3>Step 3: The main pour</h3><p>Pour in slow, steady circles from the center outward. Avoid pouring directly on the filter walls. Add water in pulses:</p><ul><li><strong>Second pour</strong> — up to 120g total, wait 30s</li><li><strong>Third pour</strong> — up to 200g total, wait 20s</li><li><strong>Final pour</strong> — up to 240g total</li></ul><h3>Step 4: The drawdown</h3><p>Let all the water drain through. Total brew time should be <strong>2:30-3:30</strong>. If it\'s faster, grind finer. If slower, grind coarser.</p><blockquote>The best cup is the one you enjoy drinking. Use these guidelines as a starting point, then adjust to your taste.</blockquote>',
          },
        ],
      },
      quiz: {
        create: {
          questions: {
            create: [
              {
                order: 0,
                type: "multiple_choice",
                text: "What is the ideal water temperature for pour-over coffee?",
                options: [
                  "100°C (212°F)",
                  "92-96°C (197-205°F)",
                  "80-85°C (176-185°F)",
                  "70°C (158°F)",
                ],
                correctIndex: 1,
                explanation:
                  "Water between 92-96°C extracts the best flavors without scalding the grounds.",
              },
              {
                order: 1,
                type: "multiple_choice",
                text: "What is the recommended coffee-to-water ratio for pour-over?",
                options: ["1:10", "1:12", "1:16", "1:20"],
                correctIndex: 2,
                explanation:
                  "A 1:16 ratio (1g coffee per 16g water) is the standard starting point for pour-over.",
              },
              {
                order: 2,
                type: "multiple_choice",
                text: "What does the 'bloom' step accomplish?",
                options: [
                  "Cools the water to the right temperature",
                  "Releases CO₂ trapped in fresh grounds",
                  "Dissolves the paper filter",
                  "Pre-heats the coffee mug",
                ],
                correctIndex: 1,
                explanation:
                  "The bloom releases CO₂ from freshly roasted beans, allowing water to extract flavors evenly.",
              },
            ],
          },
        },
      },
    },
    include: COURSE_INCLUDE,
  });

  return JSON.parse(JSON.stringify(saved));
}
