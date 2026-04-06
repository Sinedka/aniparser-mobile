import React, { useEffect, useRef, useState } from 'react';
import Orientation from 'react-native-orientation-locker';
import ImmersiveMode from 'react-native-immersive-mode';
import { Dimensions, StyleSheet, View } from 'react-native';
import VideoPlayer from '../components/custom/player';
import { useAnimeStore } from '../stores/animeStore';
import { useWatchProgressStore } from '../stores/watchProgressStore';
import { Anime } from '../services/api/source/Yumme_anime_ru';
import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { usePlayerPanelStore } from '../stores/playerPanelStore';
import { Video } from '../services/api/source/Yumme_anime_ru.ts';

export default function VideoPlayerScreen({
  route,
}: StaticScreenProps<{
  id: Number;
}>) {
  const { id } = route.params;
  const navigation = useNavigation();
  const [full, setFull] = useState<Anime | null>(null);
  const [screenSize, setScreenSize] = useState(Dimensions.get('screen'));
  const didApplyStoredSelectionRef = useRef<string | null>(null);
  const drawerStatus = useDrawerStatus();

  const didInitSelectionRef = useRef(false);

  const animeId = id?.toString();
  const progressEntry = useWatchProgressStore(state =>
    animeId ? state.progressMap[animeId] : undefined,
  );
  const setProgress = useWatchProgressStore(state => state.setProgress);
  // Текущее выбранное видео
  const [currentVideo, setCurrentVideo] = useState<Video | undefined>(undefined);
  const activeProgressKeyRef = useRef<string>('');

  // Функции для VideoPlayer
  const setPanelView = usePlayerPanelStore(state => state.setPanelView);

  const navigateToPanel = (view: 'player' | 'dubber' | 'episode') => {
    setPanelView(view);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  useEffect(() => {
    if (!full || !progressEntry) return;
    const progressKey = `${progressEntry.dubberId}:${progressEntry.episodeId}`;
    if (didApplyStoredSelectionRef.current === progressKey) return;

    for (let p = 0; p < full.players.length; p += 1) {
      const dubbers = full.players[p].dubbers;
      for (let d = 0; d < dubbers.length; d += 1) {
        if (dubbers[d].dubbing !== progressEntry.dubberId) continue;
        const episodes = dubbers[d].episodes;
        const episodeIndex = episodes.findIndex(
          episode => String(episode.video.number) === progressEntry.episodeId,
        );
        if (episodeIndex === -1) continue;
        setSelectedPlayerIndex(p);
        setSelectedDubberIndex(d);
        setSelectedEpisodeIndex(episodeIndex);
        didApplyStoredSelectionRef.current = progressKey;
        return;
      }
    }
  }, [full, progressEntry]);

  //загрузка аниме
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

  // ориентация
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

  //isDrawerOpen
  // useEffect(() => {
  //   if (drawerStatus === 'open') {
  //     setForceSaveSignal(prev => prev + 1);
  //   }
  // }, [drawerStatus]);

  const initialTimeSeconds =
    progressEntry &&
    currentDubber &&
    currentVideo &&
    progressEntry.dubberId === currentDubber.dubbing &&
    progressEntry.episodeId === String(currentVideo.video.number)
      ? progressEntry.positionSeconds
      : 0;

  const handleProgressUpdate = (seconds: number) => {
    if (!animeId || !currentVideo) return;
    setProgress({
      animeId,
      playerId: currentDubber.player,
      dubberId: currentDubber.dubbing,
      episodeId: String(currentVideo.video.number),
      positionSeconds: seconds,
      updatedAt: Date.now(),
    });
    console.log('handleProgressUpdate', seconds);
  };


  return (
    <View style={[styles.container, { height: screenSize.height }]}>
      <VideoPlayer
        navigateToPanel={navigateToPanel}
        video={currentVideo}
        initialTimeSeconds={initialTimeSeconds}
        currentTimeSeconds={progressEntry ? progressEntry.positionSeconds : 0}
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
