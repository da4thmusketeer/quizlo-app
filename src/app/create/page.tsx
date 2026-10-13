"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import { goeyToast } from "goey-toast";
import { getProfileData, ProfileData } from "@/lib/user";
import { getToken } from "@/lib/auth";
import { uploadToImageKit } from "@/lib/media";
import {
  createQuiz,
  getCategoryData,
  Category,
  QuestionType,
  CreateQuizPayload,
} from "@/lib/quiz";
import { useQuizStore } from "@/store/quizStore";
import {
  Sparkles,
  PenLine,
  PlusCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
  FileText,
  Wand2,
  Lightbulb,
  Clock,
  Hash,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  CheckSquare,
  Type,
  AlignLeft,
  Minus,
  ArrowLeftRight,
  ListOrdered,
  MoveUp,
  MoveDown,
} from "lucide-react";

/* ── Types ─────────────────────────────────────── */

interface QuestionOption {
  text: string;
  isCorrect?: boolean;
  matchingText?: string;
}

interface QuestionItem {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  isOpen: boolean;
}

type CreationMode = "manual" | "ai";

const QUESTION_TYPES_CONFIG: {
  type: QuestionType;
  label: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}[] = [
  {
    type: "Mcq",
    label: "Multiple Choice",
    badge: "MCQ",
    description: "Single correct option",
    icon: CheckCircle2,
    colorClass: "bg-blue text-blue-900 border-ink",
  },
  {
    type: "TrueFalse",
    label: "True / False",
    badge: "T / F",
    description: "Binary truth choice",
    icon: ToggleRight,
    colorClass: "bg-lilac text-purple-900 border-ink",
  },
  {
    type: "MultipleSelect",
    label: "Multiple Select",
    badge: "Multi",
    description: "Check all that apply",
    icon: CheckSquare,
    colorClass: "bg-orange-300 text-orange-900 border-ink",
  },
  {
    type: "ShortAnswer",
    label: "Short Answer",
    badge: "Short",
    description: "Exact word or short phrase",
    icon: Type,
    colorClass: "bg-lime text-ink border-ink",
  },
  {
    type: "LongAnswer",
    label: "Long Answer",
    badge: "Essay",
    description: "Open response with rubric",
    icon: AlignLeft,
    colorClass: "bg-amber-100 text-amber-900 border-ink",
  },
  {
    type: "FillInTheBlank",
    label: "Fill in the Blank",
    badge: "Blank",
    description: "Insert missing word",
    icon: Minus,
    colorClass: "bg-sky-100 text-sky-900 border-ink",
  },
  {
    type: "Matching",
    label: "Matching Pairs",
    badge: "Match",
    description: "Pair items together",
    icon: ArrowLeftRight,
    colorClass: "bg-purple-100 text-purple-900 border-ink",
  },
  {
    type: "OrderSequencing",
    label: "Sequencing",
    badge: "Order",
    description: "Arrange in correct order",
    icon: ListOrdered,
    colorClass: "bg-orange-100 text-orange-900 border-ink",
  },
  {
    type: "Numeric",
    label: "Numeric",
    badge: "Number",
    description: "Numerical value answer",
    icon: Hash,
    colorClass: "bg-emerald-100 text-emerald-900 border-ink",
  },
];

/* ── Helpers ───────────────────────────────────── */

function generateId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTypeConfig(type: QuestionType) {
  return (
    QUESTION_TYPES_CONFIG.find((c) => c.type === type) ||
    QUESTION_TYPES_CONFIG[0]
  );
}

function getQuestionPlaceholder(type: QuestionType) {
  switch (type) {
    case "Mcq":
      return "e.g. What is the chemical symbol for Gold?";
    case "TrueFalse":
      return "e.g. The Great Wall of China is visible from the Moon.";
    case "MultipleSelect":
      return "e.g. Which of the following numbers are prime?";
    case "ShortAnswer":
      return "e.g. What is the capital city of Australia?";
    case "LongAnswer":
      return "e.g. Explain the process of cellular respiration and its stages.";
    case "FillInTheBlank":
      return "e.g. In 1969, Apollo 11 landed astronauts on the [blank].";
    case "Matching":
      return "e.g. Match each country with its national currency.";
    case "OrderSequencing":
      return "e.g. Arrange the steps of the scientific method in correct order.";
    case "Numeric":
      return "e.g. How many degrees are in a triangle?";
    default:
      return "Enter your question prompt here...";
  }
}

function getQuestionSummary(q: QuestionItem) {
  switch (q.type) {
    case "Mcq":
      return `${q.options.length} options (1 correct)`;
    case "TrueFalse":
      return `Correct: ${q.options[0]?.isCorrect ? "True" : "False"}`;
    case "MultipleSelect":
      return `${q.options.length} options (${q.options.filter((o) => o.isCorrect).length} correct)`;
    case "ShortAnswer":
      return `${q.options.length} accepted answer${q.options.length > 1 ? "s" : ""}`;
    case "LongAnswer":
      return "Model response / rubric";
    case "FillInTheBlank":
      return "Fill-in blank answer";
    case "Matching":
      return `${q.options.length} matching pairs`;
    case "OrderSequencing":
      return `${q.options.length} steps in sequence`;
    case "Numeric":
      return "Exact number";
    default:
      return `${q.options.length} options`;
  }
}

function createNewQuestion(type: QuestionType = "Mcq"): QuestionItem {
  const id = generateId();
  switch (type) {
    case "TrueFalse":
      return {
        id,
        text: "",
        type: "TrueFalse",
        options: [
          { text: "True", isCorrect: true },
          { text: "False", isCorrect: false },
        ],
        isOpen: true,
      };

    case "MultipleSelect":
      return {
        id,
        text: "",
        type: "MultipleSelect",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        isOpen: true,
      };

    case "ShortAnswer":
      return {
        id,
        text: "",
        type: "ShortAnswer",
        options: [{ text: "", isCorrect: true }],
        isOpen: true,
      };

    case "LongAnswer":
      return {
        id,
        text: "",
        type: "LongAnswer",
        options: [{ text: "", isCorrect: true }],
        isOpen: true,
      };

    case "FillInTheBlank":
      return {
        id,
        text: "",
        type: "FillInTheBlank",
        options: [{ text: "", isCorrect: true }],
        isOpen: true,
      };

    case "Matching":
      return {
        id,
        text: "",
        type: "Matching",
        options: [
          { text: "", matchingText: "", isCorrect: true },
          { text: "", matchingText: "", isCorrect: true },
          { text: "", matchingText: "", isCorrect: true },
        ],
        isOpen: true,
      };

    case "OrderSequencing":
      return {
        id,
        text: "",
        type: "OrderSequencing",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: true },
          { text: "", isCorrect: true },
        ],
        isOpen: true,
      };

    case "Numeric":
      return {
        id,
        text: "",
        type: "Numeric",
        options: [{ text: "", isCorrect: true }],
        isOpen: true,
      };

    case "Mcq":
    default:
      return {
        id,
        text: "",
        type: "Mcq",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        isOpen: true,
      };
  }
}

function emptyQuestion(): QuestionItem {
  return createNewQuestion("Mcq");
}

/* ── Page ──────────────────────────────────────── */

export default function CreatePage() {
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  // Categories from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  // Creation mode
  const [mode, setMode] = useState<CreationMode>("manual");

  // Shared quiz metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [timeHours, setTimeHours] = useState(0);
  const [timeMinutes, setTimeMinutes] = useState(5);
  const [isPrivate, setIsPrivate] = useState(false);

  // Cover image upload
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);

  // Manual mode: questions
  const [questions, setQuestions] = useState<QuestionItem[]>([emptyQuestion()]);
  const [openTypeMenuId, setOpenTypeMenuId] = useState<string | null>(null);

  // AI mode
  const [aiNotes, setAiNotes] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load profile + categories
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [profileRes, cats] = await Promise.all([
          getProfileData(),
          getCategoryData().catch(() => [] as Category[]),
        ]);

        if (mounted && profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          setUserXp(profileRes.data.xp ?? 0);
          setUserStreak(profileRes.data.streak ?? 0);
          setUserLevel(profileRes.data.level ?? 1);
        }

        const availableCats =
          cats.length > 0
            ? cats
            : useQuizStore.getState().categories || [];

        if (mounted && availableCats.length > 0) {
          setCategories(availableCats);
          setCategoryId((prev) => prev || availableCats[0].id);
        }
      } catch {
        // silent
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        openTypeMenuId &&
        !(e.target as HTMLElement).closest("[data-type-menu]")
      ) {
        setOpenTypeMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openTypeMenuId]);

  /* ── Cover Image Handlers ────────────────────── */

  const handleCoverFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      goeyToast.error("Invalid file format", {
        description: "Please upload an image (PNG, JPG, or WEBP).",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      goeyToast.error("File is too large", {
        description: "Image size must be 5MB or less.",
      });
      return;
    }

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverImagePreview(e.target?.result as string);
      goeyToast.success("Cover picture added!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = "";
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingCover(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCoverFileChange(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCoverFileChange(file);
  };

  /* ── Manual: Question Management ─────────────── */

  const addQuestion = (type: QuestionType = "Mcq") => {
    const q = createNewQuestion(type);
    setQuestions((prev) => [...prev.map((p) => ({ ...p, isOpen: false })), q]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const toggleQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isOpen: !q.isOpen } : q))
    );
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, text } : q))
    );
  };

  const switchQuestionType = (id: string, newType: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (q.type === newType) return q;

        const template = createNewQuestion(newType);
        let newOptions = template.options;

        if (
          (q.type === "Mcq" && newType === "MultipleSelect") ||
          (q.type === "MultipleSelect" && newType === "Mcq")
        ) {
          newOptions = q.options.map((o, idx) => ({
            ...o,
            isCorrect: newType === "Mcq" ? idx === 0 : o.isCorrect,
          }));
        } else if (newType === "Matching") {
          newOptions =
            q.options.length >= 2
              ? q.options.slice(0, 4).map((o) => ({
                  text: o.text || "",
                  matchingText: o.matchingText || "",
                  isCorrect: true,
                }))
              : template.options;
        } else if (
          newType === "ShortAnswer" ||
          newType === "LongAnswer" ||
          newType === "FillInTheBlank" ||
          newType === "Numeric"
        ) {
          const first = q.options[0]?.text || "";
          newOptions = [{ text: first, isCorrect: true }];
        } else if (newType === "OrderSequencing") {
          newOptions =
            q.options.length >= 2
              ? q.options.map((o) => ({ text: o.text || "", isCorrect: true }))
              : template.options;
        }

        return {
          ...q,
          type: newType,
          options: newOptions,
        };
      })
    );
  };

  const updateOptionText = (qId: string, optIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o, i) =>
                i === optIdx ? { ...o, text } : o
              ),
            }
          : q
      )
    );
  };

  const setCorrectOption = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o, i) => ({
                ...o,
                isCorrect: i === optIdx,
              })),
            }
          : q
      )
    );
  };

  const toggleMultiSelectOption = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        return {
          ...q,
          options: q.options.map((o, i) =>
            i === optIdx ? { ...o, isCorrect: !o.isCorrect } : o
          ),
        };
      })
    );
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length < 6
          ? { ...q, options: [...q.options, { text: "", isCorrect: false }] }
          : q
      )
    );
  };

  const removeOption = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || q.options.length <= 2) return q;
        const newOptions = q.options.filter((_, i) => i !== optIdx);
        if (q.type === "Mcq" && !newOptions.some((o) => o.isCorrect)) {
          newOptions[0].isCorrect = true;
        }
        return { ...q, options: newOptions };
      })
    );
  };

  const updateMatchingText = (
    qId: string,
    optIdx: number,
    matchingText: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o, i) =>
                i === optIdx ? { ...o, matchingText } : o
              ),
            }
          : q
      )
    );
  };

  const addMatchingPair = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length < 6
          ? {
              ...q,
              options: [
                ...q.options,
                { text: "", matchingText: "", isCorrect: true },
              ],
            }
          : q
      )
    );
  };

  const removeMatchingPair = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length > 2
          ? {
              ...q,
              options: q.options.filter((_, i) => i !== optIdx),
            }
          : q
      )
    );
  };

  const moveSequencingStep = (
    qId: string,
    optIdx: number,
    direction: "up" | "down"
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const targetIdx = direction === "up" ? optIdx - 1 : optIdx + 1;
        if (targetIdx < 0 || targetIdx >= q.options.length) return q;
        const newOpts = [...q.options];
        const temp = newOpts[optIdx];
        newOpts[optIdx] = newOpts[targetIdx];
        newOpts[targetIdx] = temp;
        return { ...q, options: newOpts };
      })
    );
  };

  const addSequencingStep = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length < 8
          ? { ...q, options: [...q.options, { text: "", isCorrect: true }] }
          : q
      )
    );
  };

  const removeSequencingStep = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length > 2
          ? { ...q, options: q.options.filter((_, i) => i !== optIdx) }
          : q
      )
    );
  };

  const addAlternativeAnswer = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length < 5
          ? { ...q, options: [...q.options, { text: "", isCorrect: true }] }
          : q
      )
    );
  };

  const removeAlternativeAnswer = (qId: string, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId && q.options.length > 1
          ? { ...q, options: q.options.filter((_, i) => i !== optIdx) }
          : q
      )
    );
  };

  const insertBlankPlaceholder = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const textWithBlank = q.text ? `${q.text} [blank]` : "[blank]";
        return { ...q, text: textWithBlank };
      })
    );
  };

  /* ── Validation ──────────────────────────────── */

  const manualValidation = useMemo(() => {
    const errors: string[] = [];
    if (!title.trim()) errors.push("Quiz title is required");
    if (!categoryId) errors.push("Category is required");
    if (timeHours === 0 && timeMinutes === 0)
      errors.push("Time limit must be at least 1 minute");
    if (questions.length === 0) errors.push("Add at least one question");

    questions.forEach((q, i) => {
      const qNum = i + 1;
      if (!q.text.trim()) {
        errors.push(`Question ${qNum}: Question prompt cannot be empty`);
        return;
      }

      switch (q.type) {
        case "Mcq": {
          const filled = q.options.filter((o) => o.text.trim());
          if (filled.length < 2) {
            errors.push(`Question ${qNum} (MCQ): Needs at least 2 options`);
          }
          if (!q.options.some((o) => o.isCorrect && o.text.trim())) {
            errors.push(`Question ${qNum} (MCQ): Needs a marked correct answer`);
          }
          break;
        }

        case "TrueFalse": {
          if (!q.options.some((o) => o.isCorrect)) {
            errors.push(`Question ${qNum} (True/False): Select whether True or False is correct`);
          }
          break;
        }

        case "MultipleSelect": {
          const filled = q.options.filter((o) => o.text.trim());
          if (filled.length < 2) {
            errors.push(`Question ${qNum} (Multiple Select): Needs at least 2 options`);
          }
          if (!q.options.some((o) => o.isCorrect && o.text.trim())) {
            errors.push(`Question ${qNum} (Multiple Select): Select at least 1 correct answer`);
          }
          break;
        }

        case "ShortAnswer": {
          const primary = q.options[0]?.text?.trim();
          if (!primary) {
            errors.push(`Question ${qNum} (Short Answer): Primary accepted answer is required`);
          }
          break;
        }

        case "LongAnswer": {
          const sample = q.options[0]?.text?.trim();
          if (!sample) {
            errors.push(`Question ${qNum} (Long Answer): Sample answer / rubric is required`);
          }
          break;
        }

        case "FillInTheBlank": {
          const blankAns = q.options[0]?.text?.trim();
          if (!blankAns) {
            errors.push(`Question ${qNum} (Fill in Blank): Missing correct answer for the blank`);
          }
          break;
        }

        case "Matching": {
          const validPairs = q.options.filter(
            (o) => o.text.trim() && o.matchingText?.trim()
          );
          if (validPairs.length < 2) {
            errors.push(`Question ${qNum} (Matching): Needs at least 2 complete pairs (item + match)`);
          }
          break;
        }

        case "OrderSequencing": {
          const validSteps = q.options.filter((o) => o.text.trim());
          if (validSteps.length < 2) {
            errors.push(`Question ${qNum} (Sequencing): Needs at least 2 ordered steps`);
          }
          break;
        }

        case "Numeric": {
          const numStr = q.options[0]?.text?.trim();
          if (!numStr || isNaN(Number(numStr))) {
            errors.push(`Question ${qNum} (Numeric): Enter a valid numerical answer`);
          }
          break;
        }

        default:
          break;
      }
    });

    return errors;
  }, [title, categoryId, timeHours, timeMinutes, questions]);

  const aiValidation = useMemo(() => {
    const errors: string[] = [];
    if (!title.trim()) errors.push("Quiz title is required");
    if (!categoryId) errors.push("Category is required");
    if (timeHours === 0 && timeMinutes === 0)
      errors.push("Time limit must be at least 1 minute");
    if (!aiNotes.trim() || aiNotes.trim().length < 30)
      errors.push("Paste at least 30 characters of notes");
    return errors;
  }, [title, categoryId, timeHours, timeMinutes, aiNotes]);

  /* ── Submit: Manual ──────────────────────────── */

  const handleManualSubmit = async () => {
    const token = getToken();
    if (!token) {
      goeyToast.error("Authentication required", {
        description: "Please log in to publish your quiz.",
      });
      router.push("/login");
      return;
    }

    if (manualValidation.length > 0) {
      goeyToast.error("Fix the following errors:", {
        description: manualValidation[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedCoverUrl: string | undefined = undefined;

      if (coverImageFile) {
        try {
          uploadedCoverUrl = await uploadToImageKit(coverImageFile);
        } catch (uploadErr: any) {
          console.error("Cover image upload failed:", uploadErr);
          goeyToast.error("Cover upload failed", {
            description:
              uploadErr.message ||
              "Failed to upload cover picture to ImageKit. Please try again.",
          });
          setIsSubmitting(false);
          return;
        }
      } else if (coverImagePreview && !coverImagePreview.startsWith("data:")) {
        uploadedCoverUrl = coverImagePreview;
      }

      const timeAllocated = Math.max(60, timeHours * 3600 + timeMinutes * 60);
      const payload: CreateQuizPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        ...(uploadedCoverUrl ? { coverPicture: uploadedCoverUrl } : {}),
        categoryId,
        difficulty,
        timeAllocated,
        isPrivate,
        isDraft: false,
        creationMode: "Manual",
        questions: questions.map((q) => {
          let formattedOptions: any[] = [];

          switch (q.type) {
            case "Mcq":
            case "MultipleSelect":
              formattedOptions = q.options
                .filter((o) => o.text.trim())
                .map((o) => ({
                  text: o.text.trim(),
                  isCorrect: !!o.isCorrect,
                }));
              break;

            case "TrueFalse":
              formattedOptions = [
                { text: "True", isCorrect: q.options[0]?.isCorrect ?? true },
                { text: "False", isCorrect: q.options[1]?.isCorrect ?? false },
              ];
              break;

            case "ShortAnswer":
            case "FillInTheBlank":
              formattedOptions = q.options
                .filter((o) => o.text.trim())
                .map((o) => ({
                  text: o.text.trim(),
                  isCorrect: true,
                }));
              break;

            case "LongAnswer":
              formattedOptions = [
                {
                  text: q.options[0]?.text?.trim() || "",
                  isCorrect: true,
                },
              ];
              break;

            case "Matching":
              formattedOptions = q.options
                .filter((o) => o.text.trim() && o.matchingText?.trim())
                .map((o) => ({
                  text: o.text.trim(),
                  matchingText: o.matchingText?.trim() || "",
                  isCorrect: true,
                }));
              break;

            case "OrderSequencing":
              formattedOptions = q.options
                .filter((o) => o.text.trim())
                .map((o) => ({
                  text: o.text.trim(),
                  isCorrect: true,
                }));
              break;

            case "Numeric":
              formattedOptions = [
                {
                  text: q.options[0]?.text?.trim() || "0",
                  isCorrect: true,
                },
              ];
              break;

            default:
              formattedOptions = q.options;
          }

          return {
            text: q.text.trim(),
            type: q.type,
            answerOptions: formattedOptions,
          };
        }),
      };

      await createQuiz(payload);

      // Invalidate store cache so explore page immediately reflects the new quiz
      try {
        useQuizStore.getState().fetchQuizzes(true);
      } catch {
        // silent
      }

      goeyToast.success("Quiz Created!", {
        description: `"${title}" has been published successfully.`,
      });

      router.push("/explore");
    } catch (err: any) {
      goeyToast.error("Failed to create quiz", {
        description: err.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Submit: AI ──────────────────────────────── */

  const handleAiGenerate = async () => {
    const token = getToken();
    if (!token) {
      goeyToast.error("Authentication required", {
        description: "Please log in to generate an AI quiz.",
      });
      router.push("/login");
      return;
    }

    if (aiValidation.length > 0) {
      goeyToast.error("Fix the following errors:", {
        description: aiValidation[0],
      });
      return;
    }

    setIsGenerating(true);

    try {
      let uploadedCoverUrl: string | undefined = undefined;

      if (coverImageFile) {
        try {
          uploadedCoverUrl = await uploadToImageKit(coverImageFile);
        } catch (uploadErr: any) {
          console.error("Cover image upload failed:", uploadErr);
          goeyToast.error("Cover upload failed", {
            description:
              uploadErr.message ||
              "Failed to upload cover picture to ImageKit. Please try again.",
          });
          setIsGenerating(false);
          return;
        }
      } else if (coverImagePreview && !coverImagePreview.startsWith("data:")) {
        uploadedCoverUrl = coverImagePreview;
      }

      const timeAllocated = Math.max(60, timeHours * 3600 + timeMinutes * 60);
      const payload: CreateQuizPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        ...(uploadedCoverUrl ? { coverPicture: uploadedCoverUrl } : {}),
        categoryId,
        difficulty,
        timeAllocated,
        isPrivate,
        isDraft: false,
        creationMode: "AI",
        aiPrompt: aiNotes.trim(),
        questionCount: aiQuestionCount,
      };

      await createQuiz(payload);

      try {
        useQuizStore.getState().fetchQuizzes(true);
      } catch {
        // silent
      }

      goeyToast.success("AI Quiz Generated!", {
        description: `"${title}" has been created with ${aiQuestionCount} questions.`,
      });

      router.push("/explore");
    } catch (err: any) {
      goeyToast.error("Failed to generate quiz", {
        description: err.message || "Something went wrong.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Render ──────────────────────────────────── */

  const usernameDisplay =
    profile?.username || profile?.firstName || "Quizzer";

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-pink selection:text-white">
      <DashboardNavbar
        userName={usernameDisplay}
        userXp={userXp}
        userStreak={userStreak}
        userLevel={userLevel}
        profilePicture={profile?.profilePicture}
        email={profile?.email}
      />

      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8">
        {/* ── Page Header ──────────────────────── */}
        <section className="text-center sm:text-left">
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.05em] leading-[1.1] mb-2">
            Create a <span className="highlight">quiz.</span>
          </h1>
          <p className="text-muted text-[0.92rem] sm:text-[1rem] leading-[1.6] max-w-xl mx-auto sm:mx-0">
            Build your own quiz deck manually or let AI generate questions.
          </p>
        </section>

        {/* ── Mode Switcher (Tab Pills) ──────── */}
        <section className="flex justify-center">
          <div className="relative inline-flex items-center bg-white border-2 border-ink rounded-[14px] p-1 shadow-[4px_4px_0_#16151d]">
            {/* Sliding active indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-[10px] bg-ink shadow-[2px_2px_0_#ff5277] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                width: "calc(50% - 4px)",
                left: mode === "manual" ? "4px" : "calc(50% + 0px)",
              }}
            />

            <button
              onClick={() => setMode("manual")}
              className={`relative z-10 flex items-center justify-center gap-2 w-[130px] sm:w-[175px] py-2.5 rounded-[10px] text-[0.82rem] sm:text-[0.88rem] font-extrabold cursor-pointer transition-colors duration-300 ${
                mode === "manual" ? "text-white" : "text-muted hover:text-ink"
              }`}
            >
              <PenLine className="w-4 h-4" />
              <span className="hidden sm:inline">Manual Builder</span>
              <span className="sm:hidden">Manual</span>
            </button>

            <button
              onClick={() => setMode("ai")}
              className={`relative z-10 flex items-center justify-center gap-2 w-[130px] sm:w-[175px] py-2.5 rounded-[10px] text-[0.82rem] sm:text-[0.88rem] font-extrabold cursor-pointer transition-colors duration-300 ${
                mode === "ai" ? "text-white" : "text-muted hover:text-ink"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Generator</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </section>

        {/* ── Quiz Metadata Card ───────────────── */}
        <section className="bg-white border-2 border-ink rounded-[20px] p-5 sm:p-7 shadow-[6px_6px_0_#16151d] space-y-5">
          <div className="flex items-center gap-2 mb-1">
            {/* <FileText className="w-4 h-4 text-pink" /> */}
            <h2 className="text-[1.1rem] font-extrabold tracking-[-0.03em]">
              Quiz Details
            </h2>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. World History Essentials"
              className="w-full p-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-[0.88rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of what this quiz covers..."
              className="w-full p-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-[0.88rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all resize-none"
            />
          </div>

          {/* Cover Picture (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
                Cover Picture
              </label>
            </div>

            {/* Hidden file input */}
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!coverImagePreview ? (
              /* Dropzone empty state */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingCover(true);
                }}
                onDragLeave={() => setIsDraggingCover(false)}
                onDrop={handleFileDrop}
                onClick={() => coverFileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed rounded-[16px] cursor-pointer transition-all ${
                  isDraggingCover
                    ? "border-pink bg-pink/10 ring-2 ring-pink scale-[1.01]"
                    : "border-ink/30 bg-paper hover:bg-white hover:border-ink hover:shadow-[4px_4px_0_#16151d]"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-pink/15 text-pink flex items-center justify-center border-2 border-ink mb-2.5 shadow-[2px_2px_0_#16151d] transition-transform group-hover:scale-105">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-[0.86rem] font-extrabold text-ink text-center">
                  Upload Cover Picture
                </p>
                <p className="text-[0.72rem] font-dm-mono text-muted mt-1 text-center">
                  PNG, JPG, or WEBP up to 5MB (16:9 recommended)
                </p>
              </div>
            ) : (
              /* Image preview state */
              <div className="relative rounded-[16px] border-2 border-ink bg-white p-3 shadow-[4px_4px_0_#16151d] space-y-2">
                <div className="relative w-full h-[180px] sm:h-[220px] rounded-[12px] overflow-hidden border-2 border-ink bg-paper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImagePreview}
                    alt="Quiz cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border-2 border-ink rounded-[10px] text-[0.75rem] font-extrabold text-ink shadow-[2px_2px_0_#16151d] hover:bg-paper cursor-pointer transition-transform hover:-translate-y-0.5"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="p-1.5 bg-white text-pink border-2 border-ink rounded-[10px] shadow-[2px_2px_0_#16151d] hover:bg-pink/10 cursor-pointer transition-transform hover:-translate-y-0.5"
                      aria-label="Remove cover picture"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[0.75rem] font-dm-mono text-ink font-bold truncate max-w-[260px]">
                    {coverImageFile?.name || "cover-image.png"}
                  </span>
                  <span className="text-[0.72rem] font-dm-mono text-muted">
                    {coverImageFile
                      ? `${(coverImageFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category + Difficulty + Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div className="space-y-1.5" ref={categoryDropdownRef}>
              <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                Category *
              </label>
              <div className="relative">
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown((p) => !p)}
                  className={`w-full flex items-center justify-between p-3 bg-paper border-2 rounded-[12px] font-medium text-[0.88rem] text-ink cursor-pointer transition-all ${
                    showCategoryDropdown
                      ? "border-pink ring-2 ring-pink"
                      : "border-ink hover:border-ink/70"
                  }`}
                >
                  <span className={categoryId ? "text-ink" : "text-muted/60"}>
                    {categories.find((c) => c.id === categoryId)?.name ||
                      (categories.length === 0
                        ? "Loading..."
                        : "Select a category")}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      showCategoryDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown list */}
                {showCategoryDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border-2 border-ink rounded-[12px] shadow-[4px_4px_0_#16151d] py-1.5 max-h-[200px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {categories.length === 0 ? (
                      <div className="px-3 py-2 text-[0.82rem] text-muted">
                        No categories found
                      </div>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(cat.id);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${
                            categoryId === cat.id
                              ? "bg-pink/10 text-pink font-bold"
                              : "text-ink hover:bg-paper"
                          }`}
                        >
                          {cat.name}
                          {categoryId === cat.id && (
                            <Check className="inline-block w-3.5 h-3.5 ml-1.5 text-pink" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                Difficulty
              </label>
              <div className="flex gap-1.5">
                {(["Easy", "Medium", "Hard"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-[10px] text-[0.78rem] font-bold border-2 border-ink transition-all cursor-pointer ${
                      difficulty === d
                        ? d === "Easy"
                          ? "bg-lime text-ink shadow-[2px_2px_0_#16151d]"
                          : d === "Hard"
                          ? "bg-pink text-white shadow-[2px_2px_0_#16151d]"
                          : "bg-lilac text-purple-900 shadow-[2px_2px_0_#16151d]"
                        : "bg-white text-ink hover:bg-paper"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Allocated (Hours & Minutes only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
                   Time Limit
                </label>
              </div>

              {/* Hours & Minutes paired inputs */}
              <div className="grid grid-cols-2 gap-2">
                {/* Hours */}
                <div className="relative flex items-center bg-paper border-2 border-ink rounded-[12px] focus-within:border-pink focus-within:ring-2 focus-within:ring-pink transition-all">
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={timeHours}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTimeHours(isNaN(val) ? 0 : Math.max(0, Math.min(12, val)));
                    }}
                    className="w-full py-2.5 pl-3 pr-8 bg-transparent font-dm-mono font-bold text-[0.88rem] text-ink focus:outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-2.5 text-[0.7rem] font-bold font-dm-mono text-muted uppercase pointer-events-none">
                    hrs
                  </span>
                </div>

                {/* Minutes */}
                <div className="relative flex items-center bg-paper border-2 border-ink rounded-[12px] focus-within:border-pink focus-within:ring-2 focus-within:ring-pink transition-all">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={timeMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTimeMinutes(isNaN(val) ? 0 : Math.max(0, Math.min(59, val)));
                    }}
                    className="w-full py-2.5 pl-3 pr-9 bg-transparent font-dm-mono font-bold text-[0.88rem] text-ink focus:outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-2.5 text-[0.7rem] font-bold font-dm-mono text-muted uppercase pointer-events-none">
                    mins
                  </span>
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {[
                  { h: 0, m: 3, label: "3m" },
                  { h: 0, m: 5, label: "5m" },
                  { h: 0, m: 10, label: "10m" },
                  { h: 0, m: 15, label: "15m" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setTimeHours(preset.h);
                      setTimeMinutes(preset.m);
                    }}
                    className={`px-2 py-0.5 rounded-[6px] text-[0.66rem] font-dm-mono font-bold border transition-all cursor-pointer ${
                      timeHours === preset.h && timeMinutes === preset.m
                        ? "bg-ink text-white border-ink shadow-[1px_1px_0_#ff5277]"
                        : "bg-paper text-muted border-ink/20 hover:border-ink hover:text-ink"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-ink/10">
            <div className="flex items-center gap-2">
              {isPrivate ? (
                <EyeOff className="w-4 h-4 text-muted" />
              ) : (
                <Eye className="w-4 h-4 text-muted" />
              )}
              <span className="text-[0.85rem] font-bold text-ink">
                {isPrivate ? "Private Quiz" : "Public Quiz"}
              </span>
              <span className="text-[0.75rem] text-muted">
                {isPrivate
                  ? "— Only you can see it"
                  : "— Visible to everyone"}
              </span>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className="cursor-pointer text-ink hover:text-pink transition-colors"
              aria-label="Toggle privacy"
            >
              {isPrivate ? (
                <ToggleRight className="w-7 h-7 text-pink" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-muted" />
              )}
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════ */}
        {/* ── MANUAL MODE ──────────────────────── */}
        {/* ══════════════════════════════════════ */}
        {mode === "manual" && (
          <>
            {/* Questions Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[1.15rem] font-extrabold tracking-[-0.03em] flex items-center gap-2">
                  
                  Questions
                </h2>
              </div>

              {/* Question List */}
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="bg-white border-2 border-ink rounded-[18px] shadow-[4px_4px_0_#16151d] overflow-hidden transition-all"
                  >
                    {/* Question Header (always visible) */}
                    <div
                      onClick={() => toggleQuestion(q.id)}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-paper/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-pink text-white flex items-center justify-center text-[0.72rem] font-extrabold shrink-0 border border-ink">
                        {qIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.88rem] font-bold text-ink truncate">
                          {q.text.trim() || "Untitled question"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`inline-flex   px-2 py-0.5  text-[0.63rem] text-nowrap font-bold font-dm-mono  ${getTypeConfig(q.type).colorClass}`}
                          >
                            {/* {React.createElement(getTypeConfig(q.type).icon, {
                              className: "w-3 h-3",
                            })} */}
                            {getTypeConfig(q.type).label}
                          </span>
                          {/* <span className="text-[0.68rem] font-dm-mono text-muted truncate">
                            • {getQuestionSummary(q)}
                          </span> */}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(q.id);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-pink hover:bg-pink/10 transition-colors cursor-pointer"
                          aria-label="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {q.isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted" />
                        )}
                      </div>
                    </div>

                    {/* Question Body (collapsible) */}
                    {q.isOpen && (
                      <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-ink/10 space-y-4">
                        {/* Type Switcher Toolbar */}
                        <div
                          data-type-menu
                          className="flex flex-wrap items-center  justify-end gap-2 p-2.5 "
                        >
                          {/* <div className="flex items-center gap-2">
                            <span className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Question Type:
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[0.78rem] font-extrabold border border-ink ${getTypeConfig(q.type).colorClass}`}
                            >
                              {React.createElement(getTypeConfig(q.type).icon, {
                                className: "w-3.5 h-3.5",
                              })}
                              {getTypeConfig(q.type).label}
                            </span>
                          </div> */}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenTypeMenuId(
                                  openTypeMenuId === q.id ? null : q.id
                                )
                              }
                              className="flex items-center gap-1.5 px-2.5 py-1  border border-ink rounded-[8px] text-[0.75rem] font-extrabold text-ink hover:bg-paper cursor-pointer transition-colors shadow-[1px_1px_0_#16151d]"
                            >
                              Change Type <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {openTypeMenuId === q.id && (
                              <div className="absolute right-0 z-40 mt-1.5 w-60 bg-white border-2 border-ink rounded-[14px] shadow-[4px_4px_0_#16151d] py-1.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-1 text-[0.68rem] font-bold font-dm-mono uppercase text-muted border-b border-ink/10 mb-1">
                                  Select Question Type
                                </div>
                                {QUESTION_TYPES_CONFIG.map((t) => {
                                  const Icon = t.icon;
                                  return (
                                    <button
                                      key={t.type}
                                      type="button"
                                      onClick={() => {
                                        switchQuestionType(q.id, t.type);
                                        setOpenTypeMenuId(null);
                                      }}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                                        q.type === t.type
                                          ? "bg-pink/15 text-pink font-extrabold"
                                          : "text-ink hover:bg-paper"
                                      }`}
                                    >
                                      <div
                                        className={`w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 border border-ink/20 ${t.colorClass}`}
                                      >
                                        <Icon className="w-3 h-3" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[0.78rem] font-bold leading-tight">
                                          {t.label}
                                        </p>
                                        <p className="text-[0.65rem] font-dm-mono text-muted truncate">
                                          {t.description}
                                        </p>
                                      </div>
                                      {q.type === t.type && (
                                        <Check className="w-3.5 h-3.5 text-pink shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Question Prompt *
                            </label>
                            {q.type === "FillInTheBlank" && (
                              <button
                                type="button"
                                onClick={() => insertBlankPlaceholder(q.id)}
                                className="text-[0.72rem] font-dm-mono font-bold text-pink hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Insert [blank]
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={2}
                            value={q.text}
                            onChange={(e) =>
                              updateQuestionText(q.id, e.target.value)
                            }
                            placeholder={getQuestionPlaceholder(q.type)}
                            className="w-full p-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-[0.88rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all resize-none"
                          />
                        </div>

                        {/* ── TYPE-SPECIFIC EDITORS ── */}

                        {/* 1. Multiple Choice */}
                        {q.type === "Mcq" && (
                          <div className="space-y-2">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Answer Options — click circle to mark single correct answer
                            </label>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCorrectOption(q.id, optIdx)}
                                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    opt.isCorrect
                                      ? "bg-lime border-ink text-ink shadow-[1px_1px_0_#16151d]"
                                      : "bg-white border-ink/30 text-transparent hover:border-ink hover:bg-paper"
                                  }`}
                                  aria-label={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) =>
                                    updateOptionText(q.id, optIdx, e.target.value)
                                  }
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  className={`flex-1 p-2.5 border-2 rounded-[10px] font-medium text-[0.85rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all ${
                                    opt.isCorrect
                                      ? "bg-lime/20 border-ink"
                                      : "bg-paper border-ink/40"
                                  }`}
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(q.id, optIdx)}
                                    className="p-1 text-muted hover:text-pink transition-colors cursor-pointer"
                                    aria-label="Remove option"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => addOption(q.id)}
                                className="flex items-center gap-1.5 text-[0.78rem] font-bold text-pink hover:text-ink transition-colors mt-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Option
                              </button>
                            )}
                          </div>
                        )}

                        {/* 2. True / False */}
                        {q.type === "TrueFalse" && (
                          <div className="space-y-2">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Correct Answer — select which choice is correct
                            </label>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => setCorrectOption(q.id, 0)}
                                className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-[12px] border-2 border-ink text-[0.92rem] font-extrabold cursor-pointer transition-all ${
                                  q.options[0]?.isCorrect
                                    ? "bg-lime text-ink shadow-[3px_3px_0_#16151d] scale-[1.01]"
                                    : "bg-paper text-ink/60 hover:bg-white hover:text-ink"
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                True
                              </button>
                              <button
                                type="button"
                                onClick={() => setCorrectOption(q.id, 1)}
                                className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-[12px] border-2 border-ink text-[0.92rem] font-extrabold cursor-pointer transition-all ${
                                  q.options[1]?.isCorrect
                                    ? "bg-pink text-white shadow-[3px_3px_0_#16151d] scale-[1.01]"
                                    : "bg-paper text-ink/60 hover:bg-white hover:text-ink"
                                }`}
                              >
                                <X className="w-4 h-4" />
                                False
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 3. Multiple Select */}
                        {q.type === "MultipleSelect" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                                Answer Options — check all correct choices
                              </label>
                              <span className="text-[0.68rem] font-dm-mono text-muted">
                                {q.options.filter((o) => o.isCorrect).length} of{" "}
                                {q.options.length} correct
                              </span>
                            </div>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleMultiSelectOption(q.id, optIdx)}
                                  className={`w-7 h-7 rounded-[8px] border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    opt.isCorrect
                                      ? "bg-lime border-ink text-ink shadow-[1px_1px_0_#16151d]"
                                      : "bg-white border-ink/30 text-transparent hover:border-ink hover:bg-paper"
                                  }`}
                                  aria-label={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) =>
                                    updateOptionText(q.id, optIdx, e.target.value)
                                  }
                                  placeholder={`Option ${optIdx + 1}`}
                                  className={`flex-1 p-2.5 border-2 rounded-[10px] font-medium text-[0.85rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all ${
                                    opt.isCorrect
                                      ? "bg-lime/20 border-ink"
                                      : "bg-paper border-ink/40"
                                  }`}
                                />
                                {q.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(q.id, optIdx)}
                                    className="p-1 text-muted hover:text-pink transition-colors cursor-pointer"
                                    aria-label="Remove option"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => addOption(q.id)}
                                className="flex items-center gap-1.5 text-[0.78rem] font-bold text-pink hover:text-ink transition-colors mt-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Option
                              </button>
                            )}
                          </div>
                        )}

                        {/* 4. Short Answer */}
                        {q.type === "ShortAnswer" && (
                          <div className="space-y-2.5">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Accepted Answers — primary answer & optional alternatives
                            </label>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="px-2.5 py-1.5 bg-lime/30 border border-ink rounded-[8px] text-[0.7rem] font-bold font-dm-mono text-ink shrink-0">
                                  {optIdx === 0 ? "Primary" : `Alt ${optIdx}`}
                                </span>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) =>
                                    updateOptionText(q.id, optIdx, e.target.value)
                                  }
                                  placeholder={
                                    optIdx === 0
                                      ? "e.g. Canberra"
                                      : "e.g. City of Canberra"
                                  }
                                  className="flex-1 p-2.5 bg-paper border-2 border-ink rounded-[10px] font-medium text-[0.85rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all"
                                />
                                {optIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeAlternativeAnswer(q.id, optIdx)
                                    }
                                    className="p-1 text-muted hover:text-pink transition-colors cursor-pointer"
                                    aria-label="Remove alternative answer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {q.options.length < 5 && (
                              <button
                                type="button"
                                onClick={() => addAlternativeAnswer(q.id)}
                                className="flex items-center gap-1.5 text-[0.78rem] font-bold text-pink hover:text-ink transition-colors mt-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Alternative Accepted Answer
                              </button>
                            )}
                            <p className="text-[0.72rem] font-dm-mono text-muted">
                              Matching is case-insensitive. Players get credit if their answer matches any accepted variation.
                            </p>
                          </div>
                        )}

                        {/* 5. Long Answer */}
                        {q.type === "LongAnswer" && (
                          <div className="space-y-2">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Model Answer / Evaluation Rubric
                            </label>
                            <textarea
                              rows={3}
                              value={q.options[0]?.text || ""}
                              onChange={(e) =>
                                updateOptionText(q.id, 0, e.target.value)
                              }
                              placeholder="Provide the expected complete answer, key points, or criteria for evaluation..."
                              className="w-full p-3 bg-paper border-2 border-ink rounded-[12px] font-medium text-[0.88rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all resize-none"
                            />
                            <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-2.5 flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <p className="text-[0.75rem] text-amber-900 leading-relaxed">
                                Used as the reference benchmark for grading free-text player submissions.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 6. Fill in the Blank */}
                        {q.type === "FillInTheBlank" && (
                          <div className="space-y-2.5">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Correct Blank Answer & Spellings
                            </label>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="px-2.5 py-1.5 bg-sky-100 border border-ink rounded-[8px] text-[0.7rem] font-bold font-dm-mono text-ink shrink-0">
                                  {optIdx === 0 ? "Target Blank" : `Alt ${optIdx}`}
                                </span>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) =>
                                    updateOptionText(q.id, optIdx, e.target.value)
                                  }
                                  placeholder={
                                    optIdx === 0
                                      ? "e.g. Moon"
                                      : "e.g. The Moon"
                                  }
                                  className="flex-1 p-2.5 bg-paper border-2 border-ink rounded-[10px] font-medium text-[0.85rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all"
                                />
                                {optIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeAlternativeAnswer(q.id, optIdx)
                                    }
                                    className="p-1 text-muted hover:text-pink transition-colors cursor-pointer"
                                    aria-label="Remove alternative spelling"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {q.options.length < 5 && (
                              <button
                                type="button"
                                onClick={() => addAlternativeAnswer(q.id)}
                                className="flex items-center gap-1.5 text-[0.78rem] font-bold text-pink hover:text-ink transition-colors mt-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Alternative Spelling / Synonym
                              </button>
                            )}
                            <p className="text-[0.72rem] font-dm-mono text-muted">
                              Make sure your prompt above contains <strong className="text-ink">[blank]</strong> where the player will insert this word.
                            </p>
                          </div>
                        )}

                        {/* 7. Matching */}
                        {q.type === "Matching" && (
                          <div className="space-y-2.5">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Matching Pairs — connect prompt with target
                            </label>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-paper border-2 border-ink/40 rounded-[12px]"
                                >
                                  <div className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-[0.68rem] font-bold shrink-0">
                                    {optIdx + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) =>
                                      updateOptionText(q.id, optIdx, e.target.value)
                                    }
                                    placeholder="Left Prompt (e.g. France)"
                                    className="flex-1 p-2 bg-white border border-ink rounded-[8px] font-medium text-[0.85rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink"
                                  />
                                  <div className="flex items-center justify-center text-muted shrink-0">
                                    <ArrowLeftRight className="w-4 h-4" />
                                  </div>
                                  <input
                                    type="text"
                                    value={opt.matchingText || ""}
                                    onChange={(e) =>
                                      updateMatchingText(
                                        q.id,
                                        optIdx,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Right Match (e.g. Paris)"
                                    className="flex-1 p-2 bg-white border border-ink rounded-[8px] font-medium text-[0.85rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink"
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeMatchingPair(q.id, optIdx)
                                      }
                                      className="p-1 text-muted hover:text-pink transition-colors cursor-pointer self-end sm:self-auto"
                                      aria-label="Remove matching pair"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {q.options.length < 6 && (
                              <button
                                type="button"
                                onClick={() => addMatchingPair(q.id)}
                                className="flex items-center gap-1.5 text-[0.78rem] font-bold text-pink hover:text-ink transition-colors mt-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Matching Pair
                              </button>
                            )}
                            <p className="text-[0.72rem] font-dm-mono text-muted">
                              Left and right elements will be randomly shuffled for players to match together.
                            </p>
                          </div>
                        )}

                        {/* 8. Order / Sequencing */}
                        {q.type === "OrderSequencing" && (
                          <div className="space-y-2.5">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Sequencing Steps — in correct order from first to last
                            </label>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className="flex items-center gap-2 p-2 bg-paper border-2 border-ink/40 rounded-[12px]"
                                >
                                  <span className="w-16 px-2 py-1 bg-orange-100 border border-ink rounded-[6px] text-[0.7rem] font-extrabold font-dm-mono text-ink text-center shrink-0">
                                    Step {optIdx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) =>
                                      updateOptionText(q.id, optIdx, e.target.value)
                                    }
                                    placeholder={`Describe step ${optIdx + 1}...`}
                                    className="flex-1 p-2 bg-white border border-ink rounded-[8px] font-medium text-[0.85rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink"
                                  />
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={optIdx === 0}
                                      onClick={() =>
                                        moveSequencingStep(q.id, optIdx, "up")
                                      }
                                      className="p-1.5 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      aria-label="Move step up"
                                    >
                                      <MoveUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={optIdx === q.options.length - 1}
                                      onClick={() =>
                                        moveSequencingStep(q.id, optIdx, "down")
                                      }
                                      className="p-1.5 text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      aria-label="Move step down"
                                    >
                                      <MoveDown className="w-3.5 h-3.5" />
                                    </button>
                                    {q.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeSequencingStep(q.id, optIdx)
                                        }
                                        className="p-1 text-muted hover:text-pink transition-colors cursor-pointer ml-1"
                                        aria-label="Remove step"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {q.options.length < 8 && (
                              <button
                                type="button"
                                onClick={() => addSequencingStep(q.id)}
                                className="flex items-center gap-1.5 text-[0.78rem] font-bold text-pink hover:text-ink transition-colors mt-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Next Step
                              </button>
                            )}
                            <p className="text-[0.72rem] font-dm-mono text-muted">
                              Arrange the steps in the correct order here. They will be randomized when displayed to players.
                            </p>
                          </div>
                        )}

                        {/* 9. Numeric */}
                        {q.type === "Numeric" && (
                          <div className="space-y-2">
                            <label className="text-[0.72rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                              Numerical Value — exact number required
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-2.5 bg-emerald-100 border-2 border-ink rounded-[10px] text-[0.8rem] font-extrabold font-dm-mono text-ink">
                                Number:
                              </span>
                              <input
                                type="number"
                                step="any"
                                value={q.options[0]?.text || ""}
                                onChange={(e) =>
                                  updateOptionText(q.id, 0, e.target.value)
                                }
                                placeholder="e.g. 42 or 3.14"
                                className="flex-1 p-2.5 bg-paper border-2 border-ink rounded-[10px] font-bold font-dm-mono text-[0.92rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all"
                              />
                            </div>
                            <p className="text-[0.72rem] font-dm-mono text-muted">
                              Players will type this exact number in their answer input.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Question Panel */}
              <div className="bg-white border-2 border-ink rounded-[18px] p-5 shadow-[4px_4px_0_#16151d] space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[0.78rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                    Add Question
                  </span>
                  <span className="text-[0.72rem] font-dm-mono text-muted">
                    Choose a question type
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {QUESTION_TYPES_CONFIG.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => addQuestion(t.type)}
                        className="flex items-center gap-3 p-3 bg-paper border-2 border-ink/30 rounded-[14px] text-left hover:border-ink hover:bg-white hover:shadow-[3px_3px_0_#16151d] hover:-translate-y-0.5 transition-all cursor-pointer group"
                      >
                        <div
                          className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border border-ink/20 ${t.colorClass} group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.82rem] font-extrabold text-ink leading-tight truncate">
                            {t.label}
                          </p>
                          <p className="text-[0.68rem] font-dm-mono text-muted truncate">
                            {t.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Validation Preview */}
            {manualValidation.length > 0 && (
              <div className="bg-pink/10 border-2 border-pink/40 rounded-[14px] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[0.82rem] font-extrabold text-pink">
                  <AlertCircle className="w-4 h-4" />
                  Please fix before publishing:
                </div>
                {manualValidation.map((err, i) => (
                  <p
                    key={i}
                    className="text-[0.78rem] text-pink/80 font-medium pl-6"
                  >
                    • {err}
                  </p>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="w-full button-3d button-lime justify-center py-4 text-[0.95rem] font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  Publishing Quiz...
                </span>
              ) : (
                <>
                  Publish Quiz 
                </>
              )}
            </button>
          </>
        )}

        {/* ══════════════════════════════════════ */}
        {/* ── AI MODE ──────────────────────────── */}
        {/* ══════════════════════════════════════ */}
        {mode === "ai" && (
          <>
            {/* AI Notes Input */}
            <section className="bg-lime/15 border-2 border-ink rounded-[20px] p-5 sm:p-7 shadow-[6px_6px_0_#16151d] space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="w-5 h-5 text-pink" />
                <h2 className="text-[1.1rem] font-extrabold tracking-[-0.03em]">
                  AI Quiz Generator
                </h2>
                {/* <span className="ml-auto px-2.5 py-0.5 bg-lime text-ink text-[0.68rem] font-bold font-dm-mono uppercase rounded-full border border-ink">
                  Quizlo AI
                </span> */}
              </div>

              <p className="text-muted text-[0.85rem] leading-[1.6] -mt-1">
                Paste your lecture notes, article text, or topic description below.
                Our AI engine will generate a quiz with the number of questions you
                choose.
              </p>

              {/* Notes textarea */}
              <div className="space-y-1.5">
                <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider">
                  Study Notes / Content *
                </label>
                <textarea
                  rows={7}
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Paste your study notes here — e.g. 'Active recall and spaced repetition are cognitive science techniques that improve long-term memory retention by forcing the brain to retrieve information at optimal intervals...'"
                  className="w-full p-3.5 bg-white border-2 border-ink rounded-[14px] font-medium text-[0.88rem] text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-pink focus:border-pink transition-all resize-none"
                />
                <div className="flex justify-between text-[0.72rem] font-dm-mono text-muted">
                  <span>
                    {aiNotes.length} characters
                    {aiNotes.length < 30 && aiNotes.length > 0 && (
                      <span className="text-pink ml-1">(min 30)</span>
                    )}
                  </span>
                  <span>{aiNotes.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>

              {/* Number of questions */}
              <div className="space-y-1.5">
                <label className="text-[0.75rem] font-bold font-dm-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> Number of Questions
                </label>
                <div className="flex items-center gap-2">
                  {[3, 5, 8, 10, 15].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAiQuestionCount(n)}
                      className={`px-3.5 py-2 rounded-[10px] text-[0.82rem] font-bold border-2 border-ink transition-all cursor-pointer ${
                        aiQuestionCount === n
                          ? "bg-ink text-white shadow-[2px_2px_0_#ff5277]"
                          : "bg-white text-ink hover:bg-paper shadow-[2px_2px_0_#16151d]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Tips */}
              <div className="bg-white/70 border border-ink/20 rounded-[12px] p-3.5 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-lime shrink-0 mt-0.5" />
                <div className="text-[0.8rem] text-muted leading-[1.55]">
                  <strong className="text-ink">Tips for best results:</strong> Provide
                  detailed notes with key facts, concepts, and definitions. The more
                  context you give, the better the AI-generated questions will be.
                </div>
              </div>
            </section>

            {/* Validation Preview */}
            {aiValidation.length > 0 && (
              <div className="bg-pink/10 border-2 border-pink/40 rounded-[14px] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[0.82rem] font-extrabold text-pink">
                  <AlertCircle className="w-4 h-4" />
                  Please fix before generating:
                </div>
                {aiValidation.map((err, i) => (
                  <p
                    key={i}
                    className="text-[0.78rem] text-pink/80 font-medium pl-6"
                  >
                    • {err}
                  </p>
                ))}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || aiValidation.length > 0}
              className="w-full button-3d justify-center py-4 text-[0.95rem] font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating {aiQuestionCount} Questions...
                </span>
              ) : (
                <>
                  Generate AI Quiz 
                </>
              )}
            </button>
          </>
        )}
      </main>

      {/* Footer */}
      {/* <footer className="py-6 border-t border-ink/10 text-center text-[0.78rem] text-muted font-medium">
        © 2026 Quizlo. Made for the endlessly curious.
      </footer> */}
    </div>
  );
}
