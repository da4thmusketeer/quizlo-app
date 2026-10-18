import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Quiz, Category, getAllQuizzes, getCategoryData } from "@/lib/quiz";

let quizzesRequest: Promise<Quiz[]> | null = null;
let categoriesRequest: Promise<Category[]> | null = null;

// Cache access must never prevent a successful API response from updating the UI.
const cacheStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      if (typeof window === "undefined") return null;
      const value = localStorage.getItem(name);
      if (value) JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(name, value);
    } catch {
      // Continue with the in-memory cache when storage is unavailable or full.
    }
  },
  removeItem: (name: string) => {
    try {
      if (typeof window !== "undefined") localStorage.removeItem(name);
    } catch {
      // Storage is optional.
    }
  },
}));

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
        if (quizzesRequest) return quizzesRequest;
        const state = get();
        // If already cached and not forced, return cached quizzes without network request
        if (!force && state.isQuizzesFetched) {
          return state.quizzes;
        }

        set({ isLoadingQuizzes: true, quizzesError: null });
        quizzesRequest = (async () => {
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
            return get().quizzes;
          }
        })().finally(() => {
          quizzesRequest = null;
        });
        return quizzesRequest;
      },

      fetchCategories: async (force = false) => {
        if (categoriesRequest) return categoriesRequest;
        const state = get();
        // If already cached and not forced, return cached categories without network request
        if (!force && state.isCategoriesFetched) {
          return state.categories;
        }

        set({ isLoadingCategories: true, categoriesError: null });
        categoriesRequest = (async () => {
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
            return get().categories;
          }
        })().finally(() => {
          categoriesRequest = null;
        });
        return categoriesRequest;
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
      storage: cacheStorage,
      onRehydrateStorage: (state) => () => {
        state.setHasHydrated(true);
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
