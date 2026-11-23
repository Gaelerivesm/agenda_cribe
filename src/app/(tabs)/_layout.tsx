import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../AuthContext';
import { obtenerPaleta } from '../../../tema';

const ICONOS = {
  index: 'home',
  calendario: 'calendar',
  pacientes: 'people',
  notificaciones: 'notifications',
  perfil: 'person',
} as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta);
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: paleta.primaria,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
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
  );
}
