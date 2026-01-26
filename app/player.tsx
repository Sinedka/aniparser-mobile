import React, { useEffect, useState } from 'react';
import Orientation from 'react-native-orientation-locker';
import ImmersiveMode from 'react-native-immersive-mode';
import YoutubeLikePlayer from '../components/custom/player';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemedView } from '../components/themed-view';
import { Dimensions, ScaledSize, StyleSheet, View } from 'react-native';
import YouTubePlayer from '../components/custom/geminiPlayer';

export default function VideoPlayerScreen() {
  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  useEffect(() => {
    ImmersiveMode.setBarMode('FullSticky');
    return () => ImmersiveMode.setBarMode('Normal');
  }, []);

  const [screenSize, setScreenSize] = useState(Dimensions.get('screen'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      setScreenSize(screen);
    });
    return () => subscription?.remove();
  }, []);

  return (
      <View
        style={[
          styles.container,
          { width: screenSize.width, height: screenSize.height },
        ]}
      >
        <YouTubePlayer/>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
