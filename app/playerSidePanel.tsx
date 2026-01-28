import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useAnimeStore } from '../stores/animeStore';
import { Anime } from '../services/api/source/Yumme_anime_ru';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { ThemedPressable } from '../components/themd-pressable';

type PanelView = 'player' | 'dubber' | 'episode';

export default function PlayerSidePanel({
  state,
  navigation,
}: DrawerContentComponentProps) {
  const playerRoute = state.routes.find(route => route.name === 'Player');
  const routeParams = (playerRoute?.params ?? {}) as {
    id?: Number;
    view?: PanelView;
    selectedPlayerIndex?: number;
    selectedDubberIndex?: number;
    selectedEpisodeIndex?: number;
    changeReason?: PanelView;
  };
  let { 
    id: paramId, 
    view = 'player',
    selectedPlayerIndex = 0,
    selectedDubberIndex = 0,
    selectedEpisodeIndex = 0,
  } = routeParams;
  
  // Если id не передан в параметрах, пытаемся получить из родительского route
  if (!paramId) {
    const parentState = navigation.getParent()?.getState();
    const playerRoute = parentState?.routes?.find(r => r.name === 'player');
    if (playerRoute?.params) {
      const playerParams = playerRoute.params as { id?: Number };
      paramId = playerParams.id;
    }
  }
  
  const id = paramId;
  const [full, setFull] = useState<Anime | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(selectedPlayerIndex);
  const [currentDubberIndex, setCurrentDubberIndex] = useState(selectedDubberIndex);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(selectedEpisodeIndex);

  const setPanelView = (nextView: PanelView) => {
    (navigation as any).navigate('Player', {
      id,
      view: nextView,
      selectedPlayerIndex: currentPlayerIndex,
      selectedDubberIndex: currentDubberIndex,
      selectedEpisodeIndex: currentEpisodeIndex,
    });
    navigation.dispatch(DrawerActions.openDrawer());
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    useAnimeStore
      .getState()
      .loadAnimeFull(id.toString())
      .then(data => {
        if (!cancelled) {
          setFull(data);
          // Обновляем индексы при загрузке данных
          setCurrentPlayerIndex(selectedPlayerIndex);
          setCurrentDubberIndex(selectedDubberIndex);
          setCurrentEpisodeIndex(selectedEpisodeIndex);
        }
      })
      .catch(e => console.error(e.message));

    return () => {
      cancelled = true;
    };
  }, [id, selectedPlayerIndex, selectedDubberIndex, selectedEpisodeIndex]);
  
  // Обновляем индексы при изменении параметров
  useEffect(() => {
    setCurrentPlayerIndex(selectedPlayerIndex);
    setCurrentDubberIndex(selectedDubberIndex);
    setCurrentEpisodeIndex(selectedEpisodeIndex);
  }, [selectedPlayerIndex, selectedDubberIndex, selectedEpisodeIndex]);

  // Функция для обновления выбора и уведомления Player экрана
  const updateSelection = (
    playerIndex?: number,
    dubberIndex?: number,
    episodeIndex?: number
  ) => {
    const newPlayerIndex = playerIndex !== undefined ? playerIndex : currentPlayerIndex;
    const newDubberIndex = dubberIndex !== undefined ? dubberIndex : currentDubberIndex;
    const newEpisodeIndex = episodeIndex !== undefined ? episodeIndex : currentEpisodeIndex;
    const nextView: PanelView =
      playerIndex !== undefined ? 'dubber'
      : dubberIndex !== undefined ? 'episode'
      : view;
    const changeReason: PanelView | undefined =
      playerIndex !== undefined ? 'player'
      : dubberIndex !== undefined ? 'dubber'
      : episodeIndex !== undefined ? 'episode'
      : undefined;
    
    setCurrentPlayerIndex(newPlayerIndex);
    setCurrentDubberIndex(newDubberIndex);
    setCurrentEpisodeIndex(newEpisodeIndex);
    
    // navigation уже является drawer навигацией; обновляем параметры Player route
    (navigation as any).navigate('Player', {
      id,
      view: nextView,
      selectedPlayerIndex: newPlayerIndex,
      selectedDubberIndex: newDubberIndex,
      selectedEpisodeIndex: newEpisodeIndex,
      changeReason,
    });
  };
  
  // Рендер списка плееров
  const renderPlayers = () => {
    if (!full || !full.players) return null;
    
    return (
      <ScrollView style={styles.list}>
        {full.players.map((player, index) => (
          <ThemedPressable
            key={index}
            style={[
              styles.item,
              currentPlayerIndex === index && styles.selectedItem
            ]}
            onPress={() => {
              updateSelection(index, 0, 0); // Сбрасываем dubber и episode при смене плеера
            }}
          >
            <ThemedText style={styles.itemText}>{player.name}</ThemedText>
          </ThemedPressable>
        ))}
      </ScrollView>
    );
  };
  
  // Рендер списка озвучек
  const renderDubbers = () => {
    if (!full || !full.players[currentPlayerIndex]) return null;
    const dubbers = full.players[currentPlayerIndex].dubbers;
    
    return (
      <ScrollView style={styles.list}>
        {dubbers.map((dubber, index) => (
          <ThemedPressable
            key={index}
            style={[
              styles.item,
              currentDubberIndex === index && styles.selectedItem
            ]}
            onPress={() => {
              updateSelection(undefined, index, 0); // Сбрасываем episode при смене озвучки
            }}
          >
            <ThemedText style={styles.itemText}>{dubber.dubbing}</ThemedText>
          </ThemedPressable>
        ))}
      </ScrollView>
    );
  };
  
  // Рендер списка эпизодов
  const renderEpisodes = () => {
    if (!full || !full.players[currentPlayerIndex]?.dubbers[currentDubberIndex]) return null;
    const episodes = full.players[currentPlayerIndex].dubbers[currentDubberIndex].episodes;
    
    return (
      <ScrollView style={styles.list}>
        {episodes.map((episode, index) => (
          <ThemedPressable
            key={index}
            style={[
              styles.item,
              currentEpisodeIndex === index && styles.selectedItem
            ]}
            onPress={() => {
              updateSelection(undefined, undefined, index);
            }}
          >
            <ThemedText style={styles.itemText}>
              Эпизод {episode.video.number}
            </ThemedText>
          </ThemedPressable>
        ))}
      </ScrollView>
    );
  };
  
  // Рендер контента в зависимости от view
  const renderContent = () => {
    switch (view) {
      case 'player':
        return renderPlayers();
      case 'dubber':
        return renderDubbers();
      case 'episode':
        return renderEpisodes();
      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.tabs}>
        <ThemedPressable
          style={[styles.tab, view === 'player' && styles.activeTab]}
          onPress={() => setPanelView('player')}
        >
          <ThemedText style={styles.tabText}>Плеер</ThemedText>
        </ThemedPressable>
        <ThemedPressable
          style={[styles.tab, view === 'dubber' && styles.activeTab]}
          onPress={() => setPanelView('dubber')}
        >
          <ThemedText style={styles.tabText}>Озвучка</ThemedText>
        </ThemedPressable>
        <ThemedPressable
          style={[styles.tab, view === 'episode' && styles.activeTab]}
          onPress={() => setPanelView('episode')}
        >
          <ThemedText style={styles.tabText}>Эпизод</ThemedText>
        </ThemedPressable>
      </ThemedView>
      <ThemedText type="title" style={styles.title}>
        {view === 'player' && 'Выберите плеер'}
        {view === 'dubber' && 'Выберите озвучку'}
        {view === 'episode' && 'Выберите эпизод'}
      </ThemedText>
      {renderContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  tabText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  item: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedItem: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  itemText: {
    fontSize: 16,
  },
});
