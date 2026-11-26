import React, { useContext, useMemo, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Cita, CitasContext, formatearFecha } from '../context/CitasContext';
import { PacientesContext, DatosPaciente, Paciente } from '../context/PacientesContext';
import FormularioPaciente from './Formulariopaciente';
import { normalizarNombre } from '../utils/utilidades';
import { useAuth } from '../context/AuthContext';
import { obtenerPaleta } from '../theme/tema';
import { citaYaInicio } from '../utils/citas';

interface Props {
  visible: boolean;
  fechaInicial: string;
  pacienteInicial?: string;
  cita?: Cita | null;
  onCerrar: () => void;
  onGuardarCita?: (fecha: string) => void;
}

interface ContenidoProps {
  fechaInicial: string;
  pacienteInicial?: string;
  cita?: Cita | null;
  onCerrar: () => void;
  onGuardarCita?: (fecha: string) => void;
  paleta: ReturnType<typeof obtenerPaleta>;
  styles: ReturnType<typeof crearStyles>;
}

const parsearFecha = (valor: string) => {
  const resultado = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!resultado) return null;
  const fecha = new Date(Number(resultado[1]), Number(resultado[2]) - 1, Number(resultado[3]));
  return formatearFecha(fecha) === valor ? fecha : null;
};

function AgendarCitaContenido({
  fechaInicial,
  pacienteInicial,
  cita,
  onCerrar,
  onGuardarCita,
  paleta,
  styles,
}: ContenidoProps) {
  const citasContext = useContext(CitasContext);
  const pacientesContext = useContext(PacientesContext);
  if (!citasContext || !pacientesContext) throw new Error('Los contextos no están disponibles');
  const { agregarCita, editarCita, eliminarCita } = citasContext;
  const { pacientes, agregarPaciente } = pacientesContext;

  const [fecha, setFecha] = useState(cita?.fecha ?? fechaInicial);
  const [hora, setHora] = useState(cita?.hora ?? '');
  const [paciente, setPaciente] = useState(cita?.paciente ?? pacienteInicial ?? '');
  const [tipo, setTipo] = useState(cita?.tipo ?? '');
  const [notas, setNotas] = useState(cita?.notas ?? '');
  const [confirmada, setConfirmada] = useState(cita?.confirmada ?? false);
  const [selectorFechaHora, setSelectorFechaHora] = useState<'fecha' | 'hora' | null>(null);
  const [listaPacientesVisible, setListaPacientesVisible] = useState(false);
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [nuevoPacienteVisible, setNuevoPacienteVisible] = useState(false);
  const inputBusqueda = useRef<React.ElementRef<typeof TextInput>>(null);

  const pacientesFiltrados = useMemo(() => {
    const termino = normalizarNombre(busqueda);
    return pacientes
      .filter(p => !busquedaActiva || normalizarNombre(p.nombre).includes(termino))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [pacientes, busqueda, busquedaActiva]);

  const valorFechaHora = () => {
    if (selectorFechaHora === 'fecha') return parsearFecha(fecha) ?? new Date();
    const resultado = /^(\d{2}):(\d{2})$/.exec(hora);
    const valor = new Date();
    if (resultado) valor.setHours(Number(resultado[1]), Number(resultado[2]), 0, 0);
    return valor;
  };

  const cambiarFechaHora = (evento: DateTimePickerEvent, valor?: Date) => {
    if (Platform.OS === 'android') setSelectorFechaHora(null);
    if (evento.type === 'dismissed' || !valor) return;
    if (selectorFechaHora === 'fecha') setFecha(formatearFecha(valor));
    else setHora(`${String(valor.getHours()).padStart(2, '0')}:${String(valor.getMinutes()).padStart(2, '0')}`);
  };

  const guardar = () => {
    if (!paciente.trim()) {
      Alert.alert('Falta información', 'Selecciona o añade un paciente.');
      return;
    }
    if (!parsearFecha(fecha)) {
      Alert.alert('Falta información', 'Selecciona una fecha válida para la cita.');
      return;
    }
    if (!hora) {
      Alert.alert('Falta información', 'Selecciona la hora de la cita.');
      return;
    }
    if (citaYaInicio(fecha, hora)) {
      Alert.alert('Fecha u hora pasada', 'Selecciona una fecha y una hora futuras para la cita.');
      return;
    }
    const datos = {
      paciente: paciente.trim(), fecha, hora,
      tipo: tipo.trim() || 'Terapia individual',
      notas: notas.trim(), confirmada,
    };
    if (cita) {
      editarCita(cita.id, datos);
    } else {
      agregarCita(datos);
      if (!pacientes.some(p => normalizarNombre(p.nombre) === normalizarNombre(datos.paciente))) {
        agregarPaciente({ nombre: datos.paciente, pronombres: '', fechaNacimiento: '', telefono: '', correo: '' });
      }
    }
    onGuardarCita?.(fecha);
    onCerrar();
  };

  const eliminar = () => {
    if (!cita) return;
    Alert.alert('Eliminar cita', `¿Eliminar la cita de ${cita.paciente}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { eliminarCita(cita.id); onCerrar(); } },
    ]);
  };

  const guardarPaciente = (datos: DatosPaciente) => {
    agregarPaciente(datos);
    setPaciente(datos.nombre);
    setBusqueda(datos.nombre);
    setListaPacientesVisible(false);
    setBusquedaActiva(false);
    setNuevoPacienteVisible(false);
  };

  const abrirSelectorPaciente = () => {
    if (!listaPacientesVisible) {
      setListaPacientesVisible(true);
      setBusquedaActiva(false);
      setBusqueda('');
      return;
    }
    if (!busquedaActiva) {
      setBusquedaActiva(true);
      setTimeout(() => inputBusqueda.current?.focus(), 0);
      return;
    }
    inputBusqueda.current?.focus();
  };

  return (
    <>
      <Pressable style={styles.contenedor} onPress={evento => evento.stopPropagation()}>
        <ScrollView style={styles.scrollVista} contentContainerStyle={styles.scrollContenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <KeyboardAvoidingView style={styles.ajusteTeclado} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <Text style={styles.titulo}>{cita ? 'Editar cita' : 'Nueva cita'}</Text>
              <TouchableOpacity onPress={onCerrar} accessibilityLabel="Cerrar ventana">
                <Ionicons name="close" size={24} color={paleta.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={styles.filaCampos}>
              <View style={styles.mitad}>
                <Text style={styles.label}>Fecha</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setSelectorFechaHora(selectorFechaHora === 'fecha' ? null : 'fecha')}>
                  <Ionicons name="calendar-outline" size={18} color={paleta.primaria} />
                  <Text style={styles.valorSelector}>{fecha}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mitad}>
                <Text style={styles.label}>Hora</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setSelectorFechaHora(selectorFechaHora === 'hora' ? null : 'hora')}>
                  <Ionicons name="time-outline" size={18} color={paleta.primaria} />
                  <Text style={[styles.valorSelector, !hora && styles.placeholder]}>{hora || 'Seleccionar'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectorFechaHora ? (
              <View style={styles.picker}>
                <DateTimePicker
                  value={valorFechaHora()}
                  mode={selectorFechaHora === 'fecha' ? 'date' : 'time'}
                  minimumDate={!cita && selectorFechaHora === 'fecha' ? new Date() : undefined}
                  is24Hour
                  locale="es-MX"
                  display={Platform.OS === 'ios' ? (selectorFechaHora === 'fecha' ? 'inline' : 'spinner') : 'default'}
                  accentColor={paleta.primaria}
                  onChange={cambiarFechaHora}
                />
                {Platform.OS === 'ios' ? <TouchableOpacity style={styles.botonListo} onPress={() => setSelectorFechaHora(null)}><Text style={styles.textoPrimario}>Listo</Text></TouchableOpacity> : null}
              </View>
            ) : null}

            <Text style={styles.label}>Paciente</Text>
            <View style={styles.selectorPaciente}>
              <Ionicons name="search-outline" size={18} color={paleta.textoSecundario} />
              {busquedaActiva ? (
                <TextInput
                  ref={inputBusqueda}
                  style={styles.inputBusqueda}
                  placeholder="Escribe para buscar"
                  value={busqueda}
                  onChangeText={setBusqueda}
                  autoCapitalize="words"
                />
              ) : (
                <TouchableOpacity style={styles.accionSelectorPaciente} onPress={abrirSelectorPaciente}>
                  <Text style={paciente ? styles.valorSelector : styles.placeholder}>{paciente || 'Buscar o seleccionar paciente'}</Text>
                  <Ionicons name={listaPacientesVisible ? 'chevron-up' : 'chevron-down'} size={18} color={paleta.textoSecundario} />
                </TouchableOpacity>
              )}
            </View>

            {listaPacientesVisible ? (
              <View style={styles.listaPacientes}>
                <TouchableOpacity style={styles.botonAgregarPaciente} onPress={() => setNuevoPacienteVisible(true)}>
                  <Ionicons name="person-add-outline" size={17} color={paleta.primaria} />
                  <Text style={styles.textoAgregarPaciente}>Añadir paciente</Text>
                </TouchableOpacity>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.scrollPacientes}>
                  {pacientesFiltrados.map((item: Paciente) => (
                    <TouchableOpacity key={item.id} style={styles.filaPaciente} onPress={() => {
                      setPaciente(item.nombre);
                      setListaPacientesVisible(false);
                      setBusquedaActiva(false);
                      setBusqueda('');
                    }}>
                      <Text style={styles.nombrePaciente}>{item.nombre}</Text>
                      {item.nombre === paciente ? <Ionicons name="checkmark" size={18} color={paleta.primaria} /> : null}
                    </TouchableOpacity>
                  ))}
                  {pacientesFiltrados.length === 0 ? <Text style={styles.sinPacientes}>No hay pacientes que coincidan.</Text> : null}
                </ScrollView>
              </View>
            ) : null}

            <Text style={styles.label}>Tipo de cita</Text>
            <TextInput style={styles.input} value={tipo} onChangeText={setTipo} placeholder="Terapia individual" />

            <Text style={styles.label}>Notas de la sesión</Text>
            <TextInput style={[styles.input, styles.inputArea]} value={notas} onChangeText={setNotas} placeholder="Motivo de consulta, observaciones..." multiline />

            <View style={styles.filaSwitch}>
              <Text style={styles.labelSwitch}>¿Cita confirmada?</Text>
              <Switch value={confirmada} onValueChange={setConfirmada} trackColor={{ true: paleta.primaria, false: paleta.inputBorde }} />
            </View>

            <TouchableOpacity style={styles.botonGuardar} onPress={guardar}>
              <Text style={styles.textoGuardar}>{cita ? 'Guardar cambios' : 'Guardar cita'}</Text>
            </TouchableOpacity>
            {cita ? <TouchableOpacity style={styles.botonEliminar} onPress={eliminar}><Text style={styles.textoEliminar}>Eliminar cita</Text></TouchableOpacity> : null}
          </KeyboardAvoidingView>
        </ScrollView>
      </Pressable>
      <FormularioPaciente
        visible={nuevoPacienteVisible}
        onCerrar={() => setNuevoPacienteVisible(false)}
        onGuardar={guardarPaciente}
      />
    </>
  );
}

export default function AgendarCitaModal({ visible, fechaInicial, pacienteInicial, cita, onCerrar, onGuardarCita }: Props) {
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        {visible ? (
          <AgendarCitaContenido
            key={`${cita?.id ?? 'nueva'}-${fechaInicial}-${pacienteInicial ?? ''}`}
            fechaInicial={fechaInicial}
            pacienteInicial={pacienteInicial}
            cita={cita}
            onCerrar={onCerrar}
            onGuardarCita={onGuardarCita}
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
  contenedor: { height: '92%', backgroundColor: paleta.tarjeta, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 20 },
  scrollVista: { flex: 1 },
  scrollContenido: { flexGrow: 1, paddingBottom: 28 },
  ajusteTeclado: { flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: paleta.texto },
  filaCampos: { flexDirection: 'row', gap: 12 },
  mitad: { flex: 1 },
  label: { fontSize: 13, fontWeight: 'bold', color: paleta.textoSecundario, marginBottom: 6 },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, marginBottom: 14, backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde, borderRadius: 14 },
  valorSelector: { flex: 1, fontSize: 14, color: paleta.texto },
  placeholder: { flex: 1, fontSize: 14, color: paleta.textoSecundario },
  picker: { marginBottom: 14, padding: 10, backgroundColor: paleta.inputFondo, borderRadius: 16 },
  botonListo: { alignItems: 'center', padding: 8 },
  textoPrimario: { color: paleta.primaria, fontWeight: 'bold' },
  selectorPaciente: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, marginBottom: 8, backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde, borderRadius: 14 },
  accionSelectorPaciente: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 46, gap: 10 },
  inputBusqueda: { flex: 1, paddingVertical: 10, color: paleta.texto },
  listaPacientes: { borderWidth: 1, borderColor: paleta.inputBorde, borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
  botonAgregarPaciente: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: paleta.inputBorde },
  textoAgregarPaciente: { color: paleta.primaria, fontWeight: '700', fontSize: 13 },
  scrollPacientes: { maxHeight: 180 },
  filaPaciente: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: paleta.inputBorde },
  nombrePaciente: { color: paleta.texto, fontSize: 14 },
  sinPacientes: { padding: 14, color: paleta.textoSecundario, fontSize: 13 },
  input: { minHeight: 46, paddingHorizontal: 12, marginBottom: 14, backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde, borderRadius: 14, color: paleta.texto },
  inputArea: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  labelSwitch: { fontSize: 14, fontWeight: 'bold', color: paleta.textoSecundario },
  botonGuardar: { alignItems: 'center', backgroundColor: paleta.primaria, padding: 15, borderRadius: 14, marginTop: 12 },
  textoGuardar: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  botonEliminar: { alignItems: 'center', padding: 14, marginTop: 8 },
  textoEliminar: { color: '#dc2626', fontWeight: '700' },
});
