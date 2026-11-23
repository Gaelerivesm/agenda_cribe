import React, { useContext } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CitasContext, CitasProvider } from '../context/CitasContext';
import { PacientesContext, PacientesProvider } from '../context/PacientesContext';
import { obtenerPaleta } from '../theme/tema';

function Rutas() {
  const { estaAutenticado, cargandoAuth, usuarioActual } = useAuth();
  const citas = useContext(CitasContext);
  const pacientes = useContext(PacientesContext);
  const tema = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);

  if (cargandoAuth || (estaAutenticado && (citas?.cargando || pacientes?.cargando))) {
    return (
      <View style={[styles.carga, { backgroundColor: tema.fondo }]}>
        <StatusBar style={tema.esOscuro ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={tema.primaria} />
        <Text style={[styles.textoCarga, { color: tema.textoSecundario }]}>Cargando tu agenda...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={tema.esOscuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.fondo } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paciente/[pacienteId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="notas/[citaId]" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  carga: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoCarga: { marginTop: 14, fontSize: 15 },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CitasProvider>
          <PacientesProvider>
            <Rutas />
          </PacientesProvider>
        </CitasProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
