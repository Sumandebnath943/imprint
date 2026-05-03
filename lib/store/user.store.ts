import { create } from "zustand";
import type { Profile } from "@/types/user.types";

interface UserState {
  profile: Profile | null;
  isLoading: boolean;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
  setLoading: (v: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: false,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
  setLoading: (v) => set({ isLoading: v }),
}));
