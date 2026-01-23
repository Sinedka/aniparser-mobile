import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import { StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width / 3;

export default function VideoPlayerScreen() {
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const [menu, setMenu] = useState<null | 'player' | 'dubber' | 'episode'>(
    null,
  );

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  useEffect(() => {
    ImmersiveMode.setBarMode('FullSticky');
  }, []);

  const openMenu = (type: 'player' | 'dubber' | 'episode') => {
    setMenu(type);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setMenu(null));
  };

  const videoWidth = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width, width - MENU_WIDTH],
  });

  const menuTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MENU_WIDTH, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Video
        source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        controls
      />
    </View>
  );
}

function ControlButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.controlBtn} onPress={onPress}>
      <Text style={styles.controlText}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenuContent({ type, onClose }: { type: string; onClose: () => void }) {
  return (
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{type.toUpperCase()}</Text>
      {[1, 2, 3, 4].map(i => (
        <Text key={i} style={styles.menuItem}>
          {type} option {i}
        </Text>
      ))}

      <TouchableOpacity onPress={onClose}>
        <Text style={styles.closeBtn}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'black',
  },
  videoWrapper: {
    height: '100%',
    backgroundColor: 'black',
  },
  controlsOverlay: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: 12,
  },
  controlBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  controlText: {
    color: 'white',
    fontSize: 14,
  },
  menu: {
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#111',
  },
  menuContent: {
    flex: 1,
    padding: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  menuItem: {
    color: '#ccc',
    paddingVertical: 8,
  },
  closeBtn: {
    marginTop: 20,
    color: '#4da3ff',
  },
});
