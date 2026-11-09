import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Paciente, DatosPaciente } from './PacientesContext';
import { formatearFecha } from './CitasContext';
import { fechaLarga } from './utilidades';

interface Props {
  visible: boolean;
  paciente?: Paciente | null;
  onCerrar: () => void;
  onGuardar: (datos: DatosPaciente) => void;
}

const parsearFecha = (texto: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

export default function FormularioPaciente({ visible, paciente, onCerrar, onGuardar }: Props) {
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [mostrarSelector, setMostrarSelector] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNombre(paciente?.nombre ?? '');
    setFechaNacimiento(paciente?.fechaNacimiento ?? '');
    setTelefono(paciente?.telefono ?? '');
    setCorreo(paciente?.correo ?? '');
    setMostrarSelector(false);
  }, [visible, paciente]);

  const alCambiarFecha = (evento: DateTimePickerEvent, valor?: Date) => {
    if (Platform.OS === 'android') setMostrarSelector(false);
    if (evento.type === 'dismissed' || !valor) return;
    setFechaNacimiento(formatearFecha(valor));
  };

  const guardar = () => {
    if (!nombre.trim()) {
      Alert.alert('Falta información', 'Escribe el nombre del paciente.');
      return;
    }
    if (telefono.trim() && !/^[\d\s+()-]{7,}$/.test(telefono.trim())) {
      Alert.alert('Teléfono inválido', 'Usa solo números, espacios, + o guiones.');
      return;
    }
    if (correo.trim() && !/^\S+@\S+\.\S+$/.test(correo.trim())) {
      Alert.alert('Correo inválido', 'Revisa que el correo tenga el formato nombre@dominio.com.');
      return;
    }
    onGuardar({
      nombre: nombre.trim(),
      fechaNacimiento,
      telefono: telefono.trim(),
      correo: correo.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.contenedor}>
          <View style={styles.header}>
            <Text style={styles.titulo}>{paciente ? 'Editar paciente' : 'Nuevo paciente'}</Text>
            <TouchableOpacity onPress={onCerrar}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre del paciente" />

            <Text style={styles.label}>Fecha de nacimiento</Text>
            <View style={styles.filaFecha}>
              <TouchableOpacity
                style={[styles.input, styles.campoFecha, mostrarSelector && styles.campoActivo]}
                onPress={() => setMostrarSelector(!mostrarSelector)}
              >
                <Ionicons name="gift-outline" size={18} color="#115e59" />
                <Text style={fechaNacimiento ? styles.textoFecha : styles.textoPlaceholder}>
                  {fechaNacimiento ? fechaLarga(fechaNacimiento) : 'Opcional'}
                </Text>
              </TouchableOpacity>
              {fechaNacimiento ? (
                <TouchableOpacity style={styles.botonLimpiar} onPress={() => setFechaNacimiento('')}>
                  <Ionicons name="close-circle" size={22} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {mostrarSelector ? (
              <View style={styles.contenedorPicker}>
                <DateTimePicker
                  value={parsearFecha(fechaNacimiento) ?? new Date(1990, 0, 1)}
                  mode="date"
                  locale="es-MX"
                  maximumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  accentColor="#115e59"
                  onChange={alCambiarFecha}
                />
                {Platform.OS === 'ios' ? (
                  <TouchableOpacity style={styles.botonListo} onPress={() => setMostrarSelector(false)}>
                    <Text style={styles.textoBotonListo}>Listo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="614 555 0100"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.botonGuardar} onPress={guardar}>
              <Text style={styles.textoGuardar}>{paciente ? 'Guardar cambios' : 'Guardar paciente'}</Text>
            </TouchableOpacity>
            <View style={styles.espacioFinal} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  contenedor: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#1e1b4b' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#6b7280', marginBottom: 5 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 14, color: '#1e1b4b' },
  filaFecha: { flexDirection: 'row', alignItems: 'flex-start' },
  campoFecha: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  campoActivo: { borderColor: '#115e59' },
  textoFecha: { fontSize: 14, color: '#1e1b4b' },
  textoPlaceholder: { fontSize: 14, color: '#9ca3af' },
  botonLimpiar: { paddingLeft: 10, paddingTop: 11 },
  contenedorPicker: { marginBottom: 14, backgroundColor: '#f9fafb', borderRadius: 14, padding: 8 },
  botonListo: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16 },
  textoBotonListo: { color: '#115e59', fontWeight: 'bold', fontSize: 15 },
  botonGuardar: { backgroundColor: '#115e59', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  textoGuardar: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  espacioFinal: { height: 20 },
});