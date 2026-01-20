import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

import { useColorScheme } from '../hooks/use-color-scheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabLayout from './tabs/_layout';


export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="tabs" component={TabLayout} />
          </Stack.Navigator>
        </NavigationContainer>{' '}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
