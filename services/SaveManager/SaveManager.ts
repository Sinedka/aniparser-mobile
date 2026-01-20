import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ===== Типы ===== */

export interface PlayerSettings {
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
}

export interface AnimeSaveData {
  player: number;
  dubber: number;
  episode: number;
  time: number;
}

/* ===== Store ===== */

interface PlayerStore {
  settings: PlayerSettings;
  animeProgress: Record<string, AnimeSaveData>;
  animeStatus: Record<string, number>;
  history: string[];
  favourites: string[];

  /* settings */
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;

  /* progress */
  saveAnimeProgress: (url: string, data: AnimeSaveData) => void;
  clearAnimeProgress: (url: string) => void;

  /* history */
  addToHistory: (url: string) => void;

  /* favourites */
  addToFavourites: (url: string) => void;
  removeFromFavourites: (url: string) => void;

  /* status */
  setAnimeStatus: (url: string, status: number) => void;
}

/* ===== Default ===== */

const DEFAULT_SETTINGS: PlayerSettings = {
  playbackSpeed: 1.0,
  volume: 1.0,
  isMuted: false,
};

/* ===== Store ===== */

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      animeProgress: {},
      animeStatus: {},
      history: [],
      favourites: [],

      /* ===== settings ===== */

      setPlaybackSpeed: speed =>
        set(state => ({
          settings: { ...state.settings, playbackSpeed: speed },
        })),

      setVolume: volume =>
        set(state => ({
          settings: { ...state.settings, volume },
        })),

      setMuted: isMuted =>
        set(state => ({
          settings: { ...state.settings, isMuted },
        })),

      /* ===== progress ===== */

      saveAnimeProgress: (url, data) =>
        set(state => ({
          animeProgress: {
            ...state.animeProgress,
            [url]: data,
          },
        })),

      clearAnimeProgress: url =>
        set(state => {
          const progress = { ...state.animeProgress };
          delete progress[url];
          return { animeProgress: progress };
        }),

      /* ===== history ===== */

      addToHistory: url =>
        set(state => ({
          history: [
            url,
            ...state.history.filter(item => item !== url),
          ],
        })),

      /* ===== favourites ===== */

      addToFavourites: url =>
        set(state => ({
          favourites: [
            url,
            ...state.favourites.filter(item => item !== url),
          ],
        })),

      removeFromFavourites: url =>
        set(state => ({
          favourites: state.favourites.filter(item => item !== url),
        })),

      /* ===== status ===== */

      setAnimeStatus: (url, status) =>
        set(state => {
          const newStatus = { ...state.animeStatus };
          if (status === 0) delete newStatus[url];
          else newStatus[url] = status;
          return { animeStatus: newStatus };
        }),
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
