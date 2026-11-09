import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita } from './CitasContext';
import { PacientesContext, Paciente } from './PacientesContext';
import FormularioPaciente from './Formulariopaciente';
import { PacientesStackParamList } from './tiposNavegacion';
import { normalizarNombre, iniciales, marcaAhora, marcaTiempo, etiquetaRelativa } from './utilidades';

export default function PantallaPacientes() {
  const navigation = useNavigation<NavigationProp<PacientesStackParamList>>();
  const insets = useSafeAreaInsets();

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
        onPress={() => navigation.navigate('FichaPaciente', { pacienteId: item.id })}
      >
        <View style={styles.avatar}>
          <Text style={styles.textoAvatar}>{iniciales(item.nombre)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={proxima ? styles.proxima : styles.sinProxima}>
            {proxima ? `Próxima cita: ${etiquetaRelativa(proxima.fecha)} ${proxima.hora}` : 'Sin citas próximas'}
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

      <View style={styles.buscador}>
        <Ionicons name="search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.inputBusqueda}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar paciente"
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

      <TouchableOpacity style={styles.botonFlotante} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#ffffff" />
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

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7' },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1e1b4b' },
  contador: { fontSize: 14, color: '#6b7280' },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 14, borderRadius: 14 },
  inputBusqueda: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1e1b4b' },
  lista: { paddingHorizontal: 20, paddingBottom: 110 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  textoAvatar: { fontSize: 16, fontWeight: 'bold', color: '#115e59' },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#1e1b4b' },
  proxima: { fontSize: 13, color: '#115e59', marginTop: 2 },
  sinProxima: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  vacio: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  botonFlotante: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#115e59', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});