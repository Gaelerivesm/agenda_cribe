import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PantallaPerfil() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Mi Perfil</Text>
      <Text>Aquí irán los datos del médico.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
});