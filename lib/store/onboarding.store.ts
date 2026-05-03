import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BaselineModule } from "@/lib/onboarding/modules";

export interface OnboardingSkill {
  name: string;
  strengthLevel: number;
}

export interface BaselineResponse {
  moduleId: string;
  responseText?: string;
  responseAudioUrl?: string;
  responseFileUrl?: string;
  responseType: "text" | "audio" | "file";
  wordCount: number;
  responseTimeSeconds: number;
  completedAt: string;
}

interface OnboardingAnswers {
  ageGroup: string;
  profession: string;
  professionCluster: string;
  aiExposureLevel: string;
  aiUseContext: string[];
  aiReflectionNote: string;
  baselineModules: BaselineModule[];
  baselineResponses: Record<string, BaselineResponse>;
  skills: OnboardingSkill[];
}

interface OnboardingState {
  currentStep: number;
  totalWordCount: number;
  startedAt: string | null;
  answers: OnboardingAnswers;

  // Actions
  setStep: (step: number) => void;
  setAgeGroup: (v: string) => void;
  setProfession: (profession: string, cluster: string) => void;
  setAiExposureLevel: (v: string) => void;
  setAiUseContext: (v: string[]) => void;
  setAiReflectionNote: (v: string) => void;
  setBaselineModules: (modules: BaselineModule[]) => void;
  saveBaselineResponse: (response: BaselineResponse) => void;
  addSkill: (skill: OnboardingSkill) => void;
  removeSkill: (name: string) => void;
  updateSkillStrength: (name: string, strength: number) => void;
  setStartedAt: (ts: string) => void;
  recalcTotalWordCount: () => void;
  reset: () => void;
}

const DEFAULT_ANSWERS: OnboardingAnswers = {
  ageGroup: "",
  profession: "",
  professionCluster: "",
  aiExposureLevel: "",
  aiUseContext: [],
  aiReflectionNote: "",
  baselineModules: [],
  baselineResponses: {},
  skills: [],
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      totalWordCount: 0,
      startedAt: null,
      answers: { ...DEFAULT_ANSWERS },

      setStep: (step) => set({ currentStep: step }),

      setAgeGroup: (v) =>
        set((s) => ({ answers: { ...s.answers, ageGroup: v } })),

      setProfession: (profession, cluster) =>
        set((s) => ({
          answers: { ...s.answers, profession, professionCluster: cluster },
        })),

      setAiExposureLevel: (v) =>
        set((s) => ({ answers: { ...s.answers, aiExposureLevel: v } })),

      setAiUseContext: (v) =>
        set((s) => ({ answers: { ...s.answers, aiUseContext: v } })),

      setAiReflectionNote: (v) =>
        set((s) => ({ answers: { ...s.answers, aiReflectionNote: v } })),

      setBaselineModules: (modules) =>
        set((s) => ({ answers: { ...s.answers, baselineModules: modules } })),

      saveBaselineResponse: (response) =>
        set((s) => {
          const updated = {
            ...s.answers.baselineResponses,
            [response.moduleId]: response,
          };
          const totalWordCount = Object.values(updated).reduce(
            (acc, r) => acc + (r.wordCount ?? 0),
            0
          );
          return {
            totalWordCount,
            answers: { ...s.answers, baselineResponses: updated },
          };
        }),

      addSkill: (skill) =>
        set((s) => {
          if (s.answers.skills.find((sk) => sk.name === skill.name)) return s;
          return {
            answers: {
              ...s.answers,
              skills: [...s.answers.skills, skill],
            },
          };
        }),

      removeSkill: (name) =>
        set((s) => ({
          answers: {
            ...s.answers,
            skills: s.answers.skills.filter((sk) => sk.name !== name),
          },
        })),

      updateSkillStrength: (name, strength) =>
        set((s) => ({
          answers: {
            ...s.answers,
            skills: s.answers.skills.map((sk) =>
              sk.name === name ? { ...sk, strengthLevel: strength } : sk
            ),
          },
        })),

      setStartedAt: (ts) => set({ startedAt: ts }),

      recalcTotalWordCount: () => {
        const responses = get().answers.baselineResponses;
        const total = Object.values(responses).reduce(
          (acc, r) => acc + (r.wordCount ?? 0),
          0
        );
        set({ totalWordCount: total });
      },

      reset: () =>
        set({
          currentStep: 1,
          totalWordCount: 0,
          startedAt: null,
          answers: { ...DEFAULT_ANSWERS },
        }),
    }),
    {
      name: "imprint-onboarding",
      skipHydration: true,
      // Only persist answers + step, not derived state
      partialize: (s) => ({
        currentStep: s.currentStep,
        startedAt: s.startedAt,
        answers: s.answers,
        totalWordCount: s.totalWordCount,
      }),
    }
  )
);
