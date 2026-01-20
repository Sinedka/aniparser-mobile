import { create } from 'zustand'
import { Search, Anime } from '../services/api/source/Yumme_anime_ru'

const MAX_FULL_CACHE = 20 // K элементов
const CLEANUP_INTERVAL = 3 * 60 * 1000 // каждые 3 минуты

let cleanupTimer: ReturnType<typeof setInterval> | null = null

type FullCacheEntry = {
  data: Anime
  fetchedAt: number
}

function evictOldest(
  map: Record<string, FullCacheEntry>,
  maxSize: number
): Record<string, FullCacheEntry> {
  const entries = Object.entries(map)

  if (entries.length <= maxSize) {
    return map
  }

  // сортируем по времени загрузки (старые → первые)
  const sorted = entries.sort(
    ([, a], [, b]) => a.fetchedAt - b.fetchedAt
  )

  // оставляем только последние maxSize
  const sliced = sorted.slice(entries.length - maxSize)

  return Object.fromEntries(sliced)
}


type AnimeState = {
  animeMinMap: Record<string, Search>
  animeFullMap: Record<string, FullCacheEntry>

  setAnimeMin: (anime: Search) => void
  loadAnimeFull: (id: string) => Promise<Anime>

  invalidateAnime: (id: string) => void
  startCleanup: () => void
  stopCleanup: () => void
}

export const useAnimeStore = create<AnimeState>((set, get) => ({
  animeMinMap: {},
  animeFullMap: {},

  setAnimeMin: anime =>
    set(state => ({
      animeMinMap: {
        ...state.animeMinMap,
        [anime.searchResult.anime_id]: anime,
      },
    })),

  loadAnimeFull: async (id: string) => {
    const { animeMinMap, animeFullMap } = get()

    // ✅ если уже есть — сразу возвращаем
    if (animeFullMap[id]) {
      set(state => ({
        animeFullMap: {
          ...state.animeFullMap,
          [id]: {
            ...state.animeFullMap[id],
            fetchedAt: Date.now(),
          },
        },
      }))

      return animeFullMap[id].data
    }

    const min = animeMinMap[id]
    if (!min) {
      throw new Error('AnimeMin not found')
    }

    const full = await min.getAnime()

    set(state => {
      const updated = {
        ...state.animeFullMap,
        [id]: {
          data: full,
          fetchedAt: Date.now(),
        },
      }

      return {
        animeFullMap: evictOldest(updated, MAX_FULL_CACHE),
      }
    })

    return full
  },

  invalidateAnime: id =>
    set(state => {
      const { [id]: _, ...rest } = state.animeFullMap
      return { animeFullMap: rest }
    }),

  startCleanup: () => {
    if (cleanupTimer) return

    cleanupTimer = setInterval(() => {
      set(state => ({
        animeFullMap: evictOldest(
          state.animeFullMap,
          MAX_FULL_CACHE
        ),
      }))
    }, CLEANUP_INTERVAL)
  },

  stopCleanup: () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  },
}))

