import React from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, { type AnimatedStyleProp } from 'react-native-reanimated';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { ProgressState } from './types';
import styles from './styles';
import { formatTime } from './utils';

type PlayerControlsProps = {
  animatedControlsStyle: AnimatedStyleProp<ViewStyle>;
  isBuffering: boolean;
  paused: boolean;
  progress: ProgressState;
  duration: number;
  insets: EdgeInsets;
  seekOffsetSeconds: number;
  onTogglePause: () => void;
  onOpenSettings: () => void;
  onNavigateToPanel: (view: 'player' | 'dubber' | 'episode') => void;
  onSeekStart: () => void;
  onSeekComplete: (value: number) => void;
};

const PlayerControls = ({
  animatedControlsStyle,
  isBuffering,
  paused,
  progress,
  duration,
  insets,
  seekOffsetSeconds,
  onTogglePause,
  onOpenSettings,
  onNavigateToPanel,
  onSeekStart,
  onSeekComplete,
}: PlayerControlsProps) => {
  return (
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
          <TouchableWithoutFeedback onPress={onTogglePause}>
            <View style={[styles.playButton, { paddingLeft: paused ? 5 : 0 }]}
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

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}
      >
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
            onSlidingStart={onSeekStart}
            onSlidingComplete={onSeekComplete}
          />

          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.panelButtonsRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => onNavigateToPanel('player')}
            activeOpacity={0.7}
          >
            <Ionicons name="hardware-chip-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => onNavigateToPanel('dubber')}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => onNavigateToPanel('episode')}
            activeOpacity={0.7}
          >
            <Ionicons name="list-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default PlayerControls;
