import React, { useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NavegacionPrincipal from './Navegacion';
import PantallaLogin from './PantallaLogin';
import { CitasProvider, CitasContext } from './CitasContext';
import { PacientesProvider, PacientesContext } from './PacientesContext';
import { AuthProvider, useAuth } from './AuthContext';

function Raiz() {
  const { estaAutenticado, cerrarSesion } = useAuth();
  const citas = useContext(CitasContext);
  const pacientes = useContext(PacientesContext);
  const cargando = (citas?.cargando ?? true) || (pacientes?.cargando ?? true);

  if (cargando) {
    return (
      <View style={styles.pantallaCarga}>
        <ActivityIndicator size="large" color="#115e59" />
        <Text style={styles.textoCarga}>Cargando tu agenda...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {estaAutenticado ? (
        <NavegacionPrincipal onCerrarSesion={cerrarSesion} />
      ) : (
        <PantallaLogin />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <CitasProvider>
          <PacientesProvider>
            <Raiz />
          </PacientesProvider>
        </CitasProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  pantallaCarga: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdfbf7' },
  textoCarga: { marginTop: 14, fontSize: 15, color: '#6b7280' },
});