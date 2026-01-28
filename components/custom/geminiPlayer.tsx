import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Video as VideoType } from '../../services/api/source/Yumme_anime_ru';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  TouchableOpacity,
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
import { toGammaSpace } from 'react-native-reanimated/lib/typescript/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

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
};
const VideoPlayer = ({
  openDubber,
  openPlayer,
  openEpisode,
  video,
  seekBehavior,
}: VideoPlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Состояние плеера
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({
    currentTime: 0,
    seekableDuration: 0,
  });
  const [step, setStep] = useState<number>(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [url, setUrl] = useState('');
  const lastProgressRef = useRef(0);
  const pendingSeekRef = useRef<'reset' | 'back10' | null>(null);

  useEffect(() => {
    if (!video) return;
    console.log(video);
    setIsBuffering(true);
    video.getSources().then(v => setUrl(v[0].url));
  }, [video]);

  useEffect(() => {
    if (!video) return;
    pendingSeekRef.current = seekBehavior;
  }, [video, seekBehavior]);

  useEffect(() => {
    console.log(url);
  }, [url]);

  // Отслеживаем состояние drawer
  useEffect(() => {
    const checkDrawerState = () => {
      const drawerState = navigation.getParent()?.getState();
      if (drawerState) {
        const currentRoute = drawerState.routes[drawerState.index];
        const isOpen = currentRoute?.name === 'Panel';
        setIsDrawerOpen(isOpen || false);
      }
    };

    checkDrawerState();
    
    // Слушаем изменения состояния навигации
    const unsubscribe = navigation.addListener('state', checkDrawerState);
    
    return unsubscribe;
  }, [navigation]);

  // Анимация прозрачности контролов
  const opacity = useSharedValue(1);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Сброс таймера скрытия контролов
  const showControls = () => {
    opacity.value = withTiming(1, { duration: 200 });
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);

    if (!paused) {
      controlsTimeout.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 });
      }, 3000); // Скрыть через 3 сек
    }
  };

  useEffect(() => {
    showControls();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [paused]);

  // Логика перемотки (Double Tap)
  const handleDoubleTap = () => {
    const seekTime = (step + (step > 0 ? -1 : 1)) * 10;
    if (seekTime === 0) {
      setStep(0);
      return;
    }
    let newTime = progress.currentTime + seekTime;

    // Ограничиваем время
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;

    videoRef.current?.seek(newTime);
    showControls(); // Показать контролы при взаимодействии
    setStep(0);
  };

  // Жесты
  const singleTap = Gesture.Tap().onEnd(() => {
    // Переключаем видимость контролов или ставим паузу
    if (opacity.value === 0) {
      scheduleOnRN(showControls);
    } else {
      // Если контролы видны, тап по пустому месту может их скрыть
      opacity.value = withTiming(0);
    }
  });

  const StepFor = () => {
    setStep(step + 1);
  };

  const StepBac = () => {
    setStep(step - 1);
  };

  const doubleTapLeft = Gesture.Tap()
    .numberOfTaps(-1)
    .onTouchesUp(() => {
      if (step === 0) {
        if (opacity.value === 0) {
          scheduleOnRN(showControls);
        } else {
          opacity.value = withTiming(0);
        }
      } else {
        if (opacity.value !== 0) {
          opacity.value = withTiming(0);
        }
      }
      scheduleOnRN(StepBac);
    })
    .onFinalize(() => {
      scheduleOnRN(handleDoubleTap);
    });

  const doubleTapRight = Gesture.Tap()
    .numberOfTaps(-1)
    .onTouchesUp(() => {
      if (step === 0) {
        if (opacity.value === 0) {
          scheduleOnRN(showControls);
        } else {
          opacity.value = withTiming(0);
        }
      } else {
        if (opacity.value !== 0) {
          opacity.value = withTiming(0);
        }
      }
      scheduleOnRN(StepFor);
    })
    .onFinalize(() => {
      scheduleOnRN(handleDoubleTap);
    });

  // Стили для анимации контролов
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // --- РЕНДЕР ВИЗУАЛИЗАЦИИ ПЕРЕМОТКИ ---
  const renderSeekOverlay = () => {
    if (step === 0 || step === 1 || step === -1) return null;

    const isRewind = step < 0;
    const seconds = Math.abs(step) * 10 - 10;

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
            onLoad={data => {
              setDuration(data.duration);
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
              if (!isSeeking) setProgress(data);
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
          pointerEvents="box-none"
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
                }}
              />

              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <View
              style={styles.panelButtonsRow}
            >
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
});

export default VideoPlayer;
