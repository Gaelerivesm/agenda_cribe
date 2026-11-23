import React, { useContext } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../../AuthContext';
import { CitasContext, CitasProvider } from '../../CitasContext';
import { PacientesContext, PacientesProvider } from '../../PacientesContext';

function Rutas() {
  const { estaAutenticado, cargandoAuth } = useAuth();
  const citas = useContext(CitasContext);
  const pacientes = useContext(PacientesContext);
  if (cargandoAuth || (estaAutenticado && (citas?.cargando || pacientes?.cargando))) {
    return (
      <View style={styles.carga}>
        <ActivityIndicator size="large" color="#B80065" />
        <Text style={styles.textoCarga}>Cargando tu agenda...</Text>
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!estaAutenticado}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={estaAutenticado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paciente/[pacienteId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="notas/[citaId]" options={{ presentation: 'card' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  carga: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdfbf7' },
  textoCarga: { marginTop: 14, fontSize: 15, color: '#6b7280' },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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
