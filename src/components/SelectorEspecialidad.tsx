import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ESPECIALIDADES_TERAPIA } from '../utils/catalogos';
import { Tema } from '../theme/tema';

interface Props {
  value: string;
  onChange: (especialidad: string) => void;
  paleta: Tema;
  placeholder?: string;
  style?: object;
}

export default function SelectorEspecialidad({ value, onChange, paleta, placeholder = 'Selecciona una especialidad', style }: Props) {
  const [visible, setVisible] = useState(false);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  const seleccionar = (especialidad: string) => {
    onChange(especialidad);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={[styles.selector, style]} onPress={() => setVisible(true)} accessibilityRole="button">
        <Text style={value ? styles.valor : styles.placeholder}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={paleta.textoSecundario} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.fondo} onPress={() => setVisible(false)}>
          <Pressable style={styles.tarjeta} onPress={event => event.stopPropagation()}>
            <View style={styles.encabezado}>
              <Text style={styles.titulo}>Especialidad</Text>
              <TouchableOpacity onPress={() => setVisible(false)} accessibilityLabel="Cerrar especialidades">
                <Ionicons name="close" size={22} color={paleta.textoSecundario} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.lista} keyboardShouldPersistTaps="handled">
              {ESPECIALIDADES_TERAPIA.map(especialidad => (
                <TouchableOpacity key={especialidad} style={styles.fila} onPress={() => seleccionar(especialidad)}>
                  <Text style={styles.nombre}>{especialidad}</Text>
                  {value === especialidad ? <Ionicons name="checkmark" size={18} color={paleta.primaria} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const crearStyles = (paleta: Tema) => StyleSheet.create({
  selector: { minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde, borderRadius: 14 },
  valor: { flex: 1, color: paleta.texto, fontSize: 14 },
  placeholder: { flex: 1, color: paleta.textoSecundario, fontSize: 14 },
  fondo: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(0,0,0,0.45)' },
  tarjeta: { maxHeight: '82%', padding: 18, borderRadius: 22, backgroundColor: paleta.tarjeta },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  titulo: { fontSize: 18, fontWeight: '700', color: paleta.texto },
  lista: { flexGrow: 0 },
  fila: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: paleta.borde },
  nombre: { flex: 1, paddingVertical: 8, color: paleta.texto, fontSize: 14 },
});
