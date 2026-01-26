import { StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { ThemedView } from '../themed-view';
import { ThemedPressable } from '../themd-pressable';
import { useEffect, useRef, useState } from 'react';
import {
  Gesture,
  GestureDetector,
  Pressable,
} from 'react-native-gesture-handler';
import { ThemedText } from '../themed-text';
import { scheduleOnRN } from 'react-native-worklets';

export default function YoutubeLikePlayer() {
  const [paused, setPaused] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const tapCount = useRef(0);

  const onEndJs = () => {
    setStep(0);
  };

  const onTouchJs = () => {
    setStep(step + 1);
  };

  const tapGesture = Gesture.Tap()
    .maxDuration(300)
    .numberOfTaps(-1)
    .onTouchesUp(() => scheduleOnRN(onTouchJs))
    .onTouchesDown(() => console.log('down'))
    .onFinalize(() => scheduleOnRN(onEndJs));

  useEffect(() => {
    setStep(tapCount.current);
  }, [tapCount]);

  return (
    <>
      <GestureDetector gesture={tapGesture}>
        <ThemedView style={styles.controls}></ThemedView>
      </GestureDetector>

      <ThemedView style={[styles.container]}>
        <Video
          source={{ uri: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' }}
          style={[styles.video]}
          resizeMode="contain"
          paused={paused}
        />
        <ThemedView style={styles.controls}>
          <Pressable
            style={styles.playButton}
            onPress={() => setPaused(!paused)}
          ></Pressable>
          <ThemedText>{step}</ThemedText>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  playButton: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: '#000',
  },
});
