import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita, formatearFecha } from '../context/CitasContext';
import { PacientesContext, DatosPaciente, calcularEdad, diasParaCumple } from '../context/PacientesContext';
import FormularioPaciente from '../components/Formulariopaciente';
import AgendarCitaModal from '../components/AgendarCitaModal';
import { normalizarNombre, iniciales, fechaCorta, marcaAhora, marcaTiempo, etiquetaRelativa } from '../utils/utilidades';
import { useAuth } from '../context/AuthContext';
import { obtenerPaleta } from '../theme/tema';

export default function PantallaFichaPaciente() {
  const route = useLocalSearchParams<{ pacienteId: string }>();
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  const citasContext = useContext(CitasContext);
  const pacientesContext = useContext(PacientesContext);
  if (!citasContext || !pacientesContext) throw new Error('Los contextos no están disponibles');
  const { citas, editarCita } = citasContext;
  const { pacientes, editarPaciente, eliminarPaciente } = pacientesContext;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCitaVisible, setModalCitaVisible] = useState(false);

  const paciente = pacientes.find(p => p.id === route.pacienteId);

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
        <TouchableOpacity style={styles.botonPrimario} onPress={() => router.back()}>
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
            router.back();
          },
        },
      ]
    );
  };

  const abrirCita = (cita: Cita) => {
    router.push({ pathname: '/notas/[citaId]', params: { citaId: cita.id, modo: 'ver' } });
  };

  const agendarCita = () => {
    setModalCitaVisible(true);
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
      <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      {/* Cabecera con volver y editar */}
      <View style={styles.encabezado}>
        <TouchableOpacity style={styles.botonIcono} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={paleta.texto} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Perfil del paciente</Text>
        <TouchableOpacity style={styles.botonIcono} onPress={() => setModalVisible(true)}>
          <Ionicons name="pencil" size={20} color={paleta.texto} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de perfil con avatar grande */}
        <View style={styles.tarjetaPerfil}>
          <View style={styles.avatar}>
            <Text style={styles.textoAvatar}>{iniciales(paciente.nombre)}</Text>
          </View>
          <Text style={styles.nombre}>{paciente.nombre}</Text>
          {edad !== null ? <Text style={styles.edad}>{edad} años</Text> : null}

          {diasCumple !== null ? (
            <View style={styles.insigniaCumple}>
              <Ionicons name="gift-outline" size={14} color={paleta.primaria} />
              <Text style={styles.textoCumple}>
                {diasCumple === 0 ? 'Cumpleaños hoy' : `Cumpleaños en ${diasCumple} ${diasCumple === 1 ? 'día' : 'días'}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Tarjeta de datos de contacto */}
        <View style={styles.tarjeta}>
          <View style={styles.datoFila}>
            <Ionicons name="calendar-outline" size={20} color={paleta.primaria} />
            <View style={styles.infoDato}>
              <Text style={styles.etiquetaDato}>Fecha de nacimiento</Text>
              <Text style={paciente.fechaNacimiento ? styles.datoTexto : styles.datoVacio}>
                {paciente.fechaNacimiento ? `${fechaCorta(paciente.fechaNacimiento)} de ${paciente.fechaNacimiento.slice(0, 4)}` : 'Sin fecha registrada'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.datoFila}
            disabled={!paciente.telefono}
            onPress={() => Linking.openURL(`tel:${paciente.telefono.replace(/\s/g, '')}`)}
          >
            <Ionicons name="call-outline" size={20} color={paleta.primaria} />
            <View style={styles.infoDato}>
              <Text style={styles.etiquetaDato}>Teléfono</Text>
              <Text style={paciente.telefono ? styles.datoEnlace : styles.datoVacio}>
                {paciente.telefono || 'Sin teléfono'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.datoFila}
            disabled={!paciente.correo}
            onPress={() => Linking.openURL(`mailto:${paciente.correo}`)}
          >
            <Ionicons name="mail-outline" size={20} color={paleta.primaria} />
            <View style={styles.infoDato}>
              <Text style={styles.etiquetaDato}>Correo electrónico</Text>
              <Text style={paciente.correo ? styles.datoEnlace : styles.datoVacio}>
                {paciente.correo || 'Sin correo'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botón grande Agendar Cita */}
        <TouchableOpacity style={styles.botonAgendarPrincipal} onPress={agendarCita}>
          <Ionicons name="calendar-outline" size={20} color="#ffffff" style={styles.iconoBotonAgendar} />
          <Text style={styles.textoBotonAgendar}>Agendar cita</Text>
        </TouchableOpacity>

        {/* Sección: Próximas citas */}
        <Text style={styles.tituloSeccion}>Próximas citas</Text>
        <View style={styles.tarjeta}>
          {proximas.length > 0 ? (
            proximas.map(renderCita)
          ) : (
            <Text style={styles.vacio}>Sin citas programadas</Text>
          )}
        </View>

        {/* Sección: Historial */}
        <Text style={styles.tituloSeccion}>Historial</Text>
        <View style={styles.tarjeta}>
          {historial.length > 0 ? (
            historial.map(renderCita)
          ) : (
            <Text style={styles.vacio}>Aún no hay sesiones anteriores.</Text>
          )}
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
      <AgendarCitaModal
        visible={modalCitaVisible}
        fechaInicial={formatearFecha(new Date())}
        pacienteInicial={paciente.nombre}
        onCerrar={() => setModalCitaVisible(false)}
      />
    </View>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: paleta.fondo },
  centrado: { justifyContent: 'center', alignItems: 'center' },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  botonIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.tarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: paleta.inputBorde,
  },
  titulo: { fontSize: 18, fontWeight: 'bold', color: paleta.texto },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  tarjetaPerfil: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: paleta.borde,
  },
  textoAvatar: { fontSize: 26, fontWeight: 'bold', color: paleta.primaria },
  nombre: { fontSize: 22, fontWeight: 'bold', color: paleta.texto },
  edad: { fontSize: 13, color: paleta.textoSecundario, marginTop: 2 },
  insigniaCumple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: paleta.suave,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  textoCumple: { fontSize: 12, fontWeight: 'bold', color: paleta.primaria },
  tarjeta: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  datoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: paleta.inputBorde,
  },
  infoDato: {
    flex: 1,
  },
  etiquetaDato: {
    fontSize: 11,
    color: paleta.textoSecundario,
    fontWeight: '600',
  },
  datoTexto: { fontSize: 14, color: paleta.texto, marginTop: 2 },
  datoEnlace: { fontSize: 14, color: paleta.texto, fontWeight: '500', marginTop: 2 },
  datoVacio: { fontSize: 13, color: paleta.textoSecundario, fontStyle: 'italic', marginTop: 2 },
  botonAgendarPrincipal: {
    backgroundColor: paleta.primaria,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: paleta.primaria,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconoBotonAgendar: {
    marginRight: 8,
  },
  textoBotonAgendar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tituloSeccion: { fontSize: 16, fontWeight: 'bold', color: paleta.texto, marginBottom: 10 },
  filaCita: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: paleta.inputBorde,
  },
  columnaFecha: { width: 70 },
  horaCita: { fontSize: 14, fontWeight: 'bold', color: paleta.primaria },
  diaCita: { fontSize: 11, color: paleta.textoSecundario, marginTop: 2 },
  infoCita: { flex: 1 },
  tipoCita: { fontSize: 13, fontWeight: '600', color: paleta.texto },
  notasCita: { fontSize: 11, color: paleta.textoSecundario, marginTop: 2 },
  vacio: { textAlign: 'center', color: paleta.textoSecundario, fontSize: 13, paddingVertical: 12 },
  botonPrimario: { backgroundColor: paleta.primaria, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, marginTop: 16 },
  textoPrimario: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  botonEliminar: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  textoEliminar: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
});
