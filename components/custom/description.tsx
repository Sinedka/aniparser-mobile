import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DescriptionBlock = (props : {children: string}) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Text
        style={styles.text}
        numberOfLines={expanded ? undefined : 4}
      >
        {props.children}
      </Text>

      {!expanded && <View style={styles.fade} />}

      <Pressable onPress={toggle} style={styles.more}>
        <Text style={styles.moreText}>Подробнее</Text>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 16,
    position: 'relative',
  },

  text: {
    color: '#BDBDBD',
    fontSize: 16,
    lineHeight: 22,
  },

  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 52,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },

  more: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },

  moreText: {
    color: '#E5E5E5',
    fontSize: 16,
    marginRight: 6,
  },

  arrow: {
    color: '#E5E5E5',
    fontSize: 14,
  },

  fab: {
    position: 'absolute',
    right: 16,
    top: '50%',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fabIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
});
