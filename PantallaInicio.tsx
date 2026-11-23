import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { CitasContext, Cita, formatearFecha } from './CitasContext';
import { PacientesContext } from './PacientesContext';
import { diasParaCumple, edadQueCumple } from './PacientesContext';
import AgendarCitaModal from './AgendarCitaModal';
import { obtenerPaleta } from './tema';
import { iniciales, fechaLarga, fechaCorta } from './utilidades';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function PantallaInicio() {
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta);
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
            <Ionicons name="calendar-outline" size={28} color="#9ca3af" />
            <Text style={styles.textoVacio}>No tienes citas pendientes para hoy.</Text>
          </View>
        )}

        <Text style={styles.seccionTitulo}>Cumpleaños en los próximos 30 días</Text>
        {cumpleanosProximos.length > 0 ? (
          <View style={styles.tarjetaCumpleanos}>
            {cumpleanosProximos.map(({ paciente, dias, edad }) => (
              <TouchableOpacity
                key={paciente.id}
                style={styles.filaCumpleanos}
                onPress={() => router.push({ pathname: '/paciente/[pacienteId]', params: { pacienteId: paciente.id } })}
              >
                <View style={styles.iconoCumpleanos}>
                  <Ionicons name="gift-outline" size={19} color={paleta.primaria} />
                </View>
                <View style={styles.infoCumpleanos}>
                  <Text style={styles.nombrePacienteCumpleanos}>{paciente.nombre}</Text>
                  <Text style={styles.detalleCumpleanos}>{fechaCorta(paciente.fechaNacimiento)} · cumple {edad ?? ''} años</Text>
                </View>
                <Text style={styles.diasCumpleanos}>{dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.tarjetaVacia}>
            <Ionicons name="gift-outline" size={25} color="#9ca3af" />
            <Text style={styles.textoVacio}>No hay cumpleaños durante los próximos 30 días.</Text>
          </View>
        )}
      </ScrollView>

      {/* Botón Flotante FAB en Magenta */}
      <TouchableOpacity style={[styles.botonFlotante, { backgroundColor: paleta.primaria }]} onPress={abrirNuevaCita} accessibilityLabel="Agendar una cita">
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

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
    backgroundColor: '#FAFAFA',
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
    marginTop: 4,
  },
  infoSaludo: {
    flex: 1,
    paddingRight: 12,
  },
  saludo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtituloFecha: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 3,
  },
  avatarBoton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: paleta.borde,
  },
  avatarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: paleta.primaria,
  },
  tarjetaResumenHoy: {
    backgroundColor: paleta.suave,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  tituloResumen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  fraseResumen: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 14,
  },
  barraProgresoFondo: {
    height: 6,
    backgroundColor: paleta.borde,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barraProgresoRelleno: {
    height: '100%',
    backgroundColor: paleta.primaria,
    borderRadius: 3,
  },
  filaMetricasProgreso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textoMetricaProgreso: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  tarjetaProximaCita: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filaCabeceraCita: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  circuloReloj: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoPacienteCita: {
    flex: 1,
  },
  nombrePacienteCita: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  tipoCita: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  filaPieCita: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  horaTextoCita: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  badgeConfirmada: {
    backgroundColor: paleta.suave,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  textoBadgeConfirmada: {
    fontSize: 12,
    fontWeight: 'bold',
    color: paleta.primaria,
  },
  tarjetaVacia: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  tarjetaCumpleanos: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  filaCumpleanos: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  iconoCumpleanos: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCumpleanos: { flex: 1 },
  nombrePacienteCumpleanos: { color: '#111827', fontSize: 14, fontWeight: '700' },
  detalleCumpleanos: { color: '#6b7280', fontSize: 11, marginTop: 4 },
  diasCumpleanos: { color: paleta.primaria, fontSize: 11, fontWeight: '700', marginLeft: 6 },
  textoVacio: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  gridAcciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  botonAccionGrid: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  iconoAccionContenedor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  textoAccionGrid: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
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
