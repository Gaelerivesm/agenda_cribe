import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext } from './CitasContext';
import { CalendarioStackParamList } from './tiposNavegacion';
import { fechaLarga, iniciales } from './utilidades';

export default function PantallaNotasSesion() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CalendarioStackParamList, 'NotasSesion'>>();
  const insets = useSafeAreaInsets();

  const context = useContext(CitasContext);
  if (!context) throw new Error('CitasContext no está disponible');
  const { citas, editarCita } = context;

  const { cita: citaParam, modo } = route.params;
  const cita = citas.find(c => c.id === citaParam.id) ?? citaParam;

  const [editando, setEditando] = useState(modo === 'editar');
  const [notas, setNotas] = useState(cita.notas);

  const guardar = () => {
    const { id, ...resto } = cita;
    const notasLimpias = notas.trim();
    setNotas(notasLimpias);
    editarCita(id, { ...resto, notas: notasLimpias });
    setEditando(false);
    Alert.alert('Guardado', 'Las notas de la sesión se actualizaron.');
  };

  const cancelar = () => {
    setNotas(cita.notas);
    setEditando(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
        <View style={styles.encabezado}>
          <TouchableOpacity style={styles.botonAtras} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Notas de sesión</Text>
          <View style={styles.espaciadorEncabezado} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.tarjeta}>
            <View style={styles.avatar}>
              <Text style={styles.textoAvatar}>{iniciales(cita.paciente)}</Text>
            </View>
            <View style={styles.infoPaciente}>
              <Text style={styles.nombre}>{cita.paciente}</Text>
              <Text style={styles.tipo}>{cita.tipo}</Text>
            </View>
            <View style={styles.insigniaConfirmada}>
              <Text style={styles.textoInsignia}>
                {cita.confirmada ? 'Confirmada' : 'Pendiente'}
              </Text>
            </View>
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.datoFila}>
              <Ionicons name="calendar-outline" size={20} color="#B80065" />
              <Text style={styles.datoTexto}>{fechaLarga(cita.fecha)}</Text>
            </View>
            <View style={styles.datoFila}>
              <Ionicons name="time-outline" size={20} color="#B80065" />
              <Text style={styles.datoTexto}>{cita.hora} hrs</Text>
            </View>
          </View>

          <Text style={styles.tituloSeccion}>Observaciones clínicas</Text>
          {editando ? (
            <TextInput
              style={styles.inputNotas}
              value={notas}
              onChangeText={setNotas}
              placeholder="Escribe las observaciones de la sesión..."
              placeholderTextColor="#9ca3af"
              multiline
              autoFocus
            />
          ) : (
            <View style={styles.cajaNotas}>
              <Text style={cita.notas.length > 0 ? styles.textoNotas : styles.textoSinNotas}>
                {cita.notas.length > 0 ? cita.notas : 'Aún no hay notas para esta sesión.'}
              </Text>
            </View>
          )}

          {editando ? (
            <View style={styles.filaBotones}>
              <TouchableOpacity style={styles.botonSecundario} onPress={cancelar}>
                <Text style={styles.textoSecundario}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonPrimario} onPress={guardar}>
                <Text style={styles.textoPrimario}>Guardar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.botonPrimarioAncho} onPress={() => setEditando(true)}>
              <Ionicons name="pencil" size={18} color="#ffffff" />
              <Text style={styles.textoPrimario}>Editar notas</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenedor: { flex: 1, backgroundColor: '#FAFAFA' },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  botonAtras: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  espaciadorEncabezado: { width: 40 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  tarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  textoAvatar: { fontSize: 16, fontWeight: 'bold', color: '#B80065' },
  infoPaciente: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  tipo: { fontSize: 13, color: '#B80065', marginTop: 2, fontWeight: '500' },
  insigniaConfirmada: {
    backgroundColor: '#FDF2F8',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  textoInsignia: { fontSize: 11, fontWeight: 'bold', color: '#B80065' },
  datoFila: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingVertical: 6 },
  datoTexto: { fontSize: 14, color: '#111827' },
  tituloSeccion: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 8, marginBottom: 10 },
  cajaNotas: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  textoNotas: { fontSize: 14, color: '#111827', lineHeight: 22 },
  textoSinNotas: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  inputNotas: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B80065',
    padding: 16,
    minHeight: 180,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  filaBotones: { flexDirection: 'row', gap: 12, marginTop: 20 },
  botonPrimario: { flex: 1, backgroundColor: '#B80065', padding: 15, borderRadius: 14, alignItems: 'center' },
  botonPrimarioAncho: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B80065',
    padding: 15,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: '#B80065',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  textoPrimario: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  botonSecundario: {
    flex: 1,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  textoSecundario: { color: '#374151', fontWeight: 'bold', fontSize: 15 },
});
