import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { CitasContext, Cita, formatearFecha } from './CitasContext';
import { PacientesContext } from './PacientesContext';
import { RootTabParamList } from './tiposNavegacion';
import FormularioPaciente from './Formulariopaciente';
import { iniciales, fechaLarga } from './utilidades';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function PantallaInicio() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();

  const context = useContext(CitasContext);
  if (!context) throw new Error('CitasContext no está disponible');
  const { citas, recargar: recargarCitas } = context;

  const pacientesContext = useContext(PacientesContext);
  if (!pacientesContext) throw new Error('PacientesContext no está disponible');
  const { pacientes, agregarPaciente, recargar: recargarPacientes } = pacientesContext;

  const [refrescando, setRefrescando] = useState(false);
  const [modalNuevoPaciente, setModalNuevoPaciente] = useState(false);

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

  const abrirCita = (cita: Cita) => {
    navigation.navigate('Calendario', { screen: 'NotasSesion', params: { cita, modo: 'ver' } });
  };

  const abrirNuevaCita = () => {
    navigation.navigate('Calendario', { screen: 'VistaCalendario', params: { nuevaCita: true } });
  };

  const inicialesDoctor = usuarioActual?.nombre ? iniciales(usuarioActual.nombre) : 'DR';

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPrincipal}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={['#B80065']} tintColor="#B80065" />
        }
      >
        {/* Cabecera con saludo, fecha y avatar de iniciales */}
        <View style={styles.encabezado}>
          <View style={styles.infoSaludo}>
            <Text style={styles.saludo}>Hola, {usuarioActual?.nombre || 'Dr. Alejandro'}</Text>
            <Text style={styles.subtituloFecha}>{fechaTextoHoy}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBoton}
            onPress={() => navigation.navigate('Perfil')}
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
                <Ionicons name="time-outline" size={20} color="#B80065" />
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

        {/* Acciones Rápidas (Grid 2x2 funcional) */}
        <View style={styles.gridAcciones}>
          {/* Botón 1: Nuevo Paciente */}
          <TouchableOpacity
            style={styles.botonAccionGrid}
            onPress={() => setModalNuevoPaciente(true)}
          >
            <View style={styles.iconoAccionContenedor}>
              <Ionicons name="person-add-outline" size={22} color="#B80065" />
            </View>
            <Text style={styles.textoAccionGrid}>Nuevo paciente</Text>
          </TouchableOpacity>

          {/* Botón 2: Agendar Cita */}
          <TouchableOpacity
            style={styles.botonAccionGrid}
            onPress={abrirNuevaCita}
          >
            <View style={styles.iconoAccionContenedor}>
              <Ionicons name="calendar-outline" size={22} color="#B80065" />
            </View>
            <Text style={styles.textoAccionGrid}>Agendar cita</Text>
          </TouchableOpacity>

          {/* Botón 3: Calendario */}
          <TouchableOpacity
            style={styles.botonAccionGrid}
            onPress={() => navigation.navigate('Calendario')}
          >
            <View style={styles.iconoAccionContenedor}>
              <Ionicons name="calendar" size={22} color="#B80065" />
            </View>
            <Text style={styles.textoAccionGrid}>Calendario</Text>
          </TouchableOpacity>

          {/* Botón 4: Notificaciones */}
          <TouchableOpacity
            style={styles.botonAccionGrid}
            onPress={() => navigation.navigate('Notificaciones')}
          >
            <View style={styles.iconoAccionContenedor}>
              <Ionicons name="notifications-outline" size={22} color="#B80065" />
            </View>
            <Text style={styles.textoAccionGrid}>Notificaciones</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botón Flotante FAB en Magenta */}
      <TouchableOpacity style={styles.botonFlotante} onPress={abrirNuevaCita}>
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal interactivo de creación de paciente */}
      <FormularioPaciente
        visible={modalNuevoPaciente}
        onCerrar={() => setModalNuevoPaciente(false)}
        onGuardar={datos => {
          agregarPaciente(datos);
          setModalNuevoPaciente(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FCE7F3',
  },
  avatarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B80065',
  },
  tarjetaResumenHoy: {
    backgroundColor: '#FDF2F8',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FCE7F3',
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
    backgroundColor: '#FCE7F3',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barraProgresoRelleno: {
    height: '100%',
    backgroundColor: '#B80065',
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
    backgroundColor: '#FDF2F8',
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
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  textoBadgeConfirmada: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B80065',
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
    backgroundColor: '#FDF2F8',
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
    backgroundColor: '#B80065',
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#B80065',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
