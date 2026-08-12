// App.js
// Punto de entrada: login de Canvas, y luego pestañas de Tareas + Cursos +
// Calendario.

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getCredentials } from './canvasApi';
import { colors } from './theme';
import LoginScreen from './LoginScreen';
import TasksScreen from './TasksScreen';
import CoursesScreen from './CoursesScreen';
import CalendarScreen from './CalendarScreen';

const Tab = createBottomTabNavigator();

// Íconos simples por texto — sin agregar una librería de íconos nueva. Cada
// pestaña tiene su propio color de acento, para que la tab bar no sea
// monocromática.
const TAB_ICONS = { Tareas: '📝', Cursos: '📚', Calendario: '📅' };
const TAB_COLORS = { Tareas: colors.accent, Cursos: '#AF52DE', Calendario: '#FF9500' };

function TabIcon({ route, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route]}</Text>;
}

export default function App() {
  const [checking, setChecking] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    (async () => {
      const { token, baseUrl } = await getCredentials();
      setHasCredentials(Boolean(token && baseUrl));
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!hasCredentials) {
    return (
      <>
        <StatusBar style="auto" />
        <LoginScreen onSaved={() => setHasCredentials(true)} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: TAB_COLORS[route.name],
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: { backgroundColor: '#f9f9f9' },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarIcon: ({ focused }) => <TabIcon route={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Tareas">
          {() => <TasksScreen onLogout={() => setHasCredentials(false)} />}
        </Tab.Screen>
        <Tab.Screen name="Cursos" component={CoursesScreen} />
        <Tab.Screen name="Calendario" component={CalendarScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
