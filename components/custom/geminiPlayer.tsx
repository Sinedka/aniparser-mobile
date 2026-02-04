import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Video as VideoType } from '../../services/api/source/Yumme_anime_ru';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  TouchableWithoutFeedback,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import Slider from '@react-native-community/slider';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePlayerSettingsStore } from '../../stores/playerSettingsStore';

// Хелпер для форматирования времени (MM:SS)
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

type VideoPlayerProps = {
  openDubber: () => void;
  openPlayer: () => void;
  openEpisode: () => void;
  video: VideoType | undefined;
  seekBehavior: 'reset' | 'back10';
  initialTimeSeconds?: number;
  onProgressUpdate?: (seconds: number) => void;
};
const VideoPlayer = ({
  openDubber,
  openPlayer,
  openEpisode,
  video,
  seekBehavior,
  initialTimeSeconds = 0,
  onProgressUpdate,
}: VideoPlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Состояние плеера
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({
    currentTime: 0,
    seekableDuration: 0,
  });
  const [seekOffsetSeconds, setSeekOffsetSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [url, setUrl] = useState('');
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string | null>(
    null
  );
  const playbackRate = usePlayerSettingsStore(state => state.playbackRate);
  const setPlaybackRate = usePlayerSettingsStore(state => state.setPlaybackRate);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPage, setSettingsPage] = useState<
    'main' | 'speed' | 'quality'
  >('main');
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
    onProgressUpdate
  );

  const SEEK_STEP_SECONDS = 10;
  const SEEK_DEBOUNCE_MS = 300;

  const settingsProgress = useSharedValue(0);
  const settingsSheetHeight = Math.max(0, screenHeight * 0.7);
  const settingsOffset = insets.bottom + 16;

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
    return sources.find(source => source.url === selectedQualityUrl) || sources[0];
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
    pendingSeekRef.current = seekBehavior;
  }, [video, seekBehavior]);

  useEffect(() => {
    progressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  useEffect(() => {
    if (!video) return;
    if (!initialTimeSeconds || initialTimeSeconds <= 0) return;
    pendingSeekTimeRef.current = initialTimeSeconds;
  }, [video, initialTimeSeconds]);

  useEffect(() => {
    console.log(url);
  }, [url]);

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
      }
    );

    return () => backHandler.remove();
  }, [isSettingsOpen, settingsPage]);

  // Анимация прозрачности контролов
  const opacity = useSharedValue(1);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Сброс таймера скрытия контролов
  const showControls = () => {
    opacity.value = withTiming(1, { duration: 200 });
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);

    if (!paused && !isSettingsOpen) {
      controlsTimeout.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 });
      }, 3000); // Скрыть через 3 сек
    }
  };

  useEffect(() => {
    showControls();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      if (tapResetTimeoutRef.current) clearTimeout(tapResetTimeoutRef.current);
    };
  }, [paused]);

  useEffect(() => {
    const update = progressUpdateRef.current;
    if (paused && update && lastProgressRef.current > 0) {
      lastProgressSaveAtRef.current = Date.now();
      lastProgressSavedRef.current = lastProgressRef.current;
      update(lastProgressRef.current);
    }
  }, [paused]);

  useEffect(() => {
    return () => {
      const update = progressUpdateRef.current;
      if (update && lastProgressRef.current > 0) {
        update(lastProgressRef.current);
      }
    };
  }, []);

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

  // Логика перемотки (Tap) с накоплением
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
    update(currentTime);
  };

  function saveProgressNow(currentTime: number) {
    const update = progressUpdateRef.current;
    if (!update) return;
    lastProgressSaveAtRef.current = Date.now();
    lastProgressSavedRef.current = currentTime;
    update(currentTime);
  }

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

  const doubleTapLeft = Gesture.Tap()
    .onEnd(() => {
      scheduleOnRN(handleTapLeft);
    });

  const doubleTapRight = Gesture.Tap()
    .onEnd(() => {
      scheduleOnRN(handleTapRight);
    });

  // Жесты
  const singleTap = Gesture.Tap()
    .onEnd(() => {
      // Переключаем видимость контролов или ставим паузу
      if (opacity.value === 0) {
        scheduleOnRN(showControls);
      } else {
        // Если контролы видны, тап по пустому месту может их скрыть
        opacity.value = withTiming(0);
      }
    });

  // Стили для анимации контролов
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: seekOffsetSeconds !== 0 ? 0 : opacity.value,
  }));

  const animatedSettingsOverlayStyle = useAnimatedStyle(() => ({
    opacity: settingsProgress.value,
  }));

  const animatedSettingsSheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - settingsProgress.value) * (settingsSheetHeight + settingsOffset),
      },
    ],
  }));

  // --- РЕНДЕР ВИЗУАЛИЗАЦИИ ПЕРЕМОТКИ ---
  const renderSeekOverlay = () => {
    if (seekOffsetSeconds === 0) return null;

    const isRewind = seekOffsetSeconds < 0;
    const seconds = Math.abs(seekOffsetSeconds);

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.seekOverlay,
            isRewind ? styles.seekOverlayLeft : styles.seekOverlayRight,
          ]}
        >
          <View style={styles.seekContent}>
            {/* Иконки стрелок */}
            <Text style={styles.seekIcon}>{isRewind ? '«««' : '»»»'}</Text>
            <Text style={styles.seekText}>{seconds} секунд</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

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
              } else if (pendingSeek === 'back10') {
                const targetTime = Math.max(lastProgressRef.current - 10, 0);
                videoRef.current?.seek(targetTime);
                setProgress(prev => ({
                  ...prev,
                  currentTime: targetTime,
                }));
              }

              pendingSeekRef.current = null;
            }}
            onProgress={data => {
              lastProgressRef.current = data.currentTime;
              if (!isSeeking) {
                setProgress(data);
                maybeSaveProgress(data.currentTime);
              }
            }}
            onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
            onEnd={() => setPaused(true)}
          />
        )}

        {/* Слой визуализации перемотки (под контролами, над видео) */}
        {renderSeekOverlay()}

        {/* Слой жестов (невидим) */}
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

        {/* Оверлей с контролами (UI) */}
        <Animated.View
          style={[styles.controlsOverlay, animatedControlsStyle]}
          pointerEvents={seekOffsetSeconds !== 0 ? 'none' : 'box-none'}
        >
          {isBuffering && (
            <View style={styles.centerControl}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          {!isBuffering && (
            <View style={styles.centerControl}>
              <TouchableWithoutFeedback
                onPress={() => {
                  setPaused(!paused);
                  showControls();
                }}
              >
                <View
                  style={[styles.playButton, { paddingLeft: paused ? 5 : 0 }]}
                >
                  {paused ? (
                    <Ionicons name="play-outline" size={40} color="#ffffff" />
                  ) : (
                    <Ionicons name="pause-outline" size={40} color="#ffffff" />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>
                {formatTime(progress.currentTime)}
              </Text>

              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={progress.currentTime}
                minimumTrackTintColor="#f00"
                maximumTrackTintColor="#fff"
                thumbTintColor="#f00"
                onSlidingStart={() => {
                  setIsSeeking(true);
                  if (controlsTimeout.current)
                    clearTimeout(controlsTimeout.current);
                }}
                onSlidingComplete={val => {
                  videoRef.current?.seek(val);
                  setIsSeeking(false);
                  showControls();
                  saveProgressNow(val);
                }}
              />

              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <View
              style={styles.panelButtonsRow}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setIsSettingsOpen(true);
                  setSettingsPage('main');
                  showControls();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={openPlayer}
                activeOpacity={0.7}
              >
                <Ionicons name="hardware-chip-outline" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.button}
                onPress={openDubber}
                activeOpacity={0.7}
              >
                <Ionicons name="mic-outline" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.button}
                onPress={openEpisode}
                activeOpacity={0.7}
              >
                <Ionicons name="list-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.settingsOverlay, animatedSettingsOverlayStyle]}
          pointerEvents={isSettingsOpen ? 'auto' : 'none'}
        >
          <TouchableWithoutFeedback
            onPress={() => setIsSettingsOpen(false)}
          >
            <View style={styles.settingsBackdrop} />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.settingsSheet,
              {
                height: settingsSheetHeight,
                marginBottom: settingsOffset,
              },
              animatedSettingsSheetStyle,
            ]}
          >
            <View style={styles.settingsHeader}>
              {settingsPage !== 'main' && (
                <TouchableOpacity
                  style={styles.settingsBackButton}
                  onPress={() => setSettingsPage('main')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <Text style={styles.settingsTitle}>
                {settingsPage === 'main' && 'Настройки'}
                {settingsPage === 'speed' && 'Скорость'}
                {settingsPage === 'quality' && 'Качество'}
              </Text>
            </View>

            {settingsPage === 'main' && (
              <ScrollView
                contentContainerStyle={styles.settingsList}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => setSettingsPage('speed')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.settingsItemText}>Скорость</Text>
                  <Text style={styles.settingsValueText}>{playbackRate}x</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => setSettingsPage('quality')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.settingsItemText}>Качество</Text>
                  <Text style={styles.settingsValueText}>
                    {selectedSource?.title || 'Авто'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {settingsPage === 'speed' && (
              <ScrollView
                contentContainerStyle={styles.settingsList}
                showsVerticalScrollIndicator={false}
              >
                {[0.25, 0.5, 1, 1.5, 2].map(rate => (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.settingsItem,
                      playbackRate === rate && styles.settingsItemActive,
                    ]}
                    onPress={() => {
                      setPlaybackRate(rate);
                      setSettingsPage('main');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.settingsItemText}>{rate}x</Text>
                    {playbackRate === rate && (
                      <Ionicons name="checkmark" size={18} color="#1ed760" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {settingsPage === 'quality' && (
              <ScrollView
                contentContainerStyle={styles.settingsList}
                showsVerticalScrollIndicator={false}
              >
                {orderedSources.length === 0 && (
                  <Text style={styles.settingsEmptyText}>
                    Нет доступных качеств
                  </Text>
                )}
                {orderedSources.map(source => (
                  <TouchableOpacity
                    key={`${source.title}-${source.url}`}
                    style={[
                      styles.settingsItem,
                      selectedSource?.url === source.url &&
                        styles.settingsItemActive,
                    ]}
                    onPress={() => {
                      setSelectedQualityUrl(source.url);
                      pendingSeekTimeRef.current = progress.currentTime;
                      setUrl(source.url);
                      setSettingsPage('main');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.settingsItemText}>
                      {source.title}
                    </Text>
                    {selectedSource?.url === source.url && (
                      <Ionicons name="checkmark" size={18} color="#1ed760" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gestureRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  gestureZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gestureZoneCenter: {
    flex: 0.5,
    backgroundColor: 'transparent',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  centerControl: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 50,
  },
  bottomBar: {
    marginTop: 'auto',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
  },

  // --- СТИЛИ ДЛЯ АНИМАЦИИ ПЕРЕМОТКИ ---
  seekOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%', // Половина экрана
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  seekOverlayLeft: {
    left: 0,
    borderTopRightRadius: 200, // Создает эффект полукруга
    borderBottomRightRadius: 200,
  },
  seekOverlayRight: {
    right: 0,
    borderTopLeftRadius: 200, // Создает эффект полукруга
    borderBottomLeftRadius: 200,
  },
  seekContent: {
    alignItems: 'center',
  },
  seekText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  seekIcon: {
    color: 'white',
    fontWeight: '900',
    fontSize: 20,
  },
  panelButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    marginHorizontal: 50,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  settingsSheet: {
    width: '50%',
    backgroundColor: '#141414',
    borderRadius: 18,
    padding: 16,
    zIndex: 25,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsList: {
    gap: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  settingsItemActive: {
    backgroundColor: 'rgba(30, 215, 96, 0.16)',
  },
  settingsItemText: {
    color: '#fff',
    fontSize: 16,
  },
  settingsValueText: {
    color: '#c7c7c7',
    fontSize: 14,
  },
  settingsEmptyText: {
    color: '#9e9e9e',
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default VideoPlayer;
