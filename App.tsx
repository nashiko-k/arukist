import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CalendarScreen from './src/screens/CalendarScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';
import { BUILD_TAG } from './src/utils/buildInfo';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ position: 'absolute', top: 50, right: 8, zIndex: 9999, backgroundColor: 'rgba(255,200,100,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
        <Text style={{ fontSize: 11, color: '#000', fontWeight: 'bold' }}>{BUILD_TAG}</Text>
      </View>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textLight,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.borderSoft,
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Calendar') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'ホーム' }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ title: 'カレンダー' }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '設定' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
