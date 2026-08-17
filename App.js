// App.js
// Punto de entrada: login de Canvas, y luego un menú lateral (Drawer,
// abierto desde el ícono ☰ arriba a la izquierda) con Hoy, Tareas, Cursos,
// Horario, Calendario, Finanzas y Ajustes. El botón "Cerrar sesión" vive al
// final del propio menú, no en cada pantalla.
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
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { getCredentials, clearCredentials } from './canvasApi';
import { colors, spacing, palette } from './theme';
import ErrorBoundary from './ErrorBoundary';
import LoginScreen from './LoginScreen';
import TodayScreen from './TodayScreen';
import TasksScreen from './TasksScreen';
import CoursesScreen from './CoursesScreen';
import ScheduleScreen from './ScheduleScreen';
import CalendarScreen from './CalendarScreen';
import FinanceScreen from './FinanceScreen';
import SettingsScreen from './SettingsScreen';
import AppButton from './AppButton';
import YinYangMark from './YinYangMark';

const Drawer = createDrawerNavigator();

// Íconos vectoriales (Ionicons, incluido con Expo — @expo/vector-icons no
// pidió instalación aparte) en vez de emoji: el emoji de plataforma trae su
// propio color fijo y no se puede recolorear, así que sobre el menú oscuro
// nunca combinaba de verdad con el acento activo/inactivo de cada fila. El
// color de identidad por sección viene de `palette` (theme.js) — una sola
// fuente de verdad si la paleta se vuelve a tocar.
const SCREEN_ICONS = {
  Hoy: 'partly-sunny-outline',
  Tareas: 'checkbox-outline',
  Cursos: 'book-outline',
  Horario: 'school-outline',
  Calendario: 'calendar-outline',
  Finanzas: 'wallet-outline',
  Ajustes: 'settings-outline',
};
const SCREEN_COLORS = {
  Hoy: palette[3], // teal
  Tareas: colors.accent,
  Cursos: palette[5], // violeta
  Horario: palette[6], // magenta
  Calendario: palette[1], // naranja quemado
  Finanzas: colors.success,
  Ajustes: palette[0], // rojo carmesí
};

function CustomDrawerContent({ onLogout, ...props }) {
  // La vez pasada esto se subió en vez de bajar: DrawerContentScrollView YA
  // suma su propio paddingBottom (12 + insets.bottom) automáticamente, y acá
  // se sumaba insets.bottom OTRA VEZ encima — el inset quedaba contado dos
  // veces, empujando el botón más arriba, no más abajo. Ahora se toma
  // control completo: se pisa el paddingBottom automático del componente
  // (contentContainerStyle) y se define uno solo, a mano, en `drawerFooter`.
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <YinYangMark size={28} />
        <Text style={styles.drawerTitle}>Ying-Yang</Text>
      </View>
      <DrawerItemList {...props} />
      <View style={[styles.drawerFooter, { paddingBottom: insets.bottom }]}>
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
      <ErrorBoundary>
        <GestureHandlerRootView style={styles.flex}>
          <SafeAreaProvider>
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  }

  if (!hasCredentials) {
    return (
      <ErrorBoundary>
        <GestureHandlerRootView style={styles.flex}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <LoginScreen onSaved={() => setHasCredentials(true)} />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
                <Ionicons name={SCREEN_ICONS[route.name]} size={20} color={focused ? colors.background : colors.textSecondary} />
              ),
            })}
          >
            <Drawer.Screen name="Hoy" component={TodayScreen} />
            <Drawer.Screen name="Tareas" component={TasksScreen} />
            <Drawer.Screen name="Cursos" component={CoursesScreen} />
            <Drawer.Screen name="Horario" component={ScheduleScreen} />
            <Drawer.Screen name="Calendario" component={CalendarScreen} />
            <Drawer.Screen name="Finanzas" component={FinanceScreen} />
            <Drawer.Screen name="Ajustes" component={SettingsScreen} />
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
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
  //
  // paddingBottom SÍ se pisa a propósito (a 0): el paddingBottom automático
  // del componente (12 + insets.bottom) es justo lo que hacía que "Cerrar
  // sesión" quedara más arriba de lo que el usuario quería. Ese espacio
  // ahora lo controla solo `drawerFooter` (ver CustomDrawerContent).
  drawerContent: { flex: 1, paddingBottom: 0 },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
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
