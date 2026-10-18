"use client";

import { ArrowDown, ArrowUp, Check, GripVertical } from "lucide-react";
import { SanitizedQuestion } from "@/lib/quiz";
import type { Selection } from "@/lib/gameplay";

export default function GameplayQuestion({ question, value, onChange, disabled }: {
  question: SanitizedQuestion; value: Selection; onChange: (answer: Selection) => void; disabled: boolean;
}) {
  const input = "min-w-0 w-full bg-white border-2 border-ink rounded-2xl p-4 text-base focus:outline-none focus:ring-4 focus:ring-lilac disabled:opacity-60";
  const options = question.answerOptions;
  return <fieldset disabled={disabled} className="space-y-3 min-w-0">
    <legend className="sr-only">Your answer</legend>
    {(["Mcq", "TrueFalse", "MultipleSelect"].includes(question.type)) && <>
      <p className="text-sm text-muted mb-5">{question.type === "MultipleSelect" ? "Choose all answers that apply." : "Choose one answer."}</p>
      {options.map((option, index) => {
        const selected = question.type === "MultipleSelect" ? value.optionIds?.includes(option.id) : value.optionId === option.id;
        return <label key={option.id} className={`flex items-center gap-4 p-4 sm:p-5 border-2 rounded-2xl cursor-pointer transition-all motion-reduce:transition-none ${selected ? "border-ink bg-lilac shadow-[4px_4px_0_#16151d] -translate-y-0.5" : "border-ink/20 bg-white hover:border-ink hover:bg-lilac/10"} ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
          <input type={question.type === "MultipleSelect" ? "checkbox" : "radio"} name={question.id} checked={!!selected} className="sr-only peer" onChange={() => {
            if (question.type === "MultipleSelect") onChange({ optionIds: selected ? value.optionIds!.filter(id => id !== option.id) : [...(value.optionIds ?? []), option.id] });
            else onChange({ optionId: option.id });
          }} />
          <span className={`w-10 h-10 shrink-0 rounded-xl border-2 flex items-center justify-center font-dm-mono font-bold peer-focus-visible:ring-4 peer-focus-visible:ring-pink ${selected ? "bg-ink border-ink text-white" : "border-ink/30 bg-paper"}`}>{selected ? <Check className="w-5 h-5" /> : String.fromCharCode(65 + index)}</span>
          <span className="text-base sm:text-lg font-semibold whitespace-pre-wrap break-words min-w-0">{option.text}</span>
        </label>;
      })}
    </>}
    {["ShortAnswer", "FillInTheBlank", "Numeric", "LongAnswer"].includes(question.type) && <>
      <label htmlFor="written-answer" className="block text-sm text-muted">{question.type === "Numeric" ? "Enter a number." : "Write your answer below."}</label>
      {question.type === "LongAnswer" ? <textarea id="written-answer" className={input} rows={6} value={value.text ?? ""} onChange={event => onChange({ text: event.target.value })} maxLength={10000} placeholder="Take a moment. You’ve got this." /> :
        <input id="written-answer" className={input} type={question.type === "Numeric" ? "number" : "text"} step="any" inputMode={question.type === "Numeric" ? "decimal" : "text"} autoComplete="off" value={value.text ?? ""} onChange={event => onChange({ text: event.target.value })} maxLength={2000} placeholder="Your answer" />}
    </>}
    {question.type === "OrderSequencing" && <>
      <p className="text-sm text-muted mb-5">Arrange these items in the correct order. Use the arrows to move each item.</p>
      {(value.optionIds ?? options.map(option => option.id)).map((id, index, order) => {
        const move = (direction: number) => { const ids = [...order]; [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]]; onChange({ optionIds: ids }); };
        return <div key={id} className="flex items-center gap-3 p-4 bg-white border-2 border-ink/30 rounded-2xl">
          <GripVertical className="w-4 h-4 text-muted shrink-0" /><span className="font-dm-mono font-bold">{index + 1}</span><span className="flex-1 min-w-0 break-words">{options.find(option => option.id === id)?.text}</span>
          <button type="button" disabled={disabled || index === 0} onClick={() => move(-1)} aria-label={`Move item ${index + 1} up`} className="p-2 border border-ink rounded-lg disabled:opacity-20 hover:bg-lilac"><ArrowUp className="w-4 h-4" /></button>
          <button type="button" disabled={disabled || index === order.length - 1} onClick={() => move(1)} aria-label={`Move item ${index + 1} down`} className="p-2 border border-ink rounded-lg disabled:opacity-20 hover:bg-lilac"><ArrowDown className="w-4 h-4" /></button>
        </div>;
      })}
    </>}
    {question.type === "Matching" && <>
      <p className="text-sm text-muted mb-5">Choose the matching item for each prompt.</p>
      {options.map(option => <div key={option.id} className="grid sm:grid-cols-2 gap-3 items-center bg-white border-2 border-ink/20 rounded-2xl p-4">
        <label htmlFor={`match-${option.id}`} className="font-semibold break-words">{option.text}</label>
        <select id={`match-${option.id}`} className={input} value={value.matches?.[option.id] ?? ""} onChange={event => {
          const matches = { ...value.matches }; if (event.target.value) matches[option.id] = event.target.value; else delete matches[option.id]; onChange({ matches });
        }}>
          <option value="">Choose a match</option>
          {question.matchingTargets?.map(target => <option key={target.id} value={target.text}>{target.text}</option>)}
        </select>
      </div>)}
    </>}
  </fieldset>;
}
