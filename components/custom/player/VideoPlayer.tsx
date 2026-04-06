import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerSettingsStore } from '../../stores/playerSettingsStore';
import PlayerControls from './PlayerControls';
import SeekOverlay from './SeekOverlay';
import SettingsSheet from './SettingsSheet';
import styles from './styles';
import type { ProgressState, SettingsPage, SourceItem, VideoPlayerProps } from './types';

const VideoPlayer = ({
  navigateToPanel,
  video,
  initialTimeSeconds,
  onProgressUpdate,
}: VideoPlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    currentTime: 0,
    seekableDuration: 0,
  });
  const [seekOffsetSeconds, setSeekOffsetSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [url, setUrl] = useState('');
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string | null>(
    null,
  );
  const playbackRate = usePlayerSettingsStore(state => state.playbackRate);
  const setPlaybackRate = usePlayerSettingsStore(
    state => state.setPlaybackRate,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPage, setSettingsPage] = useState<SettingsPage>('main');
  const lastProgressRef = useRef(0);
  const pendingSeekRef = useRef<'reset' | 'back10' | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const seekAccumulatorRef = useRef(0);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const lastTapDirRef = useRef<'left' | 'right' | null>(null);
  const lastProgressSaveAtRef = useRef(0);
  const lastProgressSavedRef = useRef(0);
  const progressUpdateRef = useRef<((seconds: number) => void) | undefined>(
    onProgressUpdate,
  );
  const currentTimeRef = useRef(0);

  const opacity = useSharedValue(1);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SEEK_STEP_SECONDS = 10;
  const SEEK_DEBOUNCE_MS = 300;

  const settingsProgress = useSharedValue(0);
  const settingsSheetHeight = Math.max(0, screenHeight * 0.7);
  const settingsOffset = insets.bottom + 16;

  const showControls = useCallback(() => {
    opacity.value = withTiming(1, { duration: 200 });
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);

    if (!paused && !isSettingsOpen) {
      controlsTimeout.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 });
      }, 3000);
    }
  }, [opacity, paused, isSettingsOpen]);

  const orderedSources = useMemo(() => {
    return [...sources].sort((a, b) => {
      const aNum = Number(a.title);
      const bNum = Number(b.title);
      if (Number.isNaN(aNum) || Number.isNaN(bNum)) return 0;
      return bNum - aNum;
    });
  }, [sources]);

  const selectedSource = useMemo(() => {
    if (!selectedQualityUrl) return sources[0];
    return (
      sources.find(source => source.url === selectedQualityUrl) || sources[0]
    );
  }, [sources, selectedQualityUrl]);

  useEffect(() => {
    if (!video) return;
    console.log(video);
    setIsBuffering(true);
    video.getSources().then(v => {
      setSources(v);
      const lastSource = v[v.length - 1];
      if (lastSource) {
        setSelectedQualityUrl(lastSource.url);
        setUrl(lastSource.url);
      }
    });
  }, [video]);

  useEffect(() => {
    if (!video) return;
    lastProgressRef.current = 0;
    lastProgressSavedRef.current = 0;
    lastProgressSaveAtRef.current = 0;
    setProgress({
      currentTime: 0,
      seekableDuration: 0,
    });
    setDuration(0);
  }, [video]);

  useEffect(() => {
    progressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  useEffect(() => {
    if (!video) return;
    if (!initialTimeSeconds || initialTimeSeconds <= 0) return;
    pendingSeekTimeRef.current = initialTimeSeconds;
  }, [video, initialTimeSeconds]);

  useEffect(() => {
    settingsProgress.value = withTiming(isSettingsOpen ? 1 : 0, {
      duration: 240,
    });
    if (isSettingsOpen) {
      opacity.value = withTiming(1, { duration: 200 });
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    }
  }, [isSettingsOpen, opacity, settingsProgress]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!isSettingsOpen) return false;
        if (settingsPage !== 'main') {
          setSettingsPage('main');
          return true;
        }
        setIsSettingsOpen(false);
        return true;
      },
    );

    return () => backHandler.remove();
  }, [isSettingsOpen, settingsPage]);

  useEffect(() => {
    showControls();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      if (tapResetTimeoutRef.current) clearTimeout(tapResetTimeoutRef.current);
    };
  }, [showControls]);

  useEffect(() => {
    const update = progressUpdateRef.current;
    if (paused && update && lastProgressRef.current > 0) {
      lastProgressSaveAtRef.current = Date.now();
      lastProgressSavedRef.current = lastProgressRef.current;
      update(lastProgressRef.current);
    }
  }, [paused]);

  const resetTapSequence = () => {
    tapCountRef.current = 0;
    lastTapDirRef.current = null;
    if (tapResetTimeoutRef.current) {
      clearTimeout(tapResetTimeoutRef.current);
      tapResetTimeoutRef.current = null;
    }
  };

  const cancelPendingSeek = () => {
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }
    seekAccumulatorRef.current = 0;
    setSeekOffsetSeconds(0);
  };

  const commitSeek = () => {
    const offset = seekAccumulatorRef.current;
    if (!offset) return;

    let newTime = progress.currentTime + offset;
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;

    videoRef.current?.seek(newTime);
    setProgress(prev => ({
      ...prev,
      currentTime: newTime,
    }));
    currentTimeRef.current = newTime;
    saveProgressNow(newTime);
    seekAccumulatorRef.current = 0;
    setSeekOffsetSeconds(0);
    resetTapSequence();
    showControls();
  };

  const enqueueSeek = (deltaSeconds: number) => {
    seekAccumulatorRef.current += deltaSeconds;
    setSeekOffsetSeconds(seekAccumulatorRef.current);

    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      commitSeek();
    }, SEEK_DEBOUNCE_MS);
  };

  const maybeSaveProgress = (currentTime: number) => {
    const update = progressUpdateRef.current;
    if (isBuffering) return;
    if (!update) return;
    const now = Date.now();
    if (
      now - lastProgressSaveAtRef.current < 10000 &&
      Math.abs(currentTime - lastProgressSavedRef.current) < 1
    ) {
      return;
    }
    lastProgressSaveAtRef.current = now;
    lastProgressSavedRef.current = currentTime;
    console.log('maybeSaveProgress');
    update(currentTime);
  };

  const saveProgressNow = (currentTime: number, options?: { force?: boolean }) => {
    const update = progressUpdateRef.current;
    if (!options?.force) return;
    if (!update) return;
    lastProgressSaveAtRef.current = Date.now();
    lastProgressSavedRef.current = currentTime;
    console.log('saveProgressNow');
    update(currentTime);
  };

  const handleTapLeft = () => {
    if (lastTapDirRef.current && lastTapDirRef.current !== 'left') {
      cancelPendingSeek();
      resetTapSequence();
    }
    lastTapDirRef.current = 'left';
    tapCountRef.current += 1;
    if (tapResetTimeoutRef.current) {
      clearTimeout(tapResetTimeoutRef.current);
      tapResetTimeoutRef.current = null;
    }

    if (seekOffsetSeconds === 0) {
      if (opacity.value === 0) {
        showControls();
      } else {
        opacity.value = withTiming(0);
      }
    } else {
      if (opacity.value !== 0) {
        opacity.value = withTiming(0);
      }
    }
    if (tapCountRef.current >= 2) {
      enqueueSeek(-SEEK_STEP_SECONDS);
    } else {
      tapResetTimeoutRef.current = setTimeout(() => {
        resetTapSequence();
      }, SEEK_DEBOUNCE_MS);
    }
  };

  const handleTapRight = () => {
    if (lastTapDirRef.current && lastTapDirRef.current !== 'right') {
      cancelPendingSeek();
      resetTapSequence();
    }
    lastTapDirRef.current = 'right';
    tapCountRef.current += 1;
    if (tapResetTimeoutRef.current) {
      clearTimeout(tapResetTimeoutRef.current);
      tapResetTimeoutRef.current = null;
    }

    if (seekOffsetSeconds === 0) {
      if (opacity.value === 0) {
        showControls();
      } else {
        opacity.value = withTiming(0);
      }
    } else {
      if (opacity.value !== 0) {
        opacity.value = withTiming(0);
      }
    }
    if (tapCountRef.current >= 2) {
      enqueueSeek(SEEK_STEP_SECONDS);
    } else {
      tapResetTimeoutRef.current = setTimeout(() => {
        resetTapSequence();
      }, SEEK_DEBOUNCE_MS);
    }
  };

  const doubleTapLeft = Gesture.Tap().onEnd(() => {
    scheduleOnRN(handleTapLeft);
  });

  const doubleTapRight = Gesture.Tap().onEnd(() => {
    scheduleOnRN(handleTapRight);
  });

  const singleTap = Gesture.Tap().onEnd(() => {
    if (opacity.value === 0) {
      scheduleOnRN(showControls);
    } else {
      opacity.value = withTiming(0);
    }
  });

  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: seekOffsetSeconds !== 0 ? 0 : opacity.value,
  }));

  const animatedSettingsOverlayStyle = useAnimatedStyle(() => ({
    opacity: settingsProgress.value,
  }));

  const animatedSettingsSheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          (1 - settingsProgress.value) *
          (settingsSheetHeight + settingsOffset),
      },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.videoContainer}>
        {url && (
          <Video
            ref={videoRef}
            source={{
              uri: url,
            }}
            style={styles.video}
            resizeMode="contain"
            paused={paused}
            rate={playbackRate}
            onLoad={data => {
              setDuration(data.duration);
              if (pendingSeekTimeRef.current !== null) {
                videoRef.current?.seek(pendingSeekTimeRef.current);
                setProgress(prev => ({
                  ...prev,
                  currentTime: pendingSeekTimeRef.current || 0,
                }));
                currentTimeRef.current = pendingSeekTimeRef.current || 0;
                pendingSeekTimeRef.current = null;
                pendingSeekRef.current = null;
                return;
              }
              const pendingSeek = pendingSeekRef.current;

              if (pendingSeek === 'reset') {
                videoRef.current?.seek(0);
                setProgress(prev => ({
                  ...prev,
                  currentTime: 0,
                }));
                currentTimeRef.current = 0;
              } else if (pendingSeek === 'back10') {
                const targetTime = Math.max(lastProgressRef.current - 10, 0);
                videoRef.current?.seek(targetTime);
                setProgress(prev => ({
                  ...prev,
                  currentTime: targetTime,
                }));
                currentTimeRef.current = targetTime;
              }

              pendingSeekRef.current = null;
            }}
            onProgress={data => {
              lastProgressRef.current = data.currentTime;
              if (!isSeeking) {
                currentTimeRef.current = data.currentTime;
                setProgress(data);
                maybeSaveProgress(data.currentTime);
              }
            }}
            onBuffer={({ isBuffering: isB }) => setIsBuffering(isB)}
            onEnd={() => setPaused(true)}
          />
        )}

        <SeekOverlay seekOffsetSeconds={seekOffsetSeconds} />

        <View style={StyleSheet.absoluteFill}>
          <View style={styles.gestureRow}>
            <GestureDetector gesture={doubleTapLeft}>
              <View style={styles.gestureZone} />
            </GestureDetector>

            <GestureDetector gesture={singleTap}>
              <View style={styles.gestureZoneCenter} />
            </GestureDetector>

            <GestureDetector gesture={doubleTapRight}>
              <View style={styles.gestureZone} />
            </GestureDetector>
          </View>
        </View>

        <PlayerControls
          animatedControlsStyle={animatedControlsStyle}
          isBuffering={isBuffering}
          paused={paused}
          progress={progress}
          duration={duration}
          insets={insets}
          seekOffsetSeconds={seekOffsetSeconds}
          onTogglePause={() => {
            setPaused(!paused);
            showControls();
          }}
          onOpenSettings={() => {
            setIsSettingsOpen(true);
            setSettingsPage('main');
            showControls();
          }}
          onNavigateToPanel={navigateToPanel}
          onSeekStart={() => {
            setIsSeeking(true);
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
          }}
          onSeekComplete={val => {
            videoRef.current?.seek(val);
            setIsSeeking(false);
            showControls();
            currentTimeRef.current = val;
            saveProgressNow(val);
          }}
        />

        <SettingsSheet
          animatedOverlayStyle={animatedSettingsOverlayStyle}
          animatedSheetStyle={animatedSettingsSheetStyle}
          isOpen={isSettingsOpen}
          settingsPage={settingsPage}
          onClose={() => setIsSettingsOpen(false)}
          onChangePage={setSettingsPage}
          playbackRate={playbackRate}
          onSetPlaybackRate={setPlaybackRate}
          orderedSources={orderedSources}
          selectedSource={selectedSource}
          onSelectQuality={sourceUrl => {
            setSelectedQualityUrl(sourceUrl);
            pendingSeekTimeRef.current = progress.currentTime;
            setUrl(sourceUrl);
          }}
          sheetHeight={settingsSheetHeight}
          sheetOffset={settingsOffset}
        />
      </View>
    </GestureHandlerRootView>
  );
};

export default VideoPlayer;
