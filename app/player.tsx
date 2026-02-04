import React, { useEffect, useRef, useState } from 'react';
import Orientation from 'react-native-orientation-locker';
import ImmersiveMode from 'react-native-immersive-mode';
import { Dimensions, StyleSheet, View } from 'react-native';
import VideoPlayer from '../components/custom/geminiPlayer';
import { useAnimeStore } from '../stores/animeStore';
import { useWatchProgressStore } from '../stores/watchProgressStore';
import { Anime } from '../services/api/source/Yumme_anime_ru';
import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';

export default function VideoPlayerScreen({
  route,
}: StaticScreenProps<{ 
  id: Number;
  selectedPlayerIndex?: number;
  selectedDubberIndex?: number;
  selectedEpisodeIndex?: number;
  changeReason?: 'player' | 'dubber' | 'episode';
}>) {
  const { id } = route.params;
  const navigation = useNavigation();
  const [full, setFull] = useState<Anime | null>(null);
  const [screenSize, setScreenSize] = useState(Dimensions.get('screen'));
  const didApplyStoredSelectionRef = useRef(false);
  
  // Состояние для выбранных индексов
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [selectedDubberIndex, setSelectedDubberIndex] = useState(0);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [seekBehavior, setSeekBehavior] = useState<'reset' | 'back10'>('reset');

  const animeId = id?.toString();
  const progressEntry = useWatchProgressStore(state =>
    animeId ? state.progressMap[animeId] : undefined
  );
  const setProgress = useWatchProgressStore(state => state.setProgress);
  
  // Текущее выбранное видео
  const currentVideo = full?.players[selectedPlayerIndex]?.dubbers[selectedDubberIndex]?.episodes[selectedEpisodeIndex];
  const currentDubber = full?.players[selectedPlayerIndex]?.dubbers[selectedDubberIndex];

  // Функции для VideoPlayer
  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const navigateToPanel = (view: 'player' | 'dubber' | 'episode') => {
    // navigation уже является drawer навигацией, так как Player находится внутри drawer
    // Обновляем параметры текущего Player роута и открываем drawer
    (navigation as any).navigate('Player', { 
      id,
      view,
      selectedPlayerIndex,
      selectedDubberIndex,
      selectedEpisodeIndex,
    });
    navigation.dispatch(DrawerActions.openDrawer());
  };
  
  // Слушаем изменения параметров route для обновления выбранных значений
  useEffect(() => {
    const params = route.params as {
      selectedPlayerIndex?: number;
      selectedDubberIndex?: number;
      selectedEpisodeIndex?: number;
      changeReason?: 'player' | 'dubber' | 'episode';
    } | undefined;

    if (params) {
      if (params.selectedPlayerIndex !== undefined) {
        setSelectedPlayerIndex(params.selectedPlayerIndex);
      }
      if (params.selectedDubberIndex !== undefined) {
        setSelectedDubberIndex(params.selectedDubberIndex);
      }
      if (params.selectedEpisodeIndex !== undefined) {
        setSelectedEpisodeIndex(params.selectedEpisodeIndex);
      }
      if (params.changeReason) {
        setSeekBehavior(params.changeReason === 'episode' ? 'reset' : 'back10');
      }
    }
  }, [route.params]);

  useEffect(() => {
    if (!full || !progressEntry) return;
    if (didApplyStoredSelectionRef.current) return;
    const params = route.params as {
      selectedPlayerIndex?: number;
      selectedDubberIndex?: number;
      selectedEpisodeIndex?: number;
    } | undefined;
    const hasExplicitSelection =
      params?.selectedPlayerIndex !== undefined ||
      params?.selectedDubberIndex !== undefined ||
      params?.selectedEpisodeIndex !== undefined;
    if (hasExplicitSelection) return;

    const targetDubberId = progressEntry.dubberId;
    const targetEpisodeId = progressEntry.episodeId;
    for (let p = 0; p < full.players.length; p += 1) {
      const dubbers = full.players[p].dubbers;
      for (let d = 0; d < dubbers.length; d += 1) {
        if (dubbers[d].dubbing !== targetDubberId) continue;
        const episodes = dubbers[d].episodes;
        const episodeIndex = episodes.findIndex(
          episode => String(episode.video.number) === targetEpisodeId
        );
        if (episodeIndex === -1) continue;
        setSelectedPlayerIndex(p);
        setSelectedDubberIndex(d);
        setSelectedEpisodeIndex(episodeIndex);
        setSeekBehavior('reset');
        didApplyStoredSelectionRef.current = true;
        return;
      }
    }
  }, [full, progressEntry, route.params]);

  const openDubber = () => {
    // Открыть drawer для выбора озвучки
    navigateToPanel('dubber');
  };

  const openPlayer = () => {
    // Открыть drawer для выбора плеера
    navigateToPanel('player');
  };

  const openEpisode = () => {
    // Открыть drawer для выбора эпизода
    navigateToPanel('episode');
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    useAnimeStore
      .getState()
      .loadAnimeFull(id.toString())
      .then(data => {
        if (!cancelled) setFull(data);
      })
      .catch(e => console.error(e.message));

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  useEffect(() => {
    ImmersiveMode.setBarMode('FullSticky');
    return () => ImmersiveMode.setBarMode('Normal');
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      setScreenSize(screen);
    });
    return () => subscription?.remove();
  }, []);

  const initialTimeSeconds =
    progressEntry &&
    currentDubber &&
    currentVideo &&
    progressEntry.dubberId === currentDubber.dubbing &&
    progressEntry.episodeId === String(currentVideo.video.number)
      ? progressEntry.positionSeconds
      : 0;

  const handleProgressUpdate = (seconds: number) => {
    if (!animeId || !currentVideo || !currentDubber) return;
    setProgress({
      animeId,
      dubberId: currentDubber.dubbing,
      episodeId: String(currentVideo.video.number),
      positionSeconds: seconds,
      updatedAt: Date.now(),
    });
  };

  return (
    <View style={[styles.container, { height: screenSize.height }]}>
      <VideoPlayer 
        video={currentVideo} 
        openDubber={openDubber}
        openPlayer={openPlayer}
        openEpisode={openEpisode}
        seekBehavior={seekBehavior}
        initialTimeSeconds={initialTimeSeconds}
        onProgressUpdate={handleProgressUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
