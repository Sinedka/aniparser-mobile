import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './home';
import ExploreScreen from './explore';
import collections from './collections';
import { DefaultTheme } from '@react-navigation/native';

const Tab = createBottomTabNavigator();



export default function TabLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000',
        },
      }}
    >
      <Tab.Screen
        name="index"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="explore"
        component={ExploreScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="explore1"
        component={collections}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
