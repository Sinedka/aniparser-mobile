import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type WatchProgressEntry = {
  animeId: string;
  episodeId: string;
  dubberId: string;
  positionSeconds: number;
  updatedAt: number;
};

type WatchProgressState = {
  progressMap: Record<string, WatchProgressEntry>;
  setProgress: (entry: WatchProgressEntry) => void;
  clearProgress: (animeId: string) => void;
};

export const useWatchProgressStore = create<WatchProgressState>()(
  persist(
    set => ({
      progressMap: {},
      setProgress: entry =>
        set(state => ({
          progressMap: {
            ...state.progressMap,
            [entry.animeId]: entry,
          },
        })),
      clearProgress: animeId =>
        set(state => {
          const { [animeId]: _, ...rest } = state.progressMap;
          return { progressMap: rest };
        }),
    }),
    {
      name: 'watch-progress',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
