import React, { useContext, useState } from 'react';
import { View, Text, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NavegacionPrincipal from './Navegacion';
import PantallaLogin from './PantallaLogin';
import { CitasProvider, CitasContext } from './CitasContext';
import { PacientesProvider, PacientesContext } from './PacientesContext';

function Raiz() {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
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
        <NavegacionPrincipal onCerrarSesion={() => setEstaAutenticado(false)} />
      ) : (
        <PantallaLogin onLoginExitoso={() => setEstaAutenticado(true)} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <CitasProvider>
        <PacientesProvider>
          <Raiz />
        </PacientesProvider>
      </CitasProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  pantallaCarga: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdfbf7' },
  textoCarga: { marginTop: 14, fontSize: 15, color: '#6b7280' },
});