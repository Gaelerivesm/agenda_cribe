import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PantallaLogin from './PantallaLogin';
import PantallaInicio from './PantallaInicio';

export default function App() {
  const [sesionIniciada, setSesionIniciada] = useState(false);

  return (
    <SafeAreaView style={styles.contenedor}>
      {sesionIniciada ? (
        <PantallaInicio />
      ) : (
        <PantallaLogin onLoginExitoso={() => setSesionIniciada(true)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});