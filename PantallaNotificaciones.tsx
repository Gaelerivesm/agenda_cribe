import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita, formatearFecha } from './CitasContext';
import { PacientesContext, Paciente, diasParaCumple, edadQueCumple } from './PacientesContext';
import { RootTabParamList } from './tiposNavegacion';
import { marcaAhora, marcaTiempo, etiquetaRelativa, fechaCorta } from './utilidades';

type NombreIcono = keyof typeof Ionicons.glyphMap;

interface CumpleProximo {
  paciente: Paciente;
  dias: number;
  edad: number | null;
}

export default function PantallaNotificaciones() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const insets = useSafeAreaInsets();

  const citasContext = useContext(CitasContext);
  const pacientesContext = useContext(PacientesContext);
  if (!citasContext || !pacientesContext) throw new Error('Los contextos no están disponibles');
  const { citas, editarCita } = citasContext;
  const { pacientes } = pacientesContext;

  const { citasHoy, porConfirmar, cumpleanos } = useMemo(() => {
    const ahora = marcaAhora();
    const hoyStr = formatearFecha(new Date());
    const futuras = citas
      .filter(c => marcaTiempo(c.fecha, c.hora) >= ahora)
      .sort((a, b) => marcaTiempo(a.fecha, a.hora).localeCompare(marcaTiempo(b.fecha, b.hora)));

    const cumples: CumpleProximo[] = pacientes
      .map(p => ({ paciente: p, dias: diasParaCumple(p.fechaNacimiento), edad: edadQueCumple(p.fechaNacimiento) }))
      .filter((c): c is CumpleProximo => c.dias !== null && c.dias <= 14)
      .sort((a, b) => a.dias - b.dias);

    return {
      citasHoy: futuras.filter(c => c.fecha === hoyStr),
      porConfirmar: futuras.filter(c => !c.confirmada).slice(0, 10),
      cumpleanos: cumples,
    };
  }, [citas, pacientes]);

  const abrirCita = (cita: Cita) => {
    navigation.navigate('Calendario', { screen: 'NotasSesion', params: { cita, modo: 'ver' } });
  };

  const abrirPaciente = (id: string) => {
    navigation.navigate('Pacientes', { screen: 'FichaPaciente', params: { pacienteId: id } });
  };

  const confirmarCita = (cita: Cita) => {
    const { id, ...resto } = cita;
    editarCita(id, { ...resto, confirmada: true });
  };

  const textoCumple = (dias: number) => {
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    return `En ${dias} días`;
  };

  const renderTarjeta = (
    clave: string,
    icono: NombreIcono,
    colorIcono: string,
    colorFondo: string,
    titulo: string,
    detalle: string,
    alPresionar: () => void,
    accion?: { texto: string; alPresionar: () => void }
  ) => (
    <TouchableOpacity key={clave} style={styles.tarjeta} onPress={alPresionar}>
      <View style={[styles.circuloIcono, { backgroundColor: colorFondo }]}>
        <Ionicons name={icono} size={20} color={colorIcono} />
      </View>
      <View style={styles.infoTarjeta}>
        <Text style={styles.tituloTarjeta}>{titulo}</Text>
        <Text style={styles.detalleTarjeta}>{detalle}</Text>
      </View>
      {accion ? (
        <TouchableOpacity style={styles.botonAccion} onPress={accion.alPresionar}>
          <Text style={styles.textoAccion}>{accion.texto}</Text>
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  const hayNotificaciones = citasHoy.length + porConfirmar.length + cumpleanos.length > 0;

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Notificaciones</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!hayNotificaciones ? (
          <View style={styles.vacioContenedor}>
            <Ionicons name="checkmark-done-circle-outline" size={56} color="#9ca3af" />
            <Text style={styles.vacioTitulo}>Estás al día</Text>
            <Text style={styles.vacioTexto}>No tienes recordatorios pendientes.</Text>
          </View>
        ) : null}

        {citasHoy.length > 0 ? (
          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Citas de hoy</Text>
            {citasHoy.map(c =>
              renderTarjeta(
                `hoy-${c.id}`,
                'time-outline',
                '#B80065',
                '#FDF2F8',
                `${c.hora} hrs`,
                `${c.paciente} · ${c.tipo}`,
                () => abrirCita(c)
              )
            )}
          </View>
        ) : null}

        {porConfirmar.length > 0 ? (
          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Por confirmar</Text>
            {porConfirmar.map(c =>
              renderTarjeta(
                `conf-${c.id}`,
                'alert-circle-outline',
                '#B80065',
                '#FDF2F8',
                c.paciente,
                `${etiquetaRelativa(c.fecha)}, ${c.hora} · ${c.tipo}`,
                () => abrirCita(c),
                { texto: 'Confirmar', alPresionar: () => confirmarCita(c) }
              )
            )}
          </View>
        ) : null}

        {cumpleanos.length > 0 ? (
          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Cumpleaños</Text>
            {cumpleanos.map(c =>
              renderTarjeta(
                `cumple-${c.paciente.id}`,
                'gift-outline',
                '#B80065',
                '#FDF2F8',
                c.paciente.nombre,
                `${fechaCorta(c.paciente.fechaNacimiento)} · ${textoCumple(c.dias)}`,
                () => abrirPaciente(c.paciente.id)
              )
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#FAFAFA' },
  encabezado: { paddingHorizontal: 20, marginBottom: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  seccion: { marginBottom: 22 },
  tituloSeccion: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
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
  circuloIcono: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  infoTarjeta: { flex: 1 },
  tituloTarjeta: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  detalleTarjeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  botonAccion: {
    backgroundColor: '#B80065',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  textoAccion: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  vacioContenedor: { alignItems: 'center', marginTop: 80 },
  vacioTitulo: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 12 },
  vacioTexto: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
});
