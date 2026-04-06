import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import styles from './styles';

type SeekOverlayProps = {
  seekOffsetSeconds: number;
};

const SeekOverlay = ({ seekOffsetSeconds }: SeekOverlayProps) => {
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
          <Text style={styles.seekIcon}>{isRewind ? '«««' : '»»»'}</Text>
          <Text style={styles.seekText}>{seconds} секунд</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default SeekOverlay;
