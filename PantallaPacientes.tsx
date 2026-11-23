import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita } from './CitasContext';
import { PacientesContext, Paciente } from './PacientesContext';
import FormularioPaciente from './Formulariopaciente';
import { normalizarNombre, iniciales, marcaAhora, marcaTiempo, etiquetaRelativa } from './utilidades';
import { useAuth } from './AuthContext';
import { obtenerPaleta } from './tema';

export default function PantallaPacientes() {
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  const citasContext = useContext(CitasContext);
  const pacientesContext = useContext(PacientesContext);
  if (!citasContext || !pacientesContext) throw new Error('Los contextos no están disponibles');
  const { citas } = citasContext;
  const { pacientes, agregarPaciente } = pacientesContext;

  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const proximaCitaPorPaciente = useMemo(() => {
    const ahora = marcaAhora();
    const mapa: Record<string, Cita> = {};
    citas
      .filter(c => marcaTiempo(c.fecha, c.hora) >= ahora)
      .sort((a, b) => marcaTiempo(a.fecha, a.hora).localeCompare(marcaTiempo(b.fecha, b.hora)))
      .forEach(c => {
        const clave = normalizarNombre(c.paciente);
        if (!mapa[clave]) mapa[clave] = c;
      });
    return mapa;
  }, [citas]);

  const lista = useMemo(() => {
    const termino = normalizarNombre(busqueda);
    return pacientes
      .filter(p => normalizarNombre(p.nombre).includes(termino))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [pacientes, busqueda]);

  const renderPaciente = ({ item }: { item: Paciente }) => {
    const proxima = proximaCitaPorPaciente[normalizarNombre(item.nombre)];
    return (
      <TouchableOpacity
        style={styles.tarjeta}
        onPress={() => router.push({ pathname: '/paciente/[pacienteId]', params: { pacienteId: item.id } })}
      >
        <View style={styles.avatar}>
          <Text style={styles.textoAvatar}>{iniciales(item.nombre)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={proxima ? styles.proxima : styles.sinProxima}>
            {proxima ? `Próxima: ${etiquetaRelativa(proxima.fecha)} ${proxima.hora}` : 'Sin citas próximas'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Pacientes</Text>
        <Text style={styles.contador}>{pacientes.length} en total</Text>
      </View>

      <KeyboardAvoidingView style={styles.areaLista} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.buscador}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.inputBusqueda}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar paciente"
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
        />
        {busqueda.length > 0 ? (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={lista}
        keyExtractor={item => item.id}
        renderItem={renderPaciente}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.vacio}>
            {busqueda.length > 0 ? 'No se encontraron pacientes.' : 'Aún no tienes pacientes registrados.'}
          </Text>
        }
      />
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.botonFlotante} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      <FormularioPaciente
        visible={modalVisible}
        onCerrar={() => setModalVisible(false)}
        onGuardar={datos => {
          agregarPaciente(datos);
          setModalVisible(false);
        }}
      />
    </View>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#FAFAFA' },
  areaLista: { flex: 1 },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  contador: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 48,
  },
  inputBusqueda: { flex: 1, fontSize: 14, color: '#111827' },
  lista: { paddingHorizontal: 20, paddingBottom: 110 },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  textoAvatar: { fontSize: 15, fontWeight: 'bold', color: paleta.primaria },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  proxima: { fontSize: 13, color: paleta.primaria, marginTop: 2, fontWeight: '500' },
  sinProxima: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  vacio: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  botonFlotante: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: paleta.primaria,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: paleta.primaria,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
