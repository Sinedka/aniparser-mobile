import {
  createStaticNavigation,
  DarkTheme,
  DefaultTheme,
  StaticParamList,
  ThemeProvider,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useColorScheme } from '../hooks/use-color-scheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabLayout from './tabs/_layout';
import AnimePage from './anime';
import VidePlayerScreen from './player';
import PlayerSidePanel from './playerSidePanel';

const PlayerDrawer = createDrawerNavigator({
  screens: {
    Player: VidePlayerScreen,
  },
  drawerContent: (props) => <PlayerSidePanel {...props} />,
  screenOptions: {
    headerShown: false,
    drawerPosition: 'right',
    drawerType: 'front',
    swipeEnabled: false,
  },
});

const RootStack = createNativeStackNavigator({
  initialRouteName: 'tabs',
  screenOptions: {
    headerShown: false,
  },
  screens: {
    tabs: {
      screen: TabLayout,
    },
    anime: {
      screen: AnimePage,
    },
    player: {
      screen: PlayerDrawer,
    }
  },
});

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

//
// <NavigationContainer
//   theme={{
//     ...DefaultTheme,
//     colors: {
//       ...DefaultTheme.colors,
//       background: 'black',
//     },
//   }}
// >
//   <Stack.Navigator>
//     <Stack.Screen
//       name="tabs"
//       component={TabLayout}
//       options={{ headerShown: false }}
//     />
//   </Stack.Navigator>
// </NavigationContainer>{' '}
//

const Navigation = createStaticNavigation(RootStack);

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Navigation theme={MyTheme} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
