import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { obtenerPaleta, PALETAS } from '../theme/tema';

interface Props { visible: boolean; onCerrar: () => void }

export default function ModalPaletas({ visible, onCerrar }: Props) {
  const { usuarioActual, actualizarPaleta } = useAuth();
  const tema = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(tema), [tema]);
  const seleccionada = tema.id;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable style={styles.tarjeta} onPress={evento => evento.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Color de interfaz</Text>
            <TouchableOpacity onPress={onCerrar} accessibilityLabel="Cerrar ventana"><Ionicons name="close" size={22} color={tema.textoSecundario} /></TouchableOpacity>
          </View>
          <Text style={styles.subtitulo}>Elige una paleta predeterminada.</Text>
          {PALETAS.map(paleta => (
            <TouchableOpacity key={paleta.id} style={styles.fila} onPress={() => { actualizarPaleta(paleta.id); onCerrar(); }}>
              <View style={styles.info}>
                <View style={[styles.muestra, { backgroundColor: paleta.primaria }]} />
                <View style={[styles.muestraSuave, { backgroundColor: obtenerPaleta(paleta.id, tema.esOscuro).suave, borderColor: obtenerPaleta(paleta.id, tema.esOscuro).borde }]} />
                <Text style={styles.nombre}>{paleta.nombre}</Text>
              </View>
              {seleccionada === paleta.id ? <Ionicons name="checkmark-circle" size={21} color={tema.primaria} /> : null}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const crearStyles = (tema: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', padding: 22 },
  tarjeta: { backgroundColor: tema.tarjeta, borderRadius: 22, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { color: tema.texto, fontSize: 18, fontWeight: '700' },
  subtitulo: { color: tema.textoSecundario, fontSize: 13, marginTop: 5, marginBottom: 12 },
  fila: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: tema.inputBorde },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muestra: { width: 22, height: 22, borderRadius: 11 },
  muestraSuave: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  nombre: { marginLeft: 4, color: tema.texto, fontSize: 14, fontWeight: '600' },
});
