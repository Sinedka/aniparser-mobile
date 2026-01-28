import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AutoText } from '../components/auto-text';
import { DescriptionBlock } from '../components/custom/description';
import StarRating from '../components/custom/StarRating';
import { ThemedPressable } from '../components/themd-pressable';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Anime } from '../services/api/source/Yumme_anime_ru';
import { useAnimeStore } from '../stores/animeStore';

export default function AnimePage({ route }: StaticScreenProps<{ id: Number }>) {
  const { id } = route.params;
  const animeMin = useAnimeStore(s => (id ? s.animeMinMap[id.toString()] : undefined));

  const [full, setFull] = useState<Anime | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();


  function move() {
    if (!animeMin) return;
    // Убеждаемся, что animeMin сохранен в store перед переходом
    useAnimeStore.getState().setAnimeMin(animeMin);
    // Для drawer navigator параметры передаются для начального экрана Player
    navigation.navigate('player', {
      screen: 'Player',
      params: { id },
    } as any);
  }

  useEffect(() => {
    console.log(animeMin);
    if (!id || !animeMin) return;

    let cancelled = false;

    useAnimeStore
      .getState()
      .loadAnimeFull(id.toString())
      .then(data => {
        if (!cancelled) setFull(data);
      })
      .catch(e => console.log(e.message));

    return () => {
      cancelled = true;
    };
  }, [id, animeMin]);

  if (!animeMin) {
    return <ThemedText>Anime not found</ThemedText>;
  }

  function season(n: number) {
    switch (n) {
      case 1:
        return 'зима';
      case 2:
        return 'весна';
      case 3:
        return 'лето';
      case 4:
        return 'осень';
      default:
        return 'unknown';
    }
  }
  function date(n: number) {
    const date = new Date(n * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearShort = String(date.getFullYear() % 100).padStart(2, '0');

    return `${day}.${month}.${yearShort}`;
  }

  return (
    <SafeAreaView
      style={{
        width: '100%',
        alignItems: 'center',
        flex: 1,
        backgroundColor: '#000',
      }}
    >
      <ScrollView style={{ width: '100%' }}>
        <ThemedView style={{ alignItems: 'center' }}>
          <AutoText
            text={animeMin.searchResult.title}
            minFontSize={20}
            maxFontSize={40}
            maxHeight={100}
            style={styles.title}
          ></AutoText>
        </ThemedView>

        <ThemedView style={styles.container}>
          <Image
            source={{ uri: 'https:' + animeMin.searchResult.poster.fullsize }}
            style={styles.image}
          />
          <ThemedView style={{ flex: 1, flexDirection: 'column' }}>
            <ThemedView>
              <ThemedText
                style={{
                  alignSelf: 'flex-end',
                  fontSize: 30,
                  marginTop: 12,
                  marginRight: 12,
                  paddingBottom: 8,
                }}
              >
                {animeMin.searchResult.type.name}
              </ThemedText>
            </ThemedView>
            <ThemedView>
              <ThemedText
                style={{
                  alignSelf: 'flex-end',
                  fontSize: 20,
                  marginRight: 12,
                  paddingBottom: 4,
                }}
              >
                {animeMin.searchResult.year +
                  ' ' +
                  season(animeMin.searchResult.season)}
              </ThemedText>
            </ThemedView>
            <ThemedView>
              <ThemedText
                style={{
                  alignSelf: 'flex-end',
                  fontSize: 20,
                  marginRight: 12,
                  paddingBottom: 4,
                }}
              >
                {animeMin.searchResult.anime_status.title}
              </ThemedText>
            </ThemedView>
            <ThemedView style={{ alignItems: 'flex-end', paddingRight: 12, height: 40 }}>
              <StarRating
                rating={animeMin.searchResult.rating.average}
                users={animeMin.searchResult.views}
              />
            </ThemedView>
            {full && (
              <>
                <ThemedView>
                  <ThemedText
                    style={{
                      alignSelf: 'flex-end',
                      fontSize: 20,
                      marginRight: 12,
                      paddingBottom: 4,
                    }}
                  >
                    {'Эпизодов: '}
                    {full.animeResult.episodes.aired}
                    {full.animeResult.episodes.aired !==
                      full.animeResult.episodes.count &&
                      '/' + full.animeResult.episodes.count}
                  </ThemedText>
                </ThemedView>
                {full.animeResult.episodes.aired !==
                  full.animeResult.episodes.count && (
                  <ThemedView>
                    <ThemedText
                      style={{
                        alignSelf: 'flex-end',
                        fontSize: 18,
                        marginRight: 12,
                        paddingBottom: 4,
                      }}
                    >
                      Cледущий эпизод:{' '}
                      {date(full.animeResult.episodes.next_date)}
                    </ThemedText>
                  </ThemedView>
                )}
              </>
            )}
          </ThemedView>
        </ThemedView>
        {error && <ThemedText>{error}</ThemedText>}

        <ThemedView>
          <ThemedPressable style={styles.playButton} onPress={() => move()}>
            <ThemedText
              style={{
                padding: 8,
                color: 'black',
                fontSize: 30,
                fontWeight: 'bold',
              }}
            >
              начать просмотр
            </ThemedText>
          </ThemedPressable>
        </ThemedView>

        {full && (
          <DescriptionBlock>{full.animeResult.description}</DescriptionBlock>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    width: '100%',
    height: 250,
  },
  playButton: {
    flex: 1,
    height: 50,
    margin: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1ED760',
  },
  backButton: {
    marginRight: 10,
  },
  mainText: {
    color: '#fff',
    fontSize: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  titleContainer: {
    // flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  rawContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  image: {
    width: undefined, // ширина
    height: '100%',
    aspectRatio: 5 / 7,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#999',
    // resizeMode: 'contain', // масштабирование изображения
  },
});
