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

const NOMBRES_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const fechaLegible = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return `${dia} de ${NOMBRES_MESES[mes - 1]} de ${anio}`;
};

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
    editarCita(id, { ...resto, notas: notas.trim() });
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
            <Ionicons name="chevron-back" size={24} color="#115e59" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Notas de sesión</Text>
          <View style={styles.espaciadorEncabezado} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.tarjeta}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color="#6b7280" />
            </View>
            <View style={styles.infoPaciente}>
              <Text style={styles.nombre}>{cita.paciente}</Text>
              <Text style={styles.tipo}>{cita.tipo}</Text>
            </View>
            {cita.confirmada ? (
              <View style={styles.insigniaConfirmada}>
                <Ionicons name="checkmark-circle" size={14} color="#065f46" />
                <Text style={styles.textoInsignia}>Confirmada</Text>
              </View>
            ) : (
              <View style={styles.insigniaPendiente}>
                <Text style={styles.textoPendiente}>Pendiente</Text>
              </View>
            )}
          </View>

          <View style={styles.tarjeta}>
            <View style={styles.datoFila}>
              <Ionicons name="calendar-outline" size={20} color="#115e59" />
              <Text style={styles.datoTexto}>{fechaLegible(cita.fecha)}</Text>
            </View>
            <View style={styles.datoFila}>
              <Ionicons name="time-outline" size={20} color="#115e59" />
              <Text style={styles.datoTexto}>{cita.hora}</Text>
            </View>
          </View>

          <Text style={styles.tituloSeccion}>Notas</Text>
          {editando ? (
            <TextInput
              style={styles.inputNotas}
              value={notas}
              onChangeText={setNotas}
              placeholder="Escribe las observaciones de la sesión..."
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
  contenedor: { flex: 1, backgroundColor: '#fdfbf7' },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  botonAtras: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  espaciadorEncabezado: { width: 40 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#1e1b4b' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  tarjeta: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoPaciente: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b' },
  tipo: { fontSize: 14, color: '#115e59', marginTop: 2 },
  insigniaConfirmada: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#d1fae5', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
  textoInsignia: { fontSize: 11, fontWeight: 'bold', color: '#065f46' },
  insigniaPendiente: { backgroundColor: '#f3f4f6', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
  textoPendiente: { fontSize: 11, fontWeight: 'bold', color: '#6b7280' },
  datoFila: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingVertical: 6 },
  datoTexto: { fontSize: 15, color: '#1f2937' },
  tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', marginTop: 6, marginBottom: 10 },
  cajaNotas: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, minHeight: 140, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  textoNotas: { fontSize: 15, color: '#1f2937', lineHeight: 22 },
  textoSinNotas: { fontSize: 15, color: '#9ca3af', fontStyle: 'italic' },
  inputNotas: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#115e59', padding: 16, minHeight: 180, fontSize: 15, color: '#1f2937', textAlignVertical: 'top' },
  filaBotones: { flexDirection: 'row', gap: 12, marginTop: 20 },
  botonPrimario: { flex: 1, backgroundColor: '#115e59', padding: 15, borderRadius: 12, alignItems: 'center' },
  botonPrimarioAncho: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#115e59', padding: 15, borderRadius: 12, marginTop: 20 },
  textoPrimario: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  botonSecundario: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#ffffff' },
  textoSecundario: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
});
