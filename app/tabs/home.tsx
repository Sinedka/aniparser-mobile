import {
  Ongoing,
  YummyAnimeExtractor,
} from '../../services/api/source/Yumme_anime_ru';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { ReactNode, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import StarRating from '../../components/custom/StarRating';

export default function HomeScreen() {
  const [ongoings, setOngoings] = useState<Ongoing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOngoings = async () => {
      try {
        const extractor = new YummyAnimeExtractor();
        const result = await extractor.getOngoings();
        setOngoings(result);
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOngoings();
  }, []);

  if (loading) {
    return <ThemedText type="title">Welcome!!!!</ThemedText>;
  }

  if (error) {
    return <ThemedText type="title">SORRY</ThemedText>;
  }

  function OngoingPlate(ongoing: Ongoing): ReactNode {
    return (
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{ongoing.ongoingResult.title}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView>
      <ThemedView style={styles.stepContainer}>
        {ongoings.map((obj, i) => (
          <>{OngoingPlate(obj)}</>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
