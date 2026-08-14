// App.js
// Punto de entrada: login de Canvas, y luego un menú lateral (Drawer,
// abierto desde el ícono ☰ arriba a la izquierda) con Tareas, Cursos,
// Horario, Calendario y Finanzas. El botón "Cerrar sesión" vive al final
// del propio menú, no en cada pantalla.
//
// react-native-gesture-handler debe importarse primero que cualquier otra
// cosa (requisito de la librería, no orden arbitrario) y toda la app debe
// quedar envuelta en GestureHandlerRootView para que el gesto de deslizar
// para abrir el menú funcione.
//
// SafeAreaProvider (react-native-safe-area-context) también es obligatorio:
// sin él, el header y el contenido del menú no saben cuánto ocupa el notch/
// isla dinámica y terminan pintando pegados arriba del todo.
import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { getCredentials, clearCredentials } from './canvasApi';
import { colors, spacing } from './theme';
import LoginScreen from './LoginScreen';
import TasksScreen from './TasksScreen';
import CoursesScreen from './CoursesScreen';
import ScheduleScreen from './ScheduleScreen';
import CalendarScreen from './CalendarScreen';
import FinanceScreen from './FinanceScreen';
import AppButton from './AppButton';

const Drawer = createDrawerNavigator();

// Íconos simples por texto (sin librería de íconos) y un color de identidad
// por sección — cada una conserva el acento que ya tenía como pestaña.
const SCREEN_ICONS = { Tareas: '📝', Cursos: '📚', Horario: '🎓', Calendario: '📅', Finanzas: '💰' };
const SCREEN_COLORS = {
  Tareas: colors.accent,
  Cursos: '#C77DFF',
  Horario: '#FF2DA0',
  Calendario: '#FF9F1C',
  Finanzas: colors.success,
};

function CustomDrawerContent({ onLogout, ...props }) {
  // El paddingBottom automático de DrawerContentScrollView (12 + inset del
  // indicador de inicio) no siempre alcanza a empujar "Cerrar sesión" hasta
  // abajo del todo dentro del ScrollView — se suma el inset a mano acá,
  // igual que se resolvió arriba con el título.
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <Text style={styles.drawerTitle}>Canvas Dashboard</Text>
      <DrawerItemList {...props} />
      <View style={[styles.drawerFooter, { paddingBottom: spacing.lg + insets.bottom }]}>
        <AppButton title="Cerrar sesión" onPress={onLogout} variant="plain" />
      </View>
    </DrawerContentScrollView>
  );
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

  async function handleLogout() {
    await clearCredentials();
    setHasCredentials(false);
  }

  if (checking) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!hasCredentials) {
    return (
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <LoginScreen onSaved={() => setHasCredentials(true)} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} onLogout={handleLogout} />}
            screenOptions={({ route }) => ({
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              drawerStyle: { backgroundColor: colors.surface, width: 260 },
              drawerActiveBackgroundColor: SCREEN_COLORS[route.name],
              drawerActiveTintColor: colors.background,
              drawerInactiveTintColor: colors.textSecondary,
              drawerLabelStyle: { fontSize: 14, fontWeight: '600' },
              drawerIcon: ({ focused }) => (
                <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>{SCREEN_ICONS[route.name]}</Text>
              ),
            })}
          >
            <Drawer.Screen name="Tareas" component={TasksScreen} />
            <Drawer.Screen name="Cursos" component={CoursesScreen} />
            <Drawer.Screen name="Horario" component={ScheduleScreen} />
            <Drawer.Screen name="Calendario" component={CalendarScreen} />
            <Drawer.Screen name="Finanzas" component={FinanceScreen} />
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // Sin paddingTop a propósito: DrawerContentScrollView ya suma su propio
  // paddingTop (12 + inset del notch/isla dinámica) internamente. Si esta
  // hoja de estilos define paddingTop, lo pisa por completo (el estilo del
  // componente y el nuestro se mezclan en un array y la clave repetida se
  // queda con el último valor) y el título del menú termina pegado arriba,
  // debajo del reloj — justo el bug reportado.
  drawerContent: { flex: 1 },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    letterSpacing: -0.3,
  },
  drawerFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
