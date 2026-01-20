import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './home';
import ExploreScreen from './explore';
import collections from './collections';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="index" component={HomeScreen} />
      <Tab.Screen name="explore" component={ExploreScreen} />
      <Tab.Screen name="explore1" component={collections} />
    </Tab.Navigator>
  );
}
