import { StyleSheet, ScrollView } from 'react-native';
import {
  YummyAnimeExtractor,
  Search,
} from '../../services/api/source/Yumme_anime_ru';
import { ThemedView } from '../../components/themed-view';
import SearchInput from '../../components/themed-text-input';
import { useState, useEffect } from 'react';
import AnimePlate from '../../components/custom/AnimePlate';

export default function ExploreScreen() {
  const [searchRes, setSearchRes] = useState<Search[]>([]);
  const [text, SetText] = useState('');

  useEffect(() => {
    const fetchSearch = async () => {
      try {
        const extractor = new YummyAnimeExtractor();
        const result = await extractor.Search(text);
        setSearchRes(result);
      } catch (err) {
        // setError("Ошибка при загрузке данных");
        console.error(err);
      } finally {
        // setLoading(false);
      }
    };
    if (text !== '') fetchSearch();
  }, [text]);

  return (
    <ThemedView>
      <ThemedView style={styles.container}>
        <SearchInput onSubmitEditing={t => SetText(t)} />
      </ThemedView>
      <ScrollView>
        {searchRes.map((obj) => (
          <>{AnimePlate(obj)}</>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#000000',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
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
    fontSize: 20,
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
    height: 150, // высота
    marginBottom: 10,
    aspectRatio: 5 / 7,
    // resizeMode: 'contain', // масштабирование изображения
  },
});
