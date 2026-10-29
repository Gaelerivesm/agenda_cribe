import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PantallaPacientes() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Mis Pacientes</Text>
      <Text>Aquí irá la lista completa de pacientes.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#ffffff' 
  },
  titulo: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1e1b4b',
    marginBottom: 10 
  },
});