import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita } from './CitasContext';
import { PacientesContext, DatosPaciente, calcularEdad, diasParaCumple } from './PacientesContext';
import FormularioPaciente from './Formulariopaciente';
import { PacientesStackParamList, RootTabParamList } from './tiposNavegacion';
import { normalizarNombre, iniciales, fechaCorta, marcaAhora, marcaTiempo, etiquetaRelativa } from './utilidades';

export default function PantallaFichaPaciente() {
  const navigation = useNavigation<NavigationProp<RootTabParamList & PacientesStackParamList>>();
  const route = useRoute<RouteProp<PacientesStackParamList, 'FichaPaciente'>>();
  const insets = useSafeAreaInsets();

  const citasContext = useContext(CitasContext);
  const pacientesContext = useContext(PacientesContext);
  if (!citasContext || !pacientesContext) throw new Error('Los contextos no están disponibles');
  const { citas, editarCita } = citasContext;
  const { pacientes, editarPaciente, eliminarPaciente } = pacientesContext;

  const [modalVisible, setModalVisible] = useState(false);

  const paciente = pacientes.find(p => p.id === route.params.pacienteId);

  const { proximas, historial } = useMemo(() => {
    if (!paciente) return { proximas: [] as Cita[], historial: [] as Cita[] };
    const clave = normalizarNombre(paciente.nombre);
    const ahora = marcaAhora();
    const suyas = citas
      .filter(c => normalizarNombre(c.paciente) === clave)
      .sort((a, b) => marcaTiempo(a.fecha, a.hora).localeCompare(marcaTiempo(b.fecha, b.hora)));
    return {
      proximas: suyas.filter(c => marcaTiempo(c.fecha, c.hora) >= ahora),
      historial: suyas.filter(c => marcaTiempo(c.fecha, c.hora) < ahora).reverse().slice(0, 10),
    };
  }, [citas, paciente]);

  if (!paciente) {
    return (
      <View style={[styles.contenedor, styles.centrado, { paddingTop: insets.top }]}>
        <Text style={styles.vacio}>Este paciente ya no existe.</Text>
        <TouchableOpacity style={styles.botonPrimario} onPress={() => navigation.goBack()}>
          <Text style={styles.textoPrimario}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const edad = calcularEdad(paciente.fechaNacimiento);
  const diasCumple = diasParaCumple(paciente.fechaNacimiento);

  const guardarCambios = (datos: DatosPaciente) => {
    if (normalizarNombre(datos.nombre) !== normalizarNombre(paciente.nombre)) {
      const clave = normalizarNombre(paciente.nombre);
      citas
        .filter(c => normalizarNombre(c.paciente) === clave)
        .forEach(c => {
          const { id, ...resto } = c;
          editarCita(id, { ...resto, paciente: datos.nombre });
        });
    }
    editarPaciente(paciente.id, datos);
    setModalVisible(false);
  };

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar paciente',
      `¿Eliminar a ${paciente.nombre}? Sus citas no se borrarán del calendario.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            eliminarPaciente(paciente.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const abrirCita = (cita: Cita) => {
    navigation.navigate('Calendario', { screen: 'NotasSesion', params: { cita, modo: 'ver' } });
  };

  const agendarCita = () => {
    navigation.navigate('Calendario', {
      screen: 'VistaCalendario',
      params: { nuevaCita: true, paciente: paciente.nombre },
    });
  };

  const renderCita = (cita: Cita) => (
    <TouchableOpacity key={cita.id} style={styles.filaCita} onPress={() => abrirCita(cita)}>
      <View style={styles.columnaFecha}>
        <Text style={styles.horaCita}>{cita.hora}</Text>
        <Text style={styles.diaCita}>{etiquetaRelativa(cita.fecha)}</Text>
      </View>
      <View style={styles.infoCita}>
        <Text style={styles.tipoCita}>{cita.tipo}</Text>
        {cita.notas.length > 0 ? <Text style={styles.notasCita} numberOfLines={1}>{cita.notas}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <View style={styles.encabezado}>
        <TouchableOpacity style={styles.botonAtras} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#115e59" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Ficha del paciente</Text>
        <TouchableOpacity style={styles.botonAtras} onPress={() => setModalVisible(true)}>
          <Ionicons name="pencil" size={20} color="#115e59" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tarjetaPerfil}>
          <View style={styles.avatar}>
            <Text style={styles.textoAvatar}>{iniciales(paciente.nombre)}</Text>
          </View>
          <Text style={styles.nombre}>{paciente.nombre}</Text>
          {edad !== null ? <Text style={styles.edad}>{edad} años</Text> : null}
          {diasCumple !== null && diasCumple <= 30 ? (
            <View style={styles.insigniaCumple}>
              <Ionicons name="gift" size={14} color="#8b5cf6" />
              <Text style={styles.textoCumple}>
                {diasCumple === 0 ? 'Cumple años hoy' : `Cumple en ${diasCumple} ${diasCumple === 1 ? 'día' : 'días'}`}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.datoFila}>
            <Ionicons name="calendar-outline" size={20} color="#115e59" />
            <Text style={paciente.fechaNacimiento ? styles.datoTexto : styles.datoVacio}>
              {paciente.fechaNacimiento ? `Nació el ${fechaCorta(paciente.fechaNacimiento)} de ${paciente.fechaNacimiento.slice(0, 4)}` : 'Sin fecha de nacimiento'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.datoFila}
            disabled={!paciente.telefono}
            onPress={() => Linking.openURL(`tel:${paciente.telefono.replace(/\s/g, '')}`)}
          >
            <Ionicons name="call-outline" size={20} color="#115e59" />
            <Text style={paciente.telefono ? styles.datoEnlace : styles.datoVacio}>
              {paciente.telefono || 'Sin teléfono'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.datoFila}
            disabled={!paciente.correo}
            onPress={() => Linking.openURL(`mailto:${paciente.correo}`)}
          >
            <Ionicons name="mail-outline" size={20} color="#115e59" />
            <Text style={paciente.correo ? styles.datoEnlace : styles.datoVacio}>
              {paciente.correo || 'Sin correo'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botonPrimarioAncho} onPress={agendarCita}>
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.textoPrimario}>Agendar cita</Text>
        </TouchableOpacity>

        <Text style={styles.tituloSeccion}>Próximas citas</Text>
        <View style={styles.tarjeta}>
          {proximas.length > 0 ? proximas.map(renderCita) : <Text style={styles.vacio}>No hay citas próximas.</Text>}
        </View>

        <Text style={styles.tituloSeccion}>Historial</Text>
        <View style={styles.tarjeta}>
          {historial.length > 0 ? historial.map(renderCita) : <Text style={styles.vacio}>Aún no hay sesiones anteriores.</Text>}
        </View>

        <TouchableOpacity style={styles.botonEliminar} onPress={confirmarEliminar}>
          <Text style={styles.textoEliminar}>Eliminar paciente</Text>
        </TouchableOpacity>
      </ScrollView>

      <FormularioPaciente
        visible={modalVisible}
        paciente={paciente}
        onCerrar={() => setModalVisible(false)}
        onGuardar={guardarCambios}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7' },
  centrado: { justifyContent: 'center', alignItems: 'center' },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  botonAtras: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#1e1b4b' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  tarjetaPerfil: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  textoAvatar: { fontSize: 26, fontWeight: 'bold', color: '#115e59' },
  nombre: { fontSize: 22, fontWeight: 'bold', color: '#1e1b4b' },
  edad: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  insigniaCumple: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ede9fe', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, marginTop: 10 },
  textoCumple: { fontSize: 12, fontWeight: 'bold', color: '#6d28d9' },
  tarjeta: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  datoFila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  datoTexto: { fontSize: 15, color: '#1f2937' },
  datoEnlace: { fontSize: 15, color: '#115e59' },
  datoVacio: { fontSize: 15, color: '#9ca3af', fontStyle: 'italic' },
  tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', marginTop: 10, marginBottom: 10 },
  filaCita: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  columnaFecha: { width: 70 },
  horaCita: { fontSize: 15, fontWeight: 'bold', color: '#115e59' },
  diaCita: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  infoCita: { flex: 1 },
  tipoCita: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  notasCita: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  vacio: { textAlign: 'center', color: '#9ca3af', fontSize: 14, paddingVertical: 10 },
  botonPrimario: { backgroundColor: '#115e59', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginTop: 16 },
  botonPrimarioAncho: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#115e59', padding: 15, borderRadius: 12 },
  textoPrimario: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  botonEliminar: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: '#dc2626' },
  textoEliminar: { color: '#dc2626', fontWeight: 'bold', fontSize: 15 },
});