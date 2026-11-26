import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Paciente, DatosPaciente } from '../context/PacientesContext';
import { formatearFecha } from '../context/CitasContext';
import { fechaLarga } from '../utils/utilidades';
import { useAuth } from '../context/AuthContext';
import { obtenerPaleta } from '../theme/tema';

interface Props {
  visible: boolean;
  paciente?: Paciente | null;
  onCerrar: () => void;
  onGuardar: (datos: DatosPaciente) => void;
}

interface ContenidoProps {
  paciente?: Paciente | null;
  onCerrar: () => void;
  onGuardar: (datos: DatosPaciente) => void;
  paleta: ReturnType<typeof obtenerPaleta>;
  styles: ReturnType<typeof crearStyles>;
}

function FormularioContenido({ paciente, onCerrar, onGuardar, paleta, styles }: ContenidoProps) {
  const [nombre, setNombre] = useState(paciente?.nombre ?? '');
  const [pronombres, setPronombres] = useState(paciente?.pronombres ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(paciente?.fechaNacimiento ?? '');
  const [telefono, setTelefono] = useState(paciente?.telefono ?? '');
  const [correo, setCorreo] = useState(paciente?.correo ?? '');
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const alCambiarFecha = (evento: DateTimePickerEvent, valor?: Date) => {
    if (Platform.OS === 'android') setMostrarSelector(false);
    if (evento.type === 'dismissed' || !valor) return;
    setFechaNacimiento(formatearFecha(valor));
  };

  const parsearFecha = (texto: string): Date => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (!m) return new Date();
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
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
      pronombres: pronombres.trim(),
      fechaNacimiento,
      telefono: telefono.trim(),
      correo: correo.trim(),
    });
  };

  return (
    <Pressable style={styles.contenedor} onPress={evento => evento.stopPropagation()}>
      <ScrollView contentContainerStyle={styles.scrollContenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.header}>
            <Text style={styles.titulo}>{paciente ? 'Editar paciente' : 'Nuevo paciente'}</Text>
            <TouchableOpacity onPress={onCerrar} accessibilityLabel="Cerrar ventana">
              <Ionicons name="close" size={24} color={paleta.textoSecundario} />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Nombre del paciente" />

          <Text style={styles.label}>Pronombres (opcional)</Text>
          <TextInput style={styles.input} value={pronombres} onChangeText={setPronombres} placeholder="Ej. ella, él, elle" />

          <Text style={styles.label}>Fecha de nacimiento</Text>
          <View style={styles.filaFecha}>
            <TouchableOpacity
              style={[styles.input, styles.campoFecha, mostrarSelector && styles.campoActivo]}
              onPress={() => setMostrarSelector(!mostrarSelector)}
            >
              <Ionicons name="gift-outline" size={18} color={paleta.primaria} />
              <Text style={fechaNacimiento ? styles.textoFecha : styles.textoPlaceholder}>
                {fechaNacimiento ? fechaLarga(fechaNacimiento) : 'Opcional'}
              </Text>
            </TouchableOpacity>
            {fechaNacimiento ? (
              <TouchableOpacity style={styles.botonLimpiar} onPress={() => setFechaNacimiento('')}>
                <Ionicons name="close-circle" size={18} color={paleta.textoSecundario} />
              </TouchableOpacity>
            ) : null}
          </View>

          {mostrarSelector ? (
            <View style={styles.pickerContenedor}>
              <DateTimePicker
                value={fechaNacimiento ? parsearFecha(fechaNacimiento) : new Date(2000, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                locale="es-MX"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                accentColor={paleta.primaria}
                onChange={alCambiarFecha}
              />
              {Platform.OS === 'ios' ? (
                <TouchableOpacity style={styles.botonListo} onPress={() => setMostrarSelector(false)}>
                  <Text style={styles.textoListo}>Listo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.label}>Teléfono</Text>
          <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} placeholder="10 dígitos" keyboardType="phone-pad" />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput style={styles.input} value={correo} onChangeText={setCorreo} placeholder="paciente@correo.com" keyboardType="email-address" autoCapitalize="none" />

          <TouchableOpacity style={styles.botonGuardar} onPress={guardar}>
            <Text style={styles.textoGuardar}>Guardar paciente</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </ScrollView>
    </Pressable>
  );
}

export default function FormularioPaciente({ visible, paciente, onCerrar, onGuardar }: Props) {
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        {visible ? (
          <FormularioContenido
            key={paciente?.id ?? 'nuevo'}
            paciente={paciente}
            onCerrar={onCerrar}
            onGuardar={onGuardar}
            paleta={paleta}
            styles={styles}
          />
        ) : null}
      </Pressable>
    </Modal>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  contenedor: { maxHeight: '90%', backgroundColor: paleta.tarjeta, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 20 },
  scrollContenido: { paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: paleta.texto },
  label: { fontSize: 13, fontWeight: 'bold', color: paleta.textoSecundario, marginBottom: 6 },
  input: { minHeight: 46, paddingHorizontal: 12, marginBottom: 14, backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde, borderRadius: 14, color: paleta.texto },
  filaFecha: { position: 'relative' },
  campoFecha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  campoActivo: { borderColor: paleta.primaria, backgroundColor: paleta.tarjeta },
  textoFecha: { color: paleta.texto, fontSize: 14 },
  textoPlaceholder: { color: paleta.textoSecundario, fontSize: 14 },
  botonLimpiar: { position: 'absolute', right: 12, top: 14 },
  pickerContenedor: { marginBottom: 14, padding: 10, backgroundColor: paleta.inputFondo, borderRadius: 16 },
  botonListo: { alignItems: 'center', padding: 8 },
  textoListo: { color: paleta.primaria, fontWeight: 'bold' },
  botonGuardar: { alignItems: 'center', backgroundColor: paleta.primaria, padding: 15, borderRadius: 14, marginTop: 8 },
  textoGuardar: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
