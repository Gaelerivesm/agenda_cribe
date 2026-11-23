import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { CitasContext, Cita, formatearFecha } from '../context/CitasContext';
import { PacientesContext, diasParaCumple, edadQueCumple } from '../context/PacientesContext';
import AgendarCitaModal from '../components/AgendarCitaModal';
import { obtenerPaleta } from '../theme/tema';
import { iniciales, fechaLarga, fechaCorta } from '../utils/utilidades';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function PantallaInicio() {
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  const context = useContext(CitasContext);
  if (!context) throw new Error('CitasContext no está disponible');
  const { citas, recargar: recargarCitas } = context;

  const pacientesContext = useContext(PacientesContext);
  if (!pacientesContext) throw new Error('PacientesContext no está disponible');
  const { pacientes, recargar: recargarPacientes } = pacientesContext;

  const [refrescando, setRefrescando] = useState(false);
  const [modalNuevaCita, setModalNuevaCita] = useState(false);

  const alRefrescar = async () => {
    setRefrescando(true);
    await Promise.all([recargarCitas(), recargarPacientes()]);
    setRefrescando(false);
  };

  const ahora = new Date();
  const hoyStr = formatearFecha(ahora);
  const horaActualStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const marcaAhora = `${hoyStr} ${horaActualStr}`;

  // Fecha legible para el encabezado (ej. Lunes, 9 de noviembre de 2026)
  const fechaTextoHoy = `${DIAS_SEMANA[ahora.getDay()]}, ${fechaLarga(hoyStr)}`;

  const { citasHoy, completadasHoy, pendientesHoy, proximaCita } = useMemo(() => {
    const hoy = citas.filter(c => c.fecha === hoyStr);
    const futuras = citas
      .filter(c => `${c.fecha} ${c.hora}` >= marcaAhora)
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

    const completadas = hoy.filter(c => `${c.fecha} ${c.hora}` < marcaAhora).length;
    const pendientes = hoy.length - completadas;

    return {
      citasHoy: hoy.length,
      completadasHoy: completadas,
      pendientesHoy: Math.max(0, pendientes),
      proximaCita: futuras[0] || null,
    };
  }, [citas, hoyStr, marcaAhora]);

  const cumpleanosProximos = useMemo(() => pacientes
    .map(paciente => ({
      paciente,
      dias: diasParaCumple(paciente.fechaNacimiento),
      edad: edadQueCumple(paciente.fechaNacimiento),
    }))
    .filter(item => item.dias !== null && item.dias <= 30)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0)), [pacientes]);

  const abrirCita = (cita: Cita) => {
    router.push({ pathname: '/notas/[citaId]', params: { citaId: cita.id, modo: 'ver' } });
  };

  const abrirNuevaCita = () => setModalNuevaCita(true);

  const inicialesDoctor = usuarioActual?.nombre ? iniciales(usuarioActual.nombre) : 'DR';

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPrincipal}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={[paleta.primaria]} tintColor={paleta.primaria} />
        }
      >
        {/* Cabecera con saludo, fecha y avatar de iniciales */}
        <View style={styles.encabezado}>
          <View style={styles.infoSaludo}>
            <Text style={styles.saludo}>Hola, {usuarioActual?.nombre || 'Profesional'}</Text>
            <Text style={styles.subtituloFecha}>{fechaTextoHoy}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBoton}
            onPress={() => router.navigate('/(tabs)/perfil')}
          >
            <Text style={styles.avatarTexto}>{inicialesDoctor}</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Resumen: Citas para hoy */}
        <View style={styles.tarjetaResumenHoy}>
          <Text style={styles.tituloResumen}>Citas para hoy: {citasHoy}</Text>
          <Text style={styles.fraseResumen}>Un día para acompañar y conectar.</Text>

          {/* Barra visual de progreso */}
          <View style={styles.barraProgresoFondo}>
            <View
              style={[
                styles.barraProgresoRelleno,
                { width: citasHoy > 0 ? `${Math.min(100, (completadasHoy / citasHoy) * 100)}%` : '0%' },
              ]}
            />
          </View>

          <View style={styles.filaMetricasProgreso}>
            <Text style={styles.textoMetricaProgreso}>{completadasHoy} completada{completadasHoy === 1 ? '' : 's'}</Text>
            <Text style={styles.textoMetricaProgreso}>{pendientesHoy} pendiente{pendientesHoy === 1 ? '' : 's'}</Text>
          </View>
        </View>

        {/* Sección: Próxima cita */}
        <Text style={styles.seccionTitulo}>Próxima cita</Text>
        {proximaCita ? (
          <TouchableOpacity style={styles.tarjetaProximaCita} onPress={() => abrirCita(proximaCita)}>
            <View style={styles.filaCabeceraCita}>
              <View style={styles.circuloReloj}>
                <Ionicons name="time-outline" size={20} color={paleta.primaria} />
              </View>
              <View style={styles.infoPacienteCita}>
                <Text style={styles.nombrePacienteCita}>{proximaCita.paciente}</Text>
                <Text style={styles.tipoCita}>{proximaCita.tipo || 'Psicología · Sesión individual'}</Text>
              </View>
            </View>

            <View style={styles.filaPieCita}>
              <Text style={styles.horaTextoCita}>{proximaCita.hora} hrs</Text>
              <View style={styles.badgeConfirmada}>
                <Text style={styles.textoBadgeConfirmada}>
                  {proximaCita.confirmada ? 'Confirmada' : 'Por confirmar'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.tarjetaVacia}>
            <Ionicons name="calendar-outline" size={28} color={paleta.textoSecundario} />
            <Text style={styles.textoTarjetaVacia}>No tienes más citas programadas por ahora.</Text>
          </View>
        )}

        {/* Sección: Próximos cumpleaños */}
        {cumpleanosProximos.length > 0 ? (
          <View style={styles.seccionCumpleanos}>
            <View style={styles.filaTituloSeccion}>
              <Text style={styles.seccionTitulo}>Próximos cumpleaños</Text>
              <Ionicons name="gift-outline" size={18} color={paleta.primaria} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollCumpleanos}>
              {cumpleanosProximos.map(({ paciente, dias, edad }) => {
                const esHoy = dias === 0;
                const textoDias = esHoy ? '¡Hoy!' : dias === 1 ? 'Mañana' : `En ${dias} días`;
                return (
                  <TouchableOpacity
                    key={paciente.id}
                    style={[styles.tarjetaCumple, esHoy && styles.tarjetaCumpleHoy]}
                    onPress={() => router.push({ pathname: '/paciente/[pacienteId]', params: { pacienteId: paciente.id } })}
                  >
                    <View style={styles.filaCabeceraCumple}>
                      <View style={[styles.avatarCumple, esHoy && styles.avatarCumpleHoy]}>
                        <Text style={[styles.textoAvatarCumple, esHoy && styles.textoAvatarCumpleHoy]}>
                          {iniciales(paciente.nombre)}
                        </Text>
                      </View>
                      <View style={[styles.badgeDias, esHoy && styles.badgeDiasHoy]}>
                        <Text style={[styles.textoBadgeDias, esHoy && styles.textoBadgeDiasHoy]}>{textoDias}</Text>
                      </View>
                    </View>
                    <Text style={styles.nombreCumple} numberOfLines={1}>{paciente.nombre}</Text>
                    <Text style={styles.detalleCumple}>
                      {fechaCorta(paciente.fechaNacimiento)}
                      {edad !== null ? ` · Cumple ${edad}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

      </ScrollView>

      {/* Botón Flotante FAB */}
      <TouchableOpacity
        style={[styles.botonFlotante, { backgroundColor: paleta.primaria }]}
        onPress={abrirNuevaCita}
        accessibilityLabel="Agendar una cita"
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal para agendar cita rápida */}
      <AgendarCitaModal
        visible={modalNuevaCita}
        fechaInicial={hoyStr}
        onCerrar={() => setModalNuevaCita(false)}
      />
    </View>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: paleta.fondo,
  },
  scrollPrincipal: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  infoSaludo: {
    flex: 1,
  },
  saludo: {
    fontSize: 22,
    fontWeight: '800',
    color: paleta.texto,
  },
  subtituloFecha: {
    fontSize: 14,
    color: paleta.textoSecundario,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  avatarBoton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: paleta.suave,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  avatarTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: paleta.primaria,
  },
  tarjetaResumenHoy: {
    backgroundColor: paleta.primaria,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: paleta.primaria,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  tituloResumen: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fraseResumen: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    marginBottom: 16,
  },
  barraProgresoFondo: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barraProgresoRelleno: {
    height: '100%',
    backgroundColor: paleta.tarjeta,
    borderRadius: 3,
  },
  filaMetricasProgreso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textoMetricaProgreso: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: paleta.texto,
    marginBottom: 12,
  },
  tarjetaProximaCita: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  filaCabeceraCita: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  circuloReloj: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.suave,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoPacienteCita: {
    flex: 1,
  },
  nombrePacienteCita: {
    fontSize: 16,
    fontWeight: '700',
    color: paleta.texto,
  },
  tipoCita: {
    fontSize: 13,
    color: paleta.textoSecundario,
    marginTop: 2,
  },
  filaPieCita: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: paleta.inputBorde,
    paddingTop: 12,
  },
  horaTextoCita: {
    fontSize: 15,
    fontWeight: '700',
    color: paleta.texto,
  },
  badgeConfirmada: {
    backgroundColor: paleta.suave,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  textoBadgeConfirmada: {
    fontSize: 12,
    fontWeight: '600',
    color: paleta.primaria,
  },
  tarjetaVacia: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: paleta.inputBorde,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  textoTarjetaVacia: {
    fontSize: 13,
    color: paleta.textoSecundario,
    marginTop: 8,
    textAlign: 'center',
  },
  seccionCumpleanos: {
    marginBottom: 24,
  },
  filaTituloSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollCumpleanos: {
    paddingVertical: 4,
    gap: 12,
  },
  tarjetaCumple: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 14,
    padding: 12,
    width: 170,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tarjetaCumpleHoy: {
    borderColor: paleta.primaria,
    backgroundColor: paleta.suave,
  },
  filaCabeceraCumple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCumple: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: paleta.inputFondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCumpleHoy: {
    backgroundColor: paleta.primaria,
  },
  textoAvatarCumple: {
    fontSize: 12,
    fontWeight: '700',
    color: paleta.textoSecundario,
  },
  textoAvatarCumpleHoy: {
    color: '#FFFFFF',
  },
  badgeDias: {
    backgroundColor: paleta.inputFondo,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDiasHoy: {
    backgroundColor: paleta.primaria,
  },
  textoBadgeDias: {
    fontSize: 11,
    fontWeight: '600',
    color: paleta.textoSecundario,
  },
  textoBadgeDiasHoy: {
    color: '#FFFFFF',
  },
  nombreCumple: {
    fontSize: 14,
    fontWeight: '700',
    color: paleta.texto,
  },
  detalleCumple: {
    fontSize: 12,
    color: paleta.textoSecundario,
    marginTop: 2,
  },
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
