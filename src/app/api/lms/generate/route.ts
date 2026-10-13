import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("too many request") || lower.includes("resource exhausted") || lower.includes("quota")) {
    return "Too many requests — the free tier has a rate limit. Wait a minute and try again.";
  }
  if (lower.includes("403") || lower.includes("permission denied") || lower.includes("forbidden")) {
    return "Access denied. Check that your API key is valid and has Gemini API enabled.";
  }
  if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("unauthenticated")) {
    return "Invalid API key. Check your GEMINI_API_KEY environment variable.";
  }
  if (lower.includes("404") || lower.includes("not found") || lower.includes("model") && lower.includes("not")) {
    return "The AI model is unavailable. It may have been renamed or deprecated.";
  }
  if (lower.includes("500") || lower.includes("internal")) {
    return "Google's servers hit an internal error. Try again in a moment.";
  }
  if (lower.includes("503") || lower.includes("unavailable") || lower.includes("overloaded")) {
    return "The AI service is temporarily overloaded. Try again in a minute.";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("deadline")) {
    return "The request timed out. Try a simpler topic or fewer lessons.";
  }
  if (lower.includes("could not parse") || lower.includes("json")) {
    return "The AI returned an unexpected format. Try again — results vary between runs.";
  }
  if (lower.includes("missing required fields")) {
    return "The AI response was incomplete. Try again with a clearer topic.";
  }
  if (lower.includes("connection") || lower.includes("network") || lower.includes("fetch failed")) {
    return "Could not reach the AI service. Check your internet connection.";
  }

  return "Generation failed. Please try again.";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { prompt, lessonCount = 4, level = "beginner" } = await req.json();

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return new Response("Enter a topic first.", { status: 400 });
  }
  if (prompt.length > 500) {
    return new Response("Prompt is too long (max 500 characters).", {
      status: 400,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("AI service not configured", { status: 500 });
  }

  const userId = session.user.id;
  const clampedLessons = Math.min(Math.max(Number(lessonCount) || 4, 2), 5);
  const safeLevel = ["beginner", "intermediate", "advanced"].includes(level)
    ? level
    : "beginner";

  const systemInstruction = `You are an expert course designer. Create a structured course based on the user's topic.

Output a JSON object with this exact structure:
{
  "title": "Course title (concise, engaging)",
  "description": "2-3 sentence course description",
  "lessons": [
    {
      "title": "Lesson title",
      "description": "One-sentence lesson summary",
      "content": "<h3>Section heading</h3><p>Lesson content as HTML...</p>"
    }
  ],
  "quiz": [
    {
      "type": "multiple_choice",
      "text": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Requirements:
- Create exactly ${clampedLessons} lessons
- Target ${safeLevel} difficulty level
- Each lesson content should be 200-400 words of rich HTML (use <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em>)
- Create 3-5 quiz questions, all multiple_choice type with exactly 4 options each
- correctIndex is the 0-based index of the correct option
- Make content informative, practical, and engaging
- Output ONLY the JSON object, nothing else`;

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        send({ stage: "generating" });

        const response = await ai.models.generateContentStream({
          model: "gemini-3.8-flash",
          contents: `Create a course about: ${prompt.trim()}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
          },
        });

        let accumulated = "";
        let titleSent = false;
        let lessonsSent = false;
        let quizSent = false;

        for await (const chunk of response) {
          const text = chunk.text ?? "";
          accumulated += text;

          if (!titleSent && accumulated.includes('"title"')) {
            send({ stage: "title" });
            titleSent = true;
          }
          if (!lessonsSent && accumulated.includes('"lessons"')) {
            send({ stage: "lessons" });
            lessonsSent = true;
          }
          if (!quizSent && accumulated.includes('"quiz"')) {
            send({ stage: "quiz" });
            quizSent = true;
          }
        }

        let courseData;
        try {
          courseData = JSON.parse(accumulated);
        } catch {
          const match = accumulated.match(/```json?\s*([\s\S]*?)```/);
          if (match) {
            courseData = JSON.parse(match[1]);
          } else {
            throw new Error("Could not parse AI response");
          }
        }

        if (
          !courseData.title ||
          !courseData.lessons ||
          !Array.isArray(courseData.lessons)
        ) {
          throw new Error("AI response is missing required fields");
        }

        send({ stage: "cover" });

        const existing = await db.course.findUnique({
          where: { userId },
        });
        if (existing) {
          await db.course.delete({ where: { id: existing.id } });
        }

        const saved = await db.course.create({
          data: {
            userId,
            title: courseData.title,
            description: courseData.description || "",
            prompt: prompt.trim(),
            status: "draft",
            lessons: {
              create: courseData.lessons
                .slice(0, 5)
                .map((l: Record<string, string>, i: number) => ({
                  order: i,
                  title: l.title || `Lesson ${i + 1}`,
                  description: l.description || null,
                  content: l.content || "",
                })),
            },
            quiz: courseData.quiz?.length
              ? {
                  create: {
                    questions: {
                      create: courseData.quiz
                        .slice(0, 10)
                        .map(
                          (
                            q: Record<string, unknown>,
                            i: number,
                          ) => ({
                            order: i,
                            type:
                              q.type === "true_false"
                                ? "true_false"
                                : "multiple_choice",
                            text:
                              (q.text as string) || `Question ${i + 1}`,
                            options: (q.options as string[]) || [],
                            correctIndex:
                              (q.correctIndex as number) ?? 0,
                            explanation:
                              (q.explanation as string) || null,
                          }),
                        ),
                    },
                  },
                }
              : undefined,
          },
          include: {
            lessons: { orderBy: { order: "asc" } },
            quiz: { include: { questions: { orderBy: { order: "asc" } } } },
            progress: true,
          },
        });

        send({
          stage: "complete",
          course: JSON.parse(JSON.stringify(saved)),
        });
      } catch (err) {
        send({
          stage: "error",
          message: friendlyError(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
