# 03 — Pocket LMS

**Status:** Planned  
**Route:** `/dashboard/lms`

## Overview

An AI-powered micro learning management system. Users design a course — its lessons and a quiz — using AI. Then experience the full user journey in realtime: browse the course, take lessons, and attempt the quiz as a learner would.

## Planned features

- AI course generation: provide a topic, AI creates a structured course with lessons and a quiz
- Lesson viewer: read through AI-generated lesson content
- Quiz engine: take the AI-generated quiz with immediate feedback
- Realtime user journey: experience the course end-to-end as a learner
- Course stored in MongoDB, tied to the user's account

## Open questions

- Which AI model/provider for course generation (Claude API, OpenAI, etc.)
- Credit/usage limits on the free tier
- Course data schema (lessons, quiz questions, answer options)
- Whether to allow editing AI-generated content before publishing

## Test cases

### Course creation
- [ ] Enter a topic → AI generates a course with title, description, and lessons
- [ ] Generated course has at least 3 lessons and 1 quiz
- [ ] Course is saved to the user's account in MongoDB
- [ ] Loading state shown while AI generates content
- [ ] Error state if AI generation fails

### Lesson viewer
- [ ] Lessons display in order with title and content
- [ ] Navigation between lessons (next/previous)
- [ ] Progress indicator shows current lesson position
- [ ] Lesson content renders formatted text (headings, paragraphs, lists)

### Quiz
- [ ] Quiz displays questions with multiple choice options
- [ ] User can select one answer per question
- [ ] Submit quiz → shows score and correct/incorrect answers
- [ ] Cannot submit quiz without answering all questions

### User journey
- [ ] Full flow: create course → browse lessons → take quiz → see results
- [ ] Course persists across sessions (user can return to it)
- [ ] Only one course per user (or limited based on credits)

### Edge cases
- [ ] Unauthenticated user → redirected to login
- [ ] Empty topic submitted → validation error
- [ ] Very long topic → handled gracefully (truncation or error)
- [ ] Network failure during AI generation → error message, retry option
