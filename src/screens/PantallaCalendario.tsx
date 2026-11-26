import React, { useState, useRef, useContext, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita, formatearFecha } from '../context/CitasContext';
import AgendarCitaModal from '../components/AgendarCitaModal';
import FormularioPaciente from '../components/Formulariopaciente';
import BotonAccionesRapidas from '../components/BotonAccionesRapidas';
import { PacientesContext } from '../context/PacientesContext';
import { obtenerPaleta } from '../theme/tema';
import { useAuth } from '../context/AuthContext';
import { obtenerEstadoCita } from '../utils/citas';

type Vista = 'Semana' | 'Mes' | 'Año';
type TipoAnimacion = 'izquierda' | 'derecha';

const VISTAS: Vista[] = ['Semana', 'Mes', 'Año'];
const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const LETRAS_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const HORAS_DIA = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const ANCHO_PANTALLA = Dimensions.get('window').width;

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

const etiquetaFechaLarga = (fecha: Date, hoyStr: string) => {
  const base = `${NOMBRES_DIAS[fecha.getDay()]}, ${fecha.getDate()} de ${NOMBRES_MESES[fecha.getMonth()].toLowerCase()}`;
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
  const [traslacionX] = useState(() => new Animated.Value(0));
  const [opacidad] = useState(() => new Animated.Value(1));
  const ocupado = useRef(false);

  const animar = useCallback((tipo: TipoAnimacion, cambio: () => void) => {
    if (ocupado.current) return;
    ocupado.current = true;
    const salidaX = tipo === 'izquierda' ? -ANCHO_PANTALLA * 0.25 : tipo === 'derecha' ? ANCHO_PANTALLA * 0.25 : 0;
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(traslacionX, { toValue: salidaX, duration: 110, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) {
        traslacionX.setValue(0);
        opacidad.setValue(1);
        ocupado.current = false;
        return;
      }
      cambio();
      traslacionX.setValue(-salidaX);
      Animated.parallel([
        Animated.timing(opacidad, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(traslacionX, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished: termino }) => {
        if (!termino) {
          traslacionX.setValue(0);
          opacidad.setValue(1);
        }
        ocupado.current = false;
      });
    });
  }, [opacidad, traslacionX]);

  const estilo = useMemo(() => ({ opacity: opacidad, transform: [{ translateX: traslacionX }] }), [opacidad, traslacionX]);
  return useMemo(() => ({ animar, estilo }), [animar, estilo]);
}

export default function PantallaCalendario() {
  const route = useLocalSearchParams<{ nuevaCita?: string; paciente?: string }>();
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  const context = useContext(CitasContext);
  if (!context) throw new Error('CitasContext no está disponible');
  const { citas } = context;
  const pacientesContext = useContext(PacientesContext);
  if (!pacientesContext) throw new Error('PacientesContext no está disponible');
  const { agregarPaciente } = pacientesContext;

  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const hoy = ahora;
  const hoyStr = formatearFecha(hoy);

  const [fechaActiva, setFechaActiva] = useState<Date>(hoy);
  const [vistaActiva, setVistaActiva] = useState<Vista>('Semana');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalPacienteVisible, setModalPacienteVisible] = useState(false);
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null);
  const [pacienteInicialModal, setPacienteInicialModal] = useState<string | undefined>(undefined);

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

  const moverDias = useCallback((n: number) =>
    setFechaActiva(p => new Date(p.getFullYear(), p.getMonth(), p.getDate() + n)), [setFechaActiva]);
  const moverMeses = useCallback((n: number) =>
    setFechaActiva(p => new Date(p.getFullYear(), p.getMonth() + n, 1)), [setFechaActiva]);
  const moverAnios = useCallback((n: number) =>
    setFechaActiva(p => new Date(p.getFullYear() + n, 0, 1)), [setFechaActiva]);
  const moverPeriodo = useCallback((n: number) => {
    if (vistaActiva === 'Semana') moverDias(7 * n);
    else if (vistaActiva === 'Mes') moverMeses(n);
    else moverAnios(n);
  }, [vistaActiva, moverDias, moverMeses, moverAnios]);

  const cambiarPeriodoAnimado = useCallback((n: number) => {
    transVista.animar(n < 0 ? 'derecha' : 'izquierda', () => moverPeriodo(n));
  }, [moverPeriodo, transVista]);

  const panFranja = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) {
            transLista.animar('izquierda', () => {});
            transFranja.animar('izquierda', () => moverDias(7));
          } else if (g.dx > 50) {
            transLista.animar('derecha', () => {});
            transFranja.animar('derecha', () => moverDias(-7));
          }
        },
      }),
    [transLista, transFranja, moverDias]
  );

  const panLista = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) transLista.animar('izquierda', () => moverDias(1));
          else if (g.dx > 50) transLista.animar('derecha', () => moverDias(-1));
        },
      }),
    [transLista, moverDias]
  );

  const panGeneral = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => {
          const dir = g.dx < -50 ? 1 : g.dx > 50 ? -1 : 0;
          if (dir === 0) return;
          const tipo: TipoAnimacion = dir === 1 ? 'izquierda' : 'derecha';
          transVista.animar(tipo, () => {
            moverPeriodo(dir);
          });
        },
      }),
    [transVista, moverPeriodo]
  );

  const cambiarVista = (nueva: Vista, fechaDestino?: Date) => {
    if (nueva === vistaActiva && !fechaDestino) return;
    const tipo: TipoAnimacion = VISTAS.indexOf(nueva) > VISTAS.indexOf(vistaActiva) ? 'izquierda' : 'derecha';
    transVista.animar(tipo, () => {
      setVistaActiva(nueva);
      if (fechaDestino) setFechaActiva(fechaDestino);
    });
  };

  const abrirModalNueva = (paciente?: string) => {
    setCitaEditando(null);
    setPacienteInicialModal(paciente);
    setModalVisible(true);
  };

  const abrirModalEditar = (cita: Cita) => {
    setCitaEditando(cita);
    setModalVisible(true);
  };

  useEffect(() => {
    if (route.nuevaCita === 'true') {
      const paciente = typeof route.paciente === 'string' ? route.paciente : undefined;
      router.setParams({ nuevaCita: undefined, paciente: undefined });
      setTimeout(() => {
        abrirModalNueva(paciente);
      }, 0);
    }
  }, [route.nuevaCita, route.paciente]);

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
                  <Text style={[styles.letraDia, seleccionado && styles.letraDiaSeleccionada]}>
                    {LETRAS_DIA[dia.getDay()]}
                  </Text>
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
                        <View key={cita.id} style={styles.tarjetaCitaTimeline}>
                          <View style={styles.barraLateralCita} />
                          <View style={styles.infoCitaTimeline}>
                            <View style={styles.filaBadgeHora}>
                              <Text style={styles.horaExactaCita}>{cita.hora} hrs</Text>
                              <View style={styles.badgeEstado}>
                                <Text style={[styles.textoBadgeEstado, {
                                  color: obtenerEstadoCita(cita.fecha, cita.hora, ahora) === 'En curso'
                                    ? '#047857'
                                    : obtenerEstadoCita(cita.fecha, cita.hora, ahora) === 'Cita pasada'
                                    ? paleta.textoSecundario
                                    : '#B45309',
                                }]}>
                                  {obtenerEstadoCita(cita.fecha, cita.hora, ahora)}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.nombrePacienteCitaTimeline}>{cita.paciente}</Text>
                            <Text style={styles.tipoCitaTimeline}>{cita.tipo}</Text>
                            {cita.notas.length > 0 ? (
                              <Text style={styles.notasCitaTimeline} numberOfLines={1}>{cita.notas}</Text>
                            ) : null}
                          </View>
                          <View style={styles.accionesCitaTimeline}>
                            <TouchableOpacity
                              style={styles.botonAccionIcono}
                              onPress={() => router.push({ pathname: '/notas/[citaId]', params: { citaId: cita.id, modo: 'ver' } })}
                            >
                              <Ionicons name="eye-outline" size={18} color={paleta.primaria} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.botonAccionIcono}
                              onPress={() => abrirModalEditar(cita)}
                            >
                              <Ionicons name="pencil-outline" size={18} color={paleta.primaria} />
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
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d, index) => (
            <Text key={index} style={styles.textoCabeceraDia}>{d}</Text>
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
      {/* Encabezado: TU AGENDA / Noviembre 2026 */}
      <View style={styles.encabezadoPrincipal}>
        <View>
          <Text style={styles.etiquetaSuperior}>TU AGENDA</Text>
          <View style={styles.filaTituloNavegacion}>
            <Text style={styles.tituloFechaMes}>
              {vistaActiva !== 'Año' ? `${NOMBRES_MESES[fechaActiva.getMonth()]} ` : ''}
              <Text style={styles.tituloAnio}>{fechaActiva.getFullYear()}</Text>
            </Text>
            <View style={styles.controlesFlechas}>
              <TouchableOpacity onPress={() => cambiarPeriodoAnimado(-1)} style={styles.botonFlecha}>
                <Ionicons name="chevron-back" size={18} color={paleta.textoSecundario} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => cambiarPeriodoAnimado(1)} style={styles.botonFlecha}>
                <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Selector de Vista: Semana | Mes | Año */}
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

      {/* FAB Magenta */}
      <BotonAccionesRapidas paleta={paleta} style={styles.botonFlotante} onPress={() => abrirModalNueva()} onAgregarCita={() => abrirModalNueva()} onAgregarPaciente={() => setModalPacienteVisible(true)} />

      <AgendarCitaModal
        visible={modalVisible}
        fechaInicial={fechaActivaStr}
        pacienteInicial={pacienteInicialModal}
        cita={citaEditando}
        onCerrar={() => setModalVisible(false)}
        onGuardarCita={fecha => {
          const seleccionada = parsearFecha(fecha);
          if (seleccionada) setFechaActiva(seleccionada);
        }}
      />
      <FormularioPaciente visible={modalPacienteVisible} onCerrar={() => setModalPacienteVisible(false)} onGuardar={datos => { agregarPaciente(datos); setModalPacienteVisible(false); }} />
    </View>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  flex: { flex: 1 },
  contenedor: { flex: 1, backgroundColor: paleta.fondo },
  encabezadoPrincipal: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  etiquetaSuperior: {
    fontSize: 11,
    fontWeight: 'bold',
    color: paleta.textoSecundario,
    letterSpacing: 1,
    marginBottom: 2,
  },
  filaTituloNavegacion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloFechaMes: {
    fontSize: 24,
    fontWeight: 'bold',
    color: paleta.texto,
  },
  tituloAnio: {
    color: paleta.primaria,
  },
  controlesFlechas: {
    flexDirection: 'row',
    gap: 8,
  },
  botonFlecha: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: paleta.tarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: paleta.inputBorde,
  },
  selectorVista: {
    flexDirection: 'row',
    backgroundColor: paleta.inputFondo,
    borderRadius: 16,
    padding: 3,
  },
  botonVista: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: 'center',
  },
  botonVistaActivo: {
    backgroundColor: paleta.tarjeta,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  textoVista: {
    fontSize: 13,
    color: paleta.textoSecundario,
    fontWeight: '600',
  },
  textoVistaActivo: {
    color: paleta.primaria,
    fontWeight: 'bold',
  },

  contenedorFranja: {
    borderBottomWidth: 1,
    borderBottomColor: paleta.inputBorde,
    paddingBottom: 12,
  },
  franjaSemana: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  columnaDia: {
    alignItems: 'center',
    width: 44,
  },
  letraDia: {
    fontSize: 12,
    color: paleta.textoSecundario,
    marginBottom: 8,
    fontWeight: '600',
  },
  letraDiaSeleccionada: {
    color: paleta.primaria,
  },
  circuloDia: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circuloSeleccionado: {
    backgroundColor: paleta.primaria,
  },
  numeroDia: {
    fontSize: 15,
    fontWeight: '500',
    color: paleta.texto,
  },
  numeroHoy: {
    color: paleta.primaria,
    fontWeight: 'bold',
  },
  numeroSeleccionado: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  contenedorPuntos: {
    flexDirection: 'row',
    marginTop: 5,
    height: 5,
    justifyContent: 'center',
    gap: 3,
  },
  punto: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: paleta.primaria,
  },
  etiquetaFecha: {
    fontSize: 13,
    fontWeight: 'bold',
    color: paleta.textoSecundario,
    paddingHorizontal: 20,
    marginVertical: 12,
  },

  scrollTimeline: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  filaHora: {
    flexDirection: 'row',
    minHeight: 70,
    alignItems: 'flex-start',
  },
  textoHora: {
    width: 50,
    fontSize: 12,
    fontWeight: '500',
    color: paleta.textoSecundario,
    marginTop: 8,
  },
  contenedorCita: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: paleta.inputBorde,
  },
  tarjetaCitaTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paleta.suave,
    borderRadius: 16,
    marginVertical: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  barraLateralCita: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: paleta.primaria,
    borderRadius: 2,
    marginRight: 12,
  },
  infoCitaTimeline: {
    flex: 1,
  },
  filaBadgeHora: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  horaExactaCita: {
    fontSize: 12,
    color: paleta.primaria,
    fontWeight: 'bold',
  },
  badgeEstado: {
    backgroundColor: paleta.suave,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  textoBadgeEstado: {
    fontSize: 11,
    fontWeight: 'bold',
    color: paleta.primaria,
  },
  nombrePacienteCitaTimeline: {
    fontSize: 15,
    fontWeight: 'bold',
    color: paleta.texto,
  },
  tipoCitaTimeline: {
    fontSize: 12,
    color: paleta.textoSecundario,
    marginTop: 2,
  },
  notasCitaTimeline: {
    fontSize: 11,
    color: paleta.textoSecundario,
    marginTop: 2,
  },
  accionesCitaTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  botonAccionIcono: {
    backgroundColor: paleta.tarjeta,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  lineaLibre: {
    height: 1,
    backgroundColor: paleta.inputFondo,
    marginTop: 18,
  },

  cabeceraSemana: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  textoCabeceraDia: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: paleta.textoSecundario,
    fontWeight: 'bold',
  },
  filaMes: {
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  celdaMes: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    paddingTop: 4,
  },
  circuloMes: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numeroMes: {
    fontSize: 15,
    color: paleta.texto,
  },

  cuadriculaAnio: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 110,
  },
  miniMes: {
    width: '31%',
    marginBottom: 20,
    backgroundColor: paleta.tarjeta,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
  },
  miniMesTitulo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: paleta.primaria,
    marginBottom: 6,
  },
  miniFila: { flexDirection: 'row' },
  miniCabecera: { flex: 1, fontSize: 8, color: paleta.textoSecundario, textAlign: 'center', marginBottom: 2 },
  miniCelda: { flex: 1, height: 16, alignItems: 'center', justifyContent: 'center' },
  miniCirculo: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  miniNumero: { fontSize: 8, color: paleta.texto },

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

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContenedor: { backgroundColor: paleta.tarjeta, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: paleta.texto },
  filaInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  mitadInput: { width: '48%' },
  label: { fontSize: 13, fontWeight: 'bold', color: paleta.textoSecundario, marginBottom: 5 },
  input: { backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde, borderRadius: 14, padding: 12, marginBottom: 14, color: paleta.texto },
  inputArea: { height: 90, textAlignVertical: 'top' },
  campoSelector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  campoActivo: { borderColor: paleta.primaria },
  textoSelector: { fontSize: 14, color: paleta.texto },
  textoPlaceholder: { color: paleta.textoSecundario },
  contenedorPicker: { marginBottom: 14, backgroundColor: paleta.inputFondo, borderRadius: 14, padding: 8 },
  botonListo: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16 },
  textoBotonListo: { color: paleta.primaria, fontWeight: 'bold', fontSize: 15 },
  filaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  labelSwitch: { fontSize: 14, fontWeight: 'bold', color: paleta.texto },
  botonGuardar: { backgroundColor: paleta.primaria, padding: 15, borderRadius: 14, alignItems: 'center' },
  textoBotonGuardar: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  botonEliminar: { padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 10, marginBottom: 20, borderWidth: 1, borderColor: '#dc2626' },
  textoBotonEliminar: { color: '#dc2626', fontWeight: 'bold', fontSize: 15 },
  espacioFinal: { height: 20 },
});
