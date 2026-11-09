import React, { useState, useRef, useContext, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Switch,
  Animated, PanResponder, Dimensions, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CitasContext, Cita, formatearFecha } from './CitasContext';
import { PacientesContext } from './PacientesContext';
import { CalendarioStackParamList } from './tiposNavegacion';
import { normalizarNombre } from './utilidades';

type Vista = 'Semana' | 'Mes' | 'Año';
type TipoAnimacion = 'izquierda' | 'derecha' | 'acercar' | 'alejar';
type Direccion = 1 | -1;

const VISTAS: Vista[] = ['Semana', 'Mes', 'Año'];
const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const LETRAS_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const HORAS_DIA = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const ANCHO_PANTALLA = Dimensions.get('window').width;

const COLOR_PRIMARIO = '#115e59';
const COLOR_OSCURO = '#1e1b4b';
const COLOR_FONDO = '#fdfbf7';

const parsearFecha = (texto: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const fecha = new Date(anio, mes - 1, dia);
  const valida = fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
  return valida ? fecha : null;
};

const formatearHora = (fecha: Date) =>
  `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;

const etiquetaFechaLarga = (fecha: Date, hoyStr: string) => {
  const base = `${NOMBRES_DIAS[fecha.getDay()]} ${fecha.getDate()} de ${NOMBRES_MESES[fecha.getMonth()].toLowerCase()}`;
  return formatearFecha(fecha) === hoyStr ? `Hoy · ${base}` : base;
};

const construirFilasMes = (anio: number, mes: number): (number | null)[][] => {
  const primerDia = new Date(anio, mes, 1).getDay();
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);
  const filas: (number | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) filas.push(celdas.slice(i, i + 7));
  return filas;
};

function useTransicion() {
  const traslacionX = useRef(new Animated.Value(0)).current;
  const opacidad = useRef(new Animated.Value(1)).current;
  const escala = useRef(new Animated.Value(1)).current;
  const ocupado = useRef(false);

  const animar = (tipo: TipoAnimacion, cambio: () => void) => {
    if (ocupado.current) {
      cambio();
      return;
    }
    ocupado.current = true;
    const salidaX = tipo === 'izquierda' ? -ANCHO_PANTALLA * 0.25 : tipo === 'derecha' ? ANCHO_PANTALLA * 0.25 : 0;
    const escalaSalida = tipo === 'acercar' ? 0.9 : tipo === 'alejar' ? 1.1 : 1;
    const escalaEntrada = tipo === 'acercar' ? 1.12 : tipo === 'alejar' ? 0.9 : 1;

    Animated.parallel([
      Animated.timing(opacidad, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(traslacionX, { toValue: salidaX, duration: 110, useNativeDriver: true }),
      Animated.timing(escala, { toValue: escalaSalida, duration: 110, useNativeDriver: true }),
    ]).start(() => {
      cambio();
      traslacionX.setValue(-salidaX);
      escala.setValue(escalaEntrada);
      Animated.parallel([
        Animated.timing(opacidad, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(traslacionX, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(escala, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        ocupado.current = false;
      });
    });
  };

  const estilo = { opacity: opacidad, transform: [{ translateX: traslacionX }, { scale: escala }] };
  return { animar, estilo };
}

const crearPan = (accion: React.MutableRefObject<(direccion: Direccion) => void>) =>
  PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) =>
      Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -50) accion.current(1);
      else if (g.dx > 50) accion.current(-1);
    },
  });

export default function PantallaCalendario() {
  const navigation = useNavigation<NavigationProp<CalendarioStackParamList>>();
  const route = useRoute<RouteProp<CalendarioStackParamList, 'VistaCalendario'>>();
  const insets = useSafeAreaInsets();

  const context = useContext(CitasContext);
  if (!context) throw new Error('CitasContext no está disponible');
  const { citas, agregarCita, editarCita, eliminarCita } = context;

  const pacientesContext = useContext(PacientesContext);
  if (!pacientesContext) throw new Error('PacientesContext no está disponible');
  const { pacientes, agregarPaciente } = pacientesContext;

  const hoy = new Date();
  const hoyStr = formatearFecha(hoy);

  const [fechaActiva, setFechaActiva] = useState<Date>(hoy);
  const [vistaActiva, setVistaActiva] = useState<Vista>('Semana');

  const [modalVisible, setModalVisible] = useState(false);
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null);
  const [formFecha, setFormFecha] = useState('');
  const [formHora, setFormHora] = useState('');
  const [formPaciente, setFormPaciente] = useState('');
  const [formTipo, setFormTipo] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [formConfirmada, setFormConfirmada] = useState(false);
  const [selector, setSelector] = useState<'fecha' | 'hora' | null>(null);

  const fechaActivaStr = formatearFecha(fechaActiva);

  const citasPorFecha = useMemo(() => {
    const mapa: Record<string, Cita[]> = {};
    citas.forEach(c => {
      if (!mapa[c.fecha]) mapa[c.fecha] = [];
      mapa[c.fecha].push(c);
    });
    Object.values(mapa).forEach(lista => lista.sort((a, b) => a.hora.localeCompare(b.hora)));
    return mapa;
  }, [citas]);

  const citasDelDia = citasPorFecha[fechaActivaStr] ?? [];

  const transVista = useTransicion();
  const transFranja = useTransicion();
  const transLista = useTransicion();

  const moverDias = (n: number) =>
    setFechaActiva(p => new Date(p.getFullYear(), p.getMonth(), p.getDate() + n));
  const moverMeses = (n: number) =>
    setFechaActiva(p => new Date(p.getFullYear(), p.getMonth() + n, 1));
  const moverAnios = (n: number) =>
    setFechaActiva(p => new Date(p.getFullYear() + n, 0, 1));

  const tipoDeslizar = (d: Direccion): TipoAnimacion => (d === 1 ? 'izquierda' : 'derecha');

  const deslizarFranja = useRef<(d: Direccion) => void>(() => {});
  const deslizarLista = useRef<(d: Direccion) => void>(() => {});
  const deslizarGeneral = useRef<(d: Direccion) => void>(() => {});

  deslizarFranja.current = (d: Direccion) => {
    transLista.animar(tipoDeslizar(d), () => {});
    transFranja.animar(tipoDeslizar(d), () => moverDias(7 * d));
  };
  deslizarLista.current = (d: Direccion) => {
    transLista.animar(tipoDeslizar(d), () => moverDias(d));
  };
  deslizarGeneral.current = (d: Direccion) => {
    transVista.animar(tipoDeslizar(d), () => {
      if (vistaActiva === 'Mes') moverMeses(d);
      else moverAnios(d);
    });
  };

  const panFranja = useRef(crearPan(deslizarFranja)).current;
  const panLista = useRef(crearPan(deslizarLista)).current;
  const panGeneral = useRef(crearPan(deslizarGeneral)).current;

  const cambiarVista = (nueva: Vista, fechaDestino?: Date) => {
    if (nueva === vistaActiva && !fechaDestino) return;
    const tipo: TipoAnimacion = VISTAS.indexOf(nueva) > VISTAS.indexOf(vistaActiva) ? 'alejar' : 'acercar';
    transVista.animar(tipo, () => {
      setVistaActiva(nueva);
      if (fechaDestino) setFechaActiva(fechaDestino);
    });
  };

  const abrirModalNueva = (pacienteInicial?: string) => {
    setCitaEditando(null);
    setFormFecha(fechaActivaStr);
    setFormHora('');
    setFormPaciente(pacienteInicial ?? '');
    setFormTipo('');
    setFormNotas('');
    setFormConfirmada(false);
    setSelector(null);
    setModalVisible(true);
  };

  const abrirModalEditar = (cita: Cita) => {
    setCitaEditando(cita);
    setFormFecha(cita.fecha);
    setFormHora(cita.hora);
    setFormPaciente(cita.paciente);
    setFormTipo(cita.tipo);
    setFormNotas(cita.notas);
    setFormConfirmada(cita.confirmada);
    setSelector(null);
    setModalVisible(true);
  };

  useEffect(() => {
    if (route.params?.nuevaCita) {
      abrirModalNueva(route.params.paciente);
      navigation.setParams({ nuevaCita: false, paciente: undefined });
    }
  }, [route.params?.nuevaCita]);

  const valorSelector = (): Date => {
    if (selector === 'fecha') return parsearFecha(formFecha) ?? new Date();
    const m = /^(\d{2}):(\d{2})$/.exec(formHora);
    const d = new Date();
    if (m) d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d;
  };

  const alCambiarSelector = (evento: DateTimePickerEvent, valor?: Date) => {
    if (Platform.OS === 'android') setSelector(null);
    if (evento.type === 'dismissed' || !valor) return;
    if (selector === 'fecha') setFormFecha(formatearFecha(valor));
    else if (selector === 'hora') setFormHora(formatearHora(valor));
  };

  const manejarGuardar = () => {
    if (!formPaciente.trim()) {
      Alert.alert('Falta información', 'Escribe el nombre del paciente.');
      return;
    }
    const fecha = parsearFecha(formFecha);
    if (!fecha) {
      Alert.alert('Falta información', 'Selecciona la fecha de la cita.');
      return;
    }
    if (!formHora) {
      Alert.alert('Falta información', 'Selecciona la hora de la cita.');
      return;
    }

    const datos = {
      paciente: formPaciente.trim(),
      fecha: formatearFecha(fecha),
      hora: formHora,
      tipo: formTipo.trim() || 'Terapia individual',
      notas: formNotas.trim(),
      confirmada: formConfirmada,
    };

    if (citaEditando) {
      editarCita(citaEditando.id, datos);
    } else {
      agregarCita(datos);
      const existe = pacientes.some(p => normalizarNombre(p.nombre) === normalizarNombre(datos.paciente));
      if (!existe) agregarPaciente({ nombre: datos.paciente, fechaNacimiento: '', telefono: '', correo: '' });
    }

    setFechaActiva(fecha);
    setModalVisible(false);
  };

  const manejarEliminar = () => {
    if (!citaEditando) return;
    Alert.alert('Eliminar cita', `¿Eliminar la cita de ${citaEditando.paciente}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          eliminarCita(citaEditando.id);
          setModalVisible(false);
        },
      },
    ]);
  };

  const renderPuntos = (fechaStr: string) => {
    const cantidad = Math.min((citasPorFecha[fechaStr] ?? []).length, 3);
    return (
      <View style={styles.contenedorPuntos}>
        {Array.from({ length: cantidad }).map((_, i) => (
          <View key={i} style={styles.punto} />
        ))}
      </View>
    );
  };

  const renderSemana = () => {
    const inicioSemana = new Date(fechaActiva.getFullYear(), fechaActiva.getMonth(), fechaActiva.getDate() - fechaActiva.getDay());
    const dias = Array.from({ length: 7 }).map((_, i) =>
      new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate() + i)
    );

    return (
      <View style={styles.flex}>
        <View style={styles.contenedorFranja}>
          <Animated.View style={[styles.franjaSemana, transFranja.estilo]} {...panFranja.panHandlers}>
            {dias.map((dia, index) => {
              const str = formatearFecha(dia);
              const seleccionado = str === fechaActivaStr;
              const esHoy = str === hoyStr;
              return (
                <TouchableOpacity key={index} style={styles.columnaDia} onPress={() => setFechaActiva(dia)}>
                  <Text style={[styles.letraDia, seleccionado && styles.letraDiaSeleccionada]}>{LETRAS_DIA[dia.getDay()]}</Text>
                  <View style={[styles.circuloDia, seleccionado && styles.circuloSeleccionado]}>
                    <Text
                      style={[
                        styles.numeroDia,
                        esHoy && !seleccionado && styles.numeroHoy,
                        seleccionado && styles.numeroSeleccionado,
                      ]}
                    >
                      {dia.getDate()}
                    </Text>
                  </View>
                  {renderPuntos(str)}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </View>

        <Animated.View style={[styles.flex, transLista.estilo]} {...panLista.panHandlers}>
          <Text style={styles.etiquetaFecha}>{etiquetaFechaLarga(fechaActiva, hoyStr)}</Text>

          <ScrollView contentContainerStyle={styles.scrollTimeline} showsVerticalScrollIndicator={false}>
            {HORAS_DIA.map(hora => {
              const prefijo = hora.slice(0, 2);
              const citasHora = citasDelDia.filter(c => c.hora.slice(0, 2) === prefijo);
              return (
                <View key={hora} style={styles.filaHora}>
                  <Text style={styles.textoHora}>{hora}</Text>
                  <View style={styles.contenedorCita}>
                    {citasHora.length > 0 ? (
                      citasHora.map(cita => (
                        <View key={cita.id} style={styles.tarjetaCita}>
                          <View style={styles.barraLateral} />
                          <View style={styles.infoCita}>
                            <Text style={styles.nombrePaciente}>
                              {cita.paciente} <Text style={styles.horaExacta}>{cita.hora}</Text>
                            </Text>
                            <Text style={styles.tipoCita}>{cita.tipo}</Text>
                            {cita.notas.length > 0 ? (
                              <Text style={styles.notasCita} numberOfLines={1}>{cita.notas}</Text>
                            ) : null}
                          </View>
                          <View style={styles.accionesCita}>
                            {cita.confirmada ? (
                              <Ionicons name="checkmark-circle" size={18} color="#10b981" style={styles.iconoConfirmada} />
                            ) : null}
                            <TouchableOpacity
                              style={styles.botonAccion}
                              onPress={() => navigation.navigate('NotasSesion', { cita, modo: 'ver' })}
                            >
                              <Ionicons name="eye-outline" size={20} color={COLOR_PRIMARIO} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.botonAccion} onPress={() => abrirModalEditar(cita)}>
                              <Ionicons name="pencil-outline" size={20} color={COLOR_PRIMARIO} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.lineaLibre} />
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  const renderMes = () => {
    const anio = fechaActiva.getFullYear();
    const mes = fechaActiva.getMonth();
    const filas = construirFilasMes(anio, mes);

    return (
      <View style={styles.flex}>
        <View style={styles.cabeceraSemana}>
          {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(d => (
            <Text key={d} style={styles.textoCabeceraDia}>{d}</Text>
          ))}
        </View>
        {filas.map((fila, i) => (
          <View key={i} style={styles.filaMes}>
            {fila.map((dia, j) => {
              if (dia === null) return <View key={j} style={styles.celdaMes} />;
              const fecha = new Date(anio, mes, dia);
              const str = formatearFecha(fecha);
              const seleccionado = str === fechaActivaStr;
              const esHoy = str === hoyStr;
              return (
                <TouchableOpacity key={j} style={styles.celdaMes} onPress={() => cambiarVista('Semana', fecha)}>
                  <View style={[styles.circuloMes, seleccionado && styles.circuloSeleccionado]}>
                    <Text
                      style={[
                        styles.numeroMes,
                        esHoy && !seleccionado && styles.numeroHoy,
                        seleccionado && styles.numeroSeleccionado,
                      ]}
                    >
                      {dia}
                    </Text>
                  </View>
                  {renderPuntos(str)}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderMiniMes = (indiceMes: number) => {
    const anio = fechaActiva.getFullYear();
    const filas = construirFilasMes(anio, indiceMes);
    return (
      <TouchableOpacity
        key={indiceMes}
        style={styles.miniMes}
        onPress={() => cambiarVista('Mes', new Date(anio, indiceMes, 1))}
      >
        <Text style={styles.miniMesTitulo}>{NOMBRES_MESES[indiceMes].slice(0, 3)}</Text>
        <View style={styles.miniFila}>
          {LETRAS_DIA.map((l, i) => (
            <Text key={i} style={styles.miniCabecera}>{l}</Text>
          ))}
        </View>
        {filas.map((fila, i) => (
          <View key={i} style={styles.miniFila}>
            {fila.map((dia, j) => {
              const esHoy = dia !== null && dia === hoy.getDate() && indiceMes === hoy.getMonth() && anio === hoy.getFullYear();
              return (
                <View key={j} style={styles.miniCelda}>
                  {dia !== null ? (
                    <View style={[styles.miniCirculo, esHoy && styles.circuloSeleccionado]}>
                      <Text style={[styles.miniNumero, esHoy && styles.numeroSeleccionado]}>{dia}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  const renderAnio = () => (
    <ScrollView contentContainerStyle={styles.cuadriculaAnio} showsVerticalScrollIndicator={false}>
      {Array.from({ length: 12 }).map((_, i) => renderMiniMes(i))}
    </ScrollView>
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <View style={styles.encabezado}>
        <Text style={styles.tituloFecha}>
          {vistaActiva !== 'Año' ? `${NOMBRES_MESES[fechaActiva.getMonth()]} ` : ''}
          <Text style={styles.tituloAnio}>{fechaActiva.getFullYear()}</Text>
        </Text>
        <View style={styles.selectorVista}>
          {VISTAS.map(vista => (
            <TouchableOpacity
              key={vista}
              style={[styles.botonVista, vistaActiva === vista && styles.botonVistaActivo]}
              onPress={() => cambiarVista(vista)}
            >
              <Text style={[styles.textoVista, vistaActiva === vista && styles.textoVistaActivo]}>{vista}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Animated.View style={[styles.flex, transVista.estilo]}>
        {vistaActiva === 'Semana' ? renderSemana() : (
          <View style={styles.flex} {...panGeneral.panHandlers}>
            {vistaActiva === 'Mes' ? renderMes() : renderAnio()}
          </View>
        )}
      </Animated.View>

      <TouchableOpacity style={styles.botonFlotante} onPress={() => abrirModalNueva()}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalFondo}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContenedor}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{citaEditando ? 'Editar cita' : 'Nueva cita'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.filaInputs}>
                <View style={styles.mitadInput}>
                  <Text style={styles.label}>Fecha</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.campoSelector, selector === 'fecha' && styles.campoActivo]}
                    onPress={() => setSelector(selector === 'fecha' ? null : 'fecha')}
                  >
                    <Ionicons name="calendar-outline" size={18} color={COLOR_PRIMARIO} />
                    <Text style={styles.textoSelector}>{formFecha}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mitadInput}>
                  <Text style={styles.label}>Hora</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.campoSelector, selector === 'hora' && styles.campoActivo]}
                    onPress={() => setSelector(selector === 'hora' ? null : 'hora')}
                  >
                    <Ionicons name="time-outline" size={18} color={COLOR_PRIMARIO} />
                    <Text style={[styles.textoSelector, formHora === '' && styles.textoPlaceholder]}>
                      {formHora === '' ? 'Seleccionar' : formHora}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {selector !== null ? (
                <View style={styles.contenedorPicker}>
                  <DateTimePicker
                    value={valorSelector()}
                    mode={selector === 'fecha' ? 'date' : 'time'}
                    is24Hour
                    locale="es-MX"
                    display={Platform.OS === 'ios' ? (selector === 'fecha' ? 'inline' : 'spinner') : 'default'}
                    accentColor={COLOR_PRIMARIO}
                    onChange={alCambiarSelector}
                  />
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity style={styles.botonListo} onPress={() => setSelector(null)}>
                      <Text style={styles.textoBotonListo}>Listo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.label}>Paciente</Text>
              <TextInput style={styles.input} value={formPaciente} onChangeText={setFormPaciente} placeholder="Nombre del paciente" />

              <Text style={styles.label}>Tipo de cita</Text>
              <TextInput style={styles.input} value={formTipo} onChangeText={setFormTipo} placeholder="Terapia individual" />

              <Text style={styles.label}>Notas de la sesión</Text>
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={formNotas}
                onChangeText={setFormNotas}
                placeholder="Motivo de consulta, observaciones..."
                multiline
              />

              <View style={styles.filaSwitch}>
                <Text style={styles.labelSwitch}>¿Cita confirmada?</Text>
                <Switch
                  value={formConfirmada}
                  onValueChange={setFormConfirmada}
                  trackColor={{ true: COLOR_PRIMARIO, false: '#d1d5db' }}
                />
              </View>

              <TouchableOpacity style={styles.botonGuardar} onPress={manejarGuardar}>
                <Text style={styles.textoBotonGuardar}>{citaEditando ? 'Guardar cambios' : 'Guardar cita'}</Text>
              </TouchableOpacity>

              {citaEditando ? (
                <TouchableOpacity style={styles.botonEliminar} onPress={manejarEliminar}>
                  <Text style={styles.textoBotonEliminar}>Eliminar cita</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.espacioFinal} />
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenedor: { flex: 1, backgroundColor: COLOR_FONDO },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  tituloFecha: { fontSize: 26, fontWeight: 'bold', color: COLOR_OSCURO },
  tituloAnio: { color: COLOR_PRIMARIO },
  selectorVista: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 20, padding: 4 },
  botonVista: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  botonVistaActivo: { backgroundColor: '#ffffff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  textoVista: { fontSize: 12, color: '#6b7280', fontWeight: 'bold' },
  textoVistaActivo: { color: COLOR_PRIMARIO },

  contenedorFranja: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 12 },
  franjaSemana: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 },
  columnaDia: { alignItems: 'center', width: 44 },
  letraDia: { fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: '600' },
  letraDiaSeleccionada: { color: COLOR_PRIMARIO },
  circuloDia: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  circuloSeleccionado: { backgroundColor: COLOR_PRIMARIO },
  numeroDia: { fontSize: 16, fontWeight: '500', color: COLOR_OSCURO },
  numeroHoy: { color: COLOR_PRIMARIO, fontWeight: 'bold' },
  numeroSeleccionado: { color: '#ffffff', fontWeight: 'bold' },
  contenedorPuntos: { flexDirection: 'row', marginTop: 5, height: 5, justifyContent: 'center', gap: 3 },
  punto: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLOR_PRIMARIO },
  etiquetaFecha: { fontSize: 13, fontWeight: 'bold', color: '#6b7280', paddingHorizontal: 20, marginVertical: 12 },

  scrollTimeline: { paddingHorizontal: 20, paddingBottom: 110 },
  filaHora: { flexDirection: 'row', minHeight: 65, alignItems: 'flex-start' },
  textoHora: { width: 50, fontSize: 12, fontWeight: '500', color: '#9ca3af', marginTop: 10 },
  contenedorCita: { flex: 1, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#e5e7eb' },
  tarjetaCita: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, marginVertical: 5, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  barraLateral: { width: 4, alignSelf: 'stretch', backgroundColor: COLOR_PRIMARIO, borderRadius: 2, marginRight: 12 },
  infoCita: { flex: 1 },
  nombrePaciente: { fontSize: 15, fontWeight: 'bold', color: COLOR_OSCURO },
  horaExacta: { fontSize: 12, color: COLOR_PRIMARIO, fontWeight: 'bold' },
  tipoCita: { fontSize: 13, color: COLOR_PRIMARIO, marginTop: 2 },
  notasCita: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  accionesCita: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconoConfirmada: { marginRight: 2 },
  botonAccion: { backgroundColor: '#f3f4f6', padding: 7, borderRadius: 8 },
  lineaLibre: { height: 1, backgroundColor: '#f3f4f6', marginTop: 20 },

  cabeceraSemana: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 8 },
  textoCabeceraDia: { flex: 1, textAlign: 'center', fontSize: 10, color: '#9ca3af', fontWeight: 'bold' },
  filaMes: { flexDirection: 'row', paddingHorizontal: 15 },
  celdaMes: { flex: 1, height: 64, alignItems: 'center', paddingTop: 4 },
  circuloMes: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  numeroMes: { fontSize: 16, color: COLOR_OSCURO },

  cuadriculaAnio: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 110 },
  miniMes: { width: '31%', marginBottom: 22 },
  miniMesTitulo: { fontSize: 14, fontWeight: 'bold', color: COLOR_PRIMARIO, marginBottom: 6 },
  miniFila: { flexDirection: 'row' },
  miniCabecera: { flex: 1, fontSize: 8, color: '#9ca3af', textAlign: 'center', marginBottom: 2 },
  miniCelda: { flex: 1, height: 16, alignItems: 'center', justifyContent: 'center' },
  miniCirculo: { width: 15, height: 15, borderRadius: 7.5, alignItems: 'center', justifyContent: 'center' },
  miniNumero: { fontSize: 8, color: COLOR_OSCURO },

  botonFlotante: { position: 'absolute', bottom: 20, right: 20, backgroundColor: COLOR_PRIMARIO, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContenedor: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: COLOR_OSCURO },
  filaInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  mitadInput: { width: '48%' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#6b7280', marginBottom: 5 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 14, color: COLOR_OSCURO },
  inputArea: { height: 90, textAlignVertical: 'top' },
  campoSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  campoActivo: { borderColor: COLOR_PRIMARIO },
  textoSelector: { fontSize: 14, color: COLOR_OSCURO },
  textoPlaceholder: { color: '#9ca3af' },
  contenedorPicker: { marginBottom: 14, backgroundColor: '#f9fafb', borderRadius: 14, padding: 8 },
  botonListo: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16 },
  textoBotonListo: { color: COLOR_PRIMARIO, fontWeight: 'bold', fontSize: 15 },
  filaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  labelSwitch: { fontSize: 14, fontWeight: 'bold', color: COLOR_OSCURO },
  botonGuardar: { backgroundColor: COLOR_PRIMARIO, padding: 15, borderRadius: 12, alignItems: 'center' },
  textoBotonGuardar: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  botonEliminar: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20, borderWidth: 1, borderColor: '#dc2626' },
  textoBotonEliminar: { color: '#dc2626', fontWeight: 'bold', fontSize: 15 },
  espacioFinal: { height: 20 },
});
