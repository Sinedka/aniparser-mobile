import { Search } from '../../services/api/source/Yumme_anime_ru';
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { AutoSizeText, ResizeTextMode } from 'react-native-auto-size-text';
import { ThemedPressable } from '../themd-pressable';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import StarRating from './StarRating';
import { useAnimeStore } from '../../stores/animeStore';
import { useNavigation } from '@react-navigation/native';


type AnimePlateProps = {
  anime: Search;
};

export default function AnimePlate({ anime }: AnimePlateProps) {
  const navigation = useNavigation();

  function move() {
    useAnimeStore.getState().setAnimeMin(anime);
    navigation.navigate('anime', { id: anime.searchResult.anime_id });
  }

  return (
    <ThemedPressable onPress={() => move()} style={styles.animePlate}>
      <Image
        source={{ uri: 'https:' + anime.searchResult.poster.fullsize }}
        style={styles.image}
      />
      <ThemedView style={styles.infoContainer}>
        <ThemedView style={{ borderRadius: 8, marginLeft: 4 }}>
          {anime.searchResult.title.length < 50 ? (
            <AutoSizeText
              fontSize={22}
              numberOfLines={2}
              mode={ResizeTextMode.max_lines}
              style={styles.title}
            >
              {anime.searchResult.title}
            </AutoSizeText>
          ) : (
            <AutoSizeText
              style={styles.title}
              numberOfLines={2}
              minFontSize={14}
              fontSize={14}
              mode={ResizeTextMode.min_font_size}
            >
              {anime.searchResult.title}
            </AutoSizeText>
          )}
        </ThemedView>
        <ThemedView style={{ flex: 1, alignItems: 'flex-start' }}>
          <ThemedView
            style={{ borderRadius: 10, backgroundColor: '#1ED760', margin: 6 }}
          >
            <ThemedText
              style={{ color: '#000', fontSize: 16, marginHorizontal: 5 }}
            >
              {anime.searchResult.anime_status.title}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedView
          style={{
            height: 40,
            borderColor: '#999',
            borderTopWidth: 1,
            backgroundColor: 'transparent',
          }}
        >
          <ThemedView
            style={{
              alignSelf: 'flex-end',
              marginRight: 6,
              height: 38,
              backgroundColor: 'white',
            }}
          >
            <StarRating
              rating={anime.searchResult.rating.average}
              users={anime.searchResult.views}
            />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedPressable>
  );
}

const styles = StyleSheet.create({
  animePlate: {
    flexDirection: 'row',
    margin: 12,
    borderRadius: 8,
    borderColor: '#999',
    borderWidth: 1,
    height: 150,
  },
  title: {
    color: '#fff',
  },
  infoContainer: {
    borderRadius: 8,
    flex: 1,
    backgroundColor: 'transparent',
  },
  image: {
    width: undefined, // ширина
    height: '100%',
    aspectRatio: 5 / 7,
    borderRadius: 8,
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
