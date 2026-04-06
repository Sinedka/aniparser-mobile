import {
  Ongoing,
  YummyAnimeExtractor,
} from '../../services/api/source/Yumme_anime_ru';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { ReactNode, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { StreakPressable } from '../../components/custom/player/SeekCompnent';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
    <GestureHandlerRootView>
      <ScrollView>
        <StreakPressable
          streakIntervalMs={280}
          holdDelayMs={400}
          onFirstPressIn={() => console.log('1) first press-in')}
          onHoldWithoutStreak={() => console.log('2) hold (no streak yet)')}
          onStreakPress={count => console.log('3) streak press count:', count)}
          onHoldEnd={() => console.log('5) hold end ')}
          onStreakBroken={lastCount =>
            console.log('4) streak broken, last:', lastCount)
          }
          style={{ padding: 16, backgroundColor: 'tomato', borderRadius: 12, height: 200 }}
        >
          {/* можно child'ы */}
        </StreakPressable>
        <ThemedView style={styles.stepContainer}>
          {ongoings.map((obj, i) => (
            <>{OngoingPlate(obj)}</>
          ))}
        </ThemedView>
      </ScrollView>
    </GestureHandlerRootView>
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
