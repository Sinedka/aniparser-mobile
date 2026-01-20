import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import Video, {
  OnLoadData,
  OnProgressData,
} from 'react-native-video';
import Slider from '@react-native-community/slider';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { ComponentRef } from 'react';

const AUTO_HIDE = 3000;
const SEEK_TIME = 10;

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const YoutubePlayer: React.FC = () => {
  const videoRef = useRef<ComponentRef<typeof Video>>(null);
  const hideTimeout = useRef<number | null>(null);

  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  const opacity = useSharedValue(1);

  const showControls = (): void => {
    setControlsVisible(true);
    opacity.value = withTiming(1);

    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }

    hideTimeout.current = setTimeout(() => {
      opacity.value = withTiming(0);
      setControlsVisible(false);
    }, AUTO_HIDE);
  };

  const togglePlay = (): void => {
    setPaused(p => !p);
    showControls();
  };

  const seekBy = (seconds: number): void => {
    const target = Math.max(0, currentTime + seconds);
    videoRef.current?.seek(target);
    showControls();
  };

  const onLoad = (data: OnLoadData): void => {
    setDuration(data.duration);
  };

  const onProgress = (data: OnProgressData): void => {
    setCurrentTime(data.currentTime);
  };

  const tapGesture = Gesture.Tap().onStart(() => {
    runOnJS(showControls)();
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    return () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
    };
  }, []);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={{ uri: 'https://cloud.kodik-storage.com/useruploads/2b55a19c-6da8-4835-91cc-cf61223d5342/82d9a092f9de97f923b366b388168c0c:2025102921/360.mp4:hls:manifest.m3u8' }}
          style={styles.video}
          resizeMode="contain"
          paused={paused}
          onLoad={onLoad}
          onProgress={onProgress}
        />

        {controlsVisible && (
          <Animated.View style={[styles.overlay, animatedStyle]}>
            {/* CENTER CONTROLS */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={() => seekBy(-SEEK_TIME)}>
                <Text style={styles.controlBtn}>⏪</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlay}>
                <Text style={styles.playBtn}>
                  {paused ? '▶️' : '⏸'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => seekBy(SEEK_TIME)}>
                <Text style={styles.controlBtn}>⏩</Text>
              </TouchableOpacity>
            </View>

            {/* BOTTOM BAR */}
            <View style={styles.bottomBar}>
              <Text style={styles.time}>
                {formatTime(currentTime)}
              </Text>

              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={duration}
                value={currentTime}
                onSlidingComplete={(v: number) =>
                  videoRef.current?.seek(v)
                }
              />

              <Text style={styles.time}>
                {formatTime(duration)}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
};

export default YoutubePlayer;


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: 240,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  playBtn: {
    fontSize: 40,
    color: '#fff',
  },
  controlBtn: {
    fontSize: 26,
    color: '#fff',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  time: {
    color: '#fff',
    fontSize: 12,
    width: 45,
    textAlign: 'center',
  },
});

