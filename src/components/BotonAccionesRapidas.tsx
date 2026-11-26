import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerPaleta } from '../theme/tema';

interface Props {
  paleta: ReturnType<typeof obtenerPaleta>;
  style?: object;
  onPress: () => void;
  onAgregarCita: () => void;
  onAgregarPaciente: () => void;
}

export default function BotonAccionesRapidas({ paleta, style, onPress, onAgregarCita, onAgregarPaciente }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const styles = useMemo(() => StyleSheet.create({
    fondo: { flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 32, backgroundColor: 'rgba(0,0,0,0.4)' },
    tarjeta: { backgroundColor: paleta.tarjeta, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: paleta.borde },
    encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    titulo: { color: paleta.texto, fontSize: 18, fontWeight: '700' },
    fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderTopWidth: 1, borderTopColor: paleta.borde },
    texto: { color: paleta.texto, fontSize: 15, fontWeight: '600' },
  }), [paleta]);
  const ejecutar = (accion: () => void) => { setMenuVisible(false); accion(); };
  return <>
    <TouchableOpacity style={style} onPress={onPress} onLongPress={() => setMenuVisible(true)} delayLongPress={500} accessibilityRole="button" accessibilityLabel="Agregar; mantén presionado para más opciones">
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
    <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
      <Pressable style={styles.fondo} onPress={() => setMenuVisible(false)}>
        <Pressable style={styles.tarjeta} onPress={event => event.stopPropagation()}>
          <View style={styles.encabezado}><Text style={styles.titulo}>¿Qué quieres agregar?</Text><TouchableOpacity onPress={() => setMenuVisible(false)} accessibilityLabel="Cerrar opciones"><Ionicons name="close" size={22} color={paleta.textoSecundario} /></TouchableOpacity></View>
          <TouchableOpacity style={styles.fila} onPress={() => ejecutar(onAgregarCita)}><Ionicons name="calendar-outline" size={21} color={paleta.primaria} /><Text style={styles.texto}>Añadir cita</Text></TouchableOpacity>
          <TouchableOpacity style={styles.fila} onPress={() => ejecutar(onAgregarPaciente)}><Ionicons name="person-add-outline" size={21} color={paleta.primaria} /><Text style={styles.texto}>Añadir paciente</Text></TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}
