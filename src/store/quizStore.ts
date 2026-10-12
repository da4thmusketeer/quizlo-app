import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Quiz, Category, getAllQuizzes, getCategoryData } from "@/lib/quiz";

export interface QuizState {
  quizzes: Quiz[];
  categories: Category[];
  isLoadingQuizzes: boolean;
  isLoadingCategories: boolean;
  quizzesError: string | null;
  categoriesError: string | null;
  isQuizzesFetched: boolean;
  isCategoriesFetched: boolean;
  lastFetched: number | null;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  fetchQuizzes: (force?: boolean) => Promise<Quiz[]>;
  fetchCategories: (force?: boolean) => Promise<Category[]>;
  fetchExploreData: (force?: boolean) => Promise<{
    quizzes: Quiz[];
    categories: Category[];
  }>;
  setQuizzes: (quizzes: Quiz[]) => void;
  setCategories: (categories: Category[]) => void;
  clearCache: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      categories: [],
      isLoadingQuizzes: false,
      isLoadingCategories: false,
      quizzesError: null,
      categoriesError: null,
      isQuizzesFetched: false,
      isCategoriesFetched: false,
      lastFetched: null,
      _hasHydrated: false,

      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),

      fetchQuizzes: async (force = false) => {
        const state = get();
        // If already cached and not forced, return cached quizzes without network request
        if (!force && state.isQuizzesFetched && state.quizzes.length > 0) {
          return state.quizzes;
        }

        set({ isLoadingQuizzes: true, quizzesError: null });
        try {
          const data = await getAllQuizzes();
          const quizzes = Array.isArray(data) ? data : [];
          set({
            quizzes,
            isLoadingQuizzes: false,
            isQuizzesFetched: true,
            quizzesError: null,
            lastFetched: Date.now(),
          });
          return quizzes;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Failed to fetch quizzes";
          set({ isLoadingQuizzes: false, quizzesError: errorMsg });
          return state.quizzes;
        }
      },

      fetchCategories: async (force = false) => {
        const state = get();
        // If already cached and not forced, return cached categories without network request
        if (!force && state.isCategoriesFetched && state.categories.length > 0) {
          return state.categories;
        }

        set({ isLoadingCategories: true, categoriesError: null });
        try {
          const data = await getCategoryData();
          const categories = Array.isArray(data) ? data : [];
          set({
            categories,
            isLoadingCategories: false,
            isCategoriesFetched: true,
            categoriesError: null,
          });
          return categories;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Failed to fetch categories";
          set({ isLoadingCategories: false, categoriesError: errorMsg });
          return state.categories;
        }
      },

      fetchExploreData: async (force = false) => {
        const [categories, quizzes] = await Promise.all([
          get().fetchCategories(force),
          get().fetchQuizzes(force),
        ]);
        return { categories, quizzes };
      },

      setQuizzes: (quizzes: Quiz[]) => set({ quizzes, isQuizzesFetched: true }),

      setCategories: (categories: Category[]) =>
        set({ categories, isCategoriesFetched: true }),

      clearCache: () =>
        set({
          quizzes: [],
          categories: [],
          isQuizzesFetched: false,
          isCategoriesFetched: false,
          lastFetched: null,
          quizzesError: null,
          categoriesError: null,
        }),
    }),
    {
      name: "quizlo_explore_store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as any)
      ),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        quizzes: state.quizzes,
        categories: state.categories,
        isQuizzesFetched: state.isQuizzesFetched,
        isCategoriesFetched: state.isCategoriesFetched,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
