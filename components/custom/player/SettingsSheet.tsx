import React from 'react';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { type AnimatedStyleProp } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import type { SettingsPage, SourceItem } from './types';
import styles from './styles';

type SettingsSheetProps = {
  animatedOverlayStyle: AnimatedStyleProp<ViewStyle>;
  animatedSheetStyle: AnimatedStyleProp<ViewStyle>;
  isOpen: boolean;
  settingsPage: SettingsPage;
  onClose: () => void;
  onChangePage: (page: SettingsPage) => void;
  playbackRate: number;
  onSetPlaybackRate: (rate: number) => void;
  orderedSources: SourceItem[];
  selectedSource: SourceItem | undefined;
  onSelectQuality: (url: string) => void;
  sheetHeight: number;
  sheetOffset: number;
};

const SettingsSheet = ({
  animatedOverlayStyle,
  animatedSheetStyle,
  isOpen,
  settingsPage,
  onClose,
  onChangePage,
  playbackRate,
  onSetPlaybackRate,
  orderedSources,
  selectedSource,
  onSelectQuality,
  sheetHeight,
  sheetOffset,
}: SettingsSheetProps) => {
  return (
    <Animated.View
      style={[styles.settingsOverlay, animatedOverlayStyle]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <TouchableOpacity style={styles.settingsBackdrop} onPress={onClose}
      />
      <Animated.View
        style={[
          styles.settingsSheet,
          {
            height: sheetHeight,
            marginBottom: sheetOffset,
          },
          animatedSheetStyle,
        ]}
      >
        <View style={styles.settingsHeader}>
          {settingsPage !== 'main' && (
            <TouchableOpacity
              style={styles.settingsBackButton}
              onPress={() => onChangePage('main')}
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
              onPress={() => onChangePage('speed')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsItemText}>Скорость</Text>
              <Text style={styles.settingsValueText}>{playbackRate}x</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => onChangePage('quality')}
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
                  onSetPlaybackRate(rate);
                  onChangePage('main');
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
                  selectedSource?.url === source.url && styles.settingsItemActive,
                ]}
                onPress={() => {
                  onSelectQuality(source.url);
                  onChangePage('main');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsItemText}>{source.title}</Text>
                {selectedSource?.url === source.url && (
                  <Ionicons name="checkmark" size={18} color="#1ed760" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </Animated.View>
  );
};

export default SettingsSheet;
