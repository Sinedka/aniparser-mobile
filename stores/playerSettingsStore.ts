import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PlayerSettingsState = {
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
};

export const usePlayerSettingsStore = create<PlayerSettingsState>()(
  persist(
    set => ({
      playbackRate: 1,
      setPlaybackRate: rate => set({ playbackRate: rate }),
    }),
    {
      name: 'player-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
