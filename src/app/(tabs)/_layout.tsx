import React, { useMemo, useState } from 'react';
import { Animated, Dimensions, PanResponder, View } from 'react-native';
import { router, Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { obtenerPaleta } from '../../theme/tema';

const ICONOS = {
  index: 'home',
  calendario: 'calendar',
  pacientes: 'people',
  notificaciones: 'notifications',
  perfil: 'person',
} as const;

const RUTAS_TABS = ['/(tabs)', '/(tabs)/calendario', '/(tabs)/pacientes', '/(tabs)/notificaciones', '/(tabs)/perfil'] as const;
const NOMBRES_TABS = ['index', 'calendario', 'pacientes', 'notificaciones', 'perfil'] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const segmentos = useSegments();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const [desplazamiento] = useState(() => new Animated.Value(0));
  const anchoPantalla = Dimensions.get('window').width;
  const responderDeslizamiento = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesto) =>
      Math.abs(gesto.dx) > 35 && Math.abs(gesto.dx) > Math.abs(gesto.dy) * 1.5,
    onPanResponderMove: (_, gesto) => desplazamiento.setValue(gesto.dx * 0.45),
    onPanResponderRelease: (_, gesto) => {
      const rutaActual = segmentos[segmentos.length - 1] ?? 'index';
      const indiceActual = NOMBRES_TABS.indexOf(rutaActual as (typeof NOMBRES_TABS)[number]);
      if (indiceActual < 0 || Math.abs(gesto.dx) < 60) {
        Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 4 }).start();
        return;
      }
      const siguiente = indiceActual + (gesto.dx < 0 ? 1 : -1);
      if (siguiente < 0 || siguiente >= RUTAS_TABS.length) {
        Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 4 }).start();
        return;
      }
      const direccion = gesto.dx < 0 ? -1 : 1;
      Animated.timing(desplazamiento, { toValue: direccion * -anchoPantalla, duration: 140, useNativeDriver: true }).start(() => {
        router.navigate(RUTAS_TABS[siguiente]);
        desplazamiento.setValue(direccion * anchoPantalla);
        requestAnimationFrame(() => Animated.timing(desplazamiento, { toValue: 0, duration: 180, useNativeDriver: true }).start());
      });
    },
    onPanResponderTerminate: () => Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true }).start(),
  }), [segmentos, desplazamiento, anchoPantalla]);
  return (
    <View style={{ flex: 1 }} {...responderDeslizamiento.panHandlers}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: desplazamiento }] }}>
      <Tabs
        screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: paleta.primaria,
        tabBarInactiveTintColor: paleta.esOscuro ? '#71717A' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: paleta.tarjeta,
          borderTopColor: paleta.borde,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = ICONOS[route.name as keyof typeof ICONOS] ?? 'ellipse';
          return <Ionicons name={focused ? icon as keyof typeof Ionicons.glyphMap : `${icon}-outline` as keyof typeof Ionicons.glyphMap} size={size} color={String(color)} />;
        },
      })}
      >
        <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
        <Tabs.Screen name="calendario" options={{ title: 'Calendario' }} />
        <Tabs.Screen name="pacientes" options={{ title: 'Pacientes' }} />
        <Tabs.Screen name="notificaciones" options={{ title: 'Notificaciones' }} />
        <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
      </Tabs>
      </Animated.View>
    </View>
  );
}
