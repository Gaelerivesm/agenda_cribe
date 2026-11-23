import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { obtenerPaleta, PALETAS } from './tema';

interface Props { visible: boolean; onCerrar: () => void }

export default function ModalPaletas({ visible, onCerrar }: Props) {
  const { usuarioActual, actualizarPaleta } = useAuth();
  const seleccionada = obtenerPaleta(usuarioActual?.paleta).id;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable style={styles.tarjeta} onPress={evento => evento.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Color de interfaz</Text>
            <TouchableOpacity onPress={onCerrar} accessibilityLabel="Cerrar ventana"><Ionicons name="close" size={22} color="#6b7280" /></TouchableOpacity>
          </View>
          <Text style={styles.subtitulo}>Elige una paleta predeterminada.</Text>
          {PALETAS.map(paleta => (
            <TouchableOpacity key={paleta.id} style={styles.fila} onPress={() => { actualizarPaleta(paleta.id); onCerrar(); }}>
              <View style={styles.info}>
                <View style={[styles.muestra, { backgroundColor: paleta.primaria }]} />
                <View style={[styles.muestraSuave, { backgroundColor: paleta.suave, borderColor: paleta.borde }]} />
                <Text style={styles.nombre}>{paleta.nombre}</Text>
              </View>
              {seleccionada === paleta.id ? <Ionicons name="checkmark-circle" size={21} color={paleta.primaria} /> : null}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', padding: 22 },
  tarjeta: { backgroundColor: '#fff', borderRadius: 22, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { color: '#111827', fontSize: 18, fontWeight: '700' },
  subtitulo: { color: '#6b7280', fontSize: 13, marginTop: 5, marginBottom: 12 },
  fila: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muestra: { width: 22, height: 22, borderRadius: 11 },
  muestraSuave: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  nombre: { marginLeft: 4, color: '#374151', fontSize: 14, fontWeight: '600' },
});
