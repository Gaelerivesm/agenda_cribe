import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PantallaNotificaciones() {
  return (
    <SafeAreaView style={styles.contenedor}>
      <Text style={styles.titulo}>Notificaciones</Text>

      <View style={styles.contenidoVacio}>
        <View style={styles.circuloIcono}>
          <Ionicons name="notifications-outline" size={50} color="#115e59" />
        </View>
        <Text style={styles.textoPrincipal}>No tienes notificaciones{'\n'}por el momento</Text>
        <Text style={styles.textoSecundario}>
          Aquí aparecerán los recordatorios de tus citas y otros avisos importantes.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: 40, paddingHorizontal: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#115e59', marginBottom: 40 },
  contenidoVacio: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  circuloIcono: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e6f4f1', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  textoPrincipal: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12, lineHeight: 26 },
  textoSecundario: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
});