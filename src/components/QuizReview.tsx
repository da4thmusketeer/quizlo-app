import { Check, Sparkles } from "lucide-react";
import { QuizDetails, QuestionType } from "@/lib/quiz";
import { normalizeQuizDetails } from "@/lib/quizPreview";
import QuestionMediaRenderer from "@/components/QuestionMediaRenderer";

const questionLabels: Record<QuestionType, string> = {
  Mcq: "Multiple choice",
  TrueFalse: "True / False",
  MultipleSelect: "Multiple select",
  ShortAnswer: "Short answer",
  FillInTheBlank: "Fill in the blank",
  Numeric: "Numeric",
  LongAnswer: "Long answer",
  OrderSequencing: "Order / Sequencing",
  Matching: "Matching",
};

export default function QuizReview({ quiz: sourceQuiz }: { quiz: QuizDetails }) {
  const quiz = normalizeQuizDetails(sourceQuiz);
  const card =
    "bg-white border-2 border-ink rounded-[20px] p-5 sm:p-7 shadow-[5px_5px_0_#16151d]";
  return (
    <>
      <section className={`${card} overflow-hidden`} aria-label="Quiz details">
        {quiz.coverPicture && (
          <img
            src={quiz.coverPicture}
            alt={`Cover for ${quiz.title}`}
            className="w-full max-h-80 object-cover rounded-[12px] border-2 border-ink mb-6"
          />
        )}
        <div className="flex flex-wrap gap-2 text-xs font-bold font-dm-mono mb-3">
          <span className="bg-lilac border border-ink rounded-full px-3 py-1">
            {quiz.category?.name ?? "Quiz"}
          </span>
          <span className="bg-paper border border-ink rounded-full px-3 py-1 inline-flex items-center gap-1">
            {quiz.creationMode?.toLowerCase() === "ai" && (
              <Sparkles className="w-3 h-3" />
            )}
            {quiz.creationMode?.toLowerCase() === "ai"
              ? "AI generated"
              : "Manually created"}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">
          {quiz.title}
        </h2>
        <p className="text-muted whitespace-pre-wrap break-words mt-3 leading-relaxed">
          {quiz.description || "No description added."}
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {[
            ["Questions", quiz.questions.length],
            ["Difficulty", quiz.difficulty],
            [
              "Time limit",
              `${Math.floor(quiz.timeAllocated / 60)} min${quiz.timeAllocated % 60 ? ` ${quiz.timeAllocated % 60} sec` : ""}`,
            ],
            ["Visibility", quiz.isPrivate ? "Private" : "Public"],
            ["Status", quiz.isDraft ? "Draft" : "Published"],
            ["Category", quiz.category?.name ?? quiz.categoryId],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-paper border border-ink/20 rounded-[12px] p-3 break-words"
            >
              <dt className="text-xs font-dm-mono uppercase text-muted mb-1">
                {label}
              </dt>
              <dd className="font-extrabold text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="preview-questions" className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 id="preview-questions" className="text-xl font-extrabold">
            Questions & answers{" "}
            <span className="text-muted">({quiz.questions.length})</span>
          </h2>
          <span className="text-xs font-dm-mono text-muted flex items-center gap-1">
            <Check className="w-4 h-4" />
            Correct answers are highlighted
          </span>
        </div>
        {[...quiz.questions]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((question, index) => {
            const sequence = question.type === "OrderSequencing";
            const matching = question.type === "Matching";
            const written = [
              "ShortAnswer",
              "LongAnswer",
              "FillInTheBlank",
              "Numeric",
            ].includes(question.type);
            return (
              <article key={question.id ?? index} className={card}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-9 h-9 rounded-[10px] bg-ink text-white flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs font-dm-mono text-muted uppercase">
                    {questionLabels[question.type] ?? question.type}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg whitespace-pre-wrap break-words">
                  {question.text}
                </h3>
                {question.media && question.media.length > 0 && (
                  <QuestionMediaRenderer media={question.media} />
                )}
                <p className="text-xs text-muted font-dm-mono mt-4 mb-2">
                  {sequence
                    ? "Correct sequence"
                    : matching
                      ? "Matching pairs"
                      : question.type === "LongAnswer"
                        ? "Sample answer / rubric"
                        : written
                          ? "Accepted answers"
                          : "Answer options"}
                </p>
                {question.answerOptions.length === 0 && (
                  <p className="text-sm text-muted bg-lilac/20 rounded-xl p-3" role="status">
                    Answer options were not included in the saved quiz response. They cannot be displayed for this question yet.
                  </p>
                )}
                <ol className="space-y-2">
                  {[...question.answerOptions]
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((option, i) => {
                      const correct =
                        option.isCorrect || sequence || matching || written;
                      return (
                        <li
                          key={i}
                          className={`flex items-start gap-3 border-2 rounded-[12px] px-4 py-3 whitespace-pre-wrap break-words ${correct ? "bg-lime/20 border-ink" : "bg-paper border-ink/20"}`}
                        >
                          <span className="font-dm-mono text-xs pt-1 shrink-0">
                            {sequence ? (
                              `${i + 1}.`
                            ) : correct ? (
                              <Check
                                className="w-4 h-4"
                                aria-label="Correct answer"
                              />
                            ) : (
                              `${String.fromCharCode(65 + i)}.`
                            )}
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-medium">
                            {option.text}
                            {matching && (
                              <>
                                <span className="mx-2" aria-label="matches">
                                  →
                                </span>
                                {option.matchingText ?? option.matchText}
                              </>
                            )}
                          </span>
                        </li>
                      );
                    })}
                </ol>
                {question.explanation && (
                  <div className="mt-4 bg-lilac/20 rounded-[12px] p-4 text-sm">
                    <p className="font-bold mb-1">Explanation</p>
                    <p className="whitespace-pre-wrap break-words text-muted">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        {quiz.questions.length === 0 && (
          <p className={card}>
            No questions yet. Use Edit Quiz to add your first question.
          </p>
        )}
      </section>
    </>
  );
}
