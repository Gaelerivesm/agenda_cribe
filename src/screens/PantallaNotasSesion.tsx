import React, { useContext, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita } from '../context/CitasContext';
import { fechaLarga, iniciales, normalizarNombre } from '../utils/utilidades';
import { useAuth } from '../context/AuthContext';
import { obtenerPaleta } from '../theme/tema';
import { PacientesContext } from '../context/PacientesContext';

interface EditorProps {
  cita: Cita;
  modoInicial?: 'ver' | 'editar';
  paleta: ReturnType<typeof obtenerPaleta>;
  styles: ReturnType<typeof crearStyles>;
}

function EditorNotasSesion({ cita, modoInicial, paleta, styles }: EditorProps) {
  const context = useContext(CitasContext);
  const pacientesContext = useContext(PacientesContext);
  if (!context) throw new Error('CitasContext no está disponible');
  if (!pacientesContext) throw new Error('PacientesContext no está disponible');
  const { editarCita } = context;
  const { pacientes } = pacientesContext;

  const pacienteRelacionado = pacientes.find(p => normalizarNombre(p.nombre) === normalizarNombre(cita.paciente));
  const [editando, setEditando] = useState(modoInicial === 'editar');
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
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.tarjeta}>
          <View style={styles.avatar}>
            <Text style={styles.textoAvatar}>{iniciales(cita.paciente)}</Text>
          </View>
          <View style={styles.infoPaciente}>
            <TouchableOpacity
              disabled={!pacienteRelacionado}
              onPress={() => pacienteRelacionado && router.push({ pathname: '/paciente/[pacienteId]', params: { pacienteId: pacienteRelacionado.id } })}
            >
              <Text style={styles.nombre}>{cita.paciente}</Text>
            </TouchableOpacity>
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
            <Ionicons name="calendar-outline" size={20} color={paleta.primaria} />
            <Text style={styles.datoTexto}>{fechaLarga(cita.fecha)}</Text>
          </View>
          <View style={styles.datoFila}>
            <Ionicons name="time-outline" size={20} color={paleta.primaria} />
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
            placeholderTextColor={paleta.textoSecundario}
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
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default function PantallaNotasSesion() {
  const route = useLocalSearchParams<{ citaId: string; modo?: 'ver' | 'editar' }>();
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  const context = useContext(CitasContext);
  if (!context) throw new Error('CitasContext no está disponible');
  const { citas } = context;

  const cita = citas.find(c => c.id === route.citaId);

  if (!cita) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: paleta.fondo }}>
        <Text>Esta cita ya no existe.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: paleta.primaria, marginTop: 12 }}>Volver</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <View style={styles.encabezado}>
        <TouchableOpacity style={styles.botonAtras} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={paleta.texto} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Notas de sesión</Text>
        <View style={styles.espaciadorEncabezado} />
      </View>

      <EditorNotasSesion
        key={cita.id}
        cita={cita}
        modoInicial={route.modo}
        paleta={paleta}
        styles={styles}
      />
    </View>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  flex: { flex: 1 },
  contenedor: { flex: 1, backgroundColor: paleta.fondo },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  botonAtras: { width: 40, height: 40, borderRadius: 20, backgroundColor: paleta.tarjeta, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: paleta.inputBorde },
  espaciadorEncabezado: { width: 40 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: paleta.texto },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  tarjeta: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: paleta.inputBorde,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  textoAvatar: { fontSize: 16, fontWeight: 'bold', color: paleta.primaria },
  infoPaciente: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: paleta.texto },
  tipo: { fontSize: 13, color: paleta.primaria, marginTop: 2, fontWeight: '500' },
  insigniaConfirmada: {
    backgroundColor: paleta.suave,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  textoInsignia: { fontSize: 11, fontWeight: 'bold', color: paleta.primaria },
  datoFila: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingVertical: 6 },
  datoTexto: { fontSize: 14, color: paleta.texto },
  tituloSeccion: { fontSize: 16, fontWeight: 'bold', color: paleta.texto, marginTop: 8, marginBottom: 10 },
  cajaNotas: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 18,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
  },
  textoNotas: { fontSize: 14, color: paleta.texto, lineHeight: 22 },
  textoSinNotas: { fontSize: 14, color: paleta.textoSecundario, fontStyle: 'italic' },
  inputNotas: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: paleta.primaria,
    padding: 16,
    minHeight: 180,
    fontSize: 14,
    color: paleta.texto,
    textAlignVertical: 'top',
  },
  filaBotones: { flexDirection: 'row', gap: 12, marginTop: 20 },
  botonPrimario: { flex: 1, backgroundColor: paleta.primaria, padding: 15, borderRadius: 14, alignItems: 'center' },
  botonPrimarioAncho: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: paleta.primaria,
    padding: 15,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: paleta.primaria,
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
    borderColor: paleta.inputBorde,
    backgroundColor: paleta.tarjeta,
  },
  textoSecundario: { color: paleta.textoSecundario, fontWeight: 'bold', fontSize: 15 },
});
