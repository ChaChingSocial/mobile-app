import { User } from "@/_sdk";
import { create } from "zustand";

interface ScoreStore {
    currentUserScore: number;
    setCurrentUserScore: (score: number) => void;
}

export const useScoreStore = create<ScoreStore>((set) => ({
    currentUserScore: 0,
    setCurrentUserScore: (score: number) => set({ currentUserScore: score })
}));
