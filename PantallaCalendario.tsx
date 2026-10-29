import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PantallaCalendario() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Calendario</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold' },
});