import { randomInt, randomUUID } from "node:crypto";
import type { QuizSession, SanitizedQuestion } from "@/lib/quiz";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const next = randomInt(index + 1);
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

/** Server-only projection: answer keys never cross the browser network boundary. */
export function publicQuizSession(input: QuizSession): QuizSession {
  if (!input?.attemptId || !Array.isArray(input.questions) || !input.questions.length || !(input.timeAllocated > 0)) {
    throw new Error("The quiz service did not return a playable session.");
  }
  return {
    attemptId: input.attemptId,
    quizTitle: input.quizTitle,
    timeAllocated: input.timeAllocated,
    ...(input.startedAt ? { startedAt: input.startedAt } : {}),
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    questions: input.questions.map(question => {
      const written = ["ShortAnswer", "LongAnswer", "FillInTheBlank", "Numeric"].includes(question.type);
      const rawOptions = question.answerOptions ?? [];
      const choices = written ? [] : rawOptions.map(option => ({ id: option.id, text: option.text }));
      const targets = question.type === "Matching" ? (question.matchingTargets?.map(target => target.text) ?? rawOptions.map(option =>
        option.matchingText ?? (option as { matchText?: string }).matchText).filter((text): text is string => typeof text === "string")) : [];
      const safe: SanitizedQuestion = {
        id: question.id,
        text: question.text,
        type: question.type,
        answerOptions: question.type === "OrderSequencing" ? shuffle(choices) : choices,
        media: (question.media ?? []).flatMap(media => {
          const url = typeof media === "string" ? media : media?.url;
          return typeof url === "string" && /^https?:\/\//i.test(url) ? [{ url }] : [];
        }),
      };
      if (question.type === "Matching") safe.matchingTargets = shuffle(Array.from(new Set(targets)).map(text => ({ id: randomUUID(), text })));
      return safe;
    }),
  };
}
