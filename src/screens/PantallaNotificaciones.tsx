import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita, formatearFecha } from '../context/CitasContext';
import { PacientesContext, Paciente, diasParaCumple, edadQueCumple } from '../context/PacientesContext';
import { marcaAhora, marcaTiempo, etiquetaRelativa, fechaCorta } from '../utils/utilidades';
import { useAuth } from '../context/AuthContext';
import { obtenerPaleta } from '../theme/tema';

type NombreIcono = keyof typeof Ionicons.glyphMap;

interface CumpleProximo {
  paciente: Paciente;
  dias: number;
  edad: number | null;
}

export default function PantallaNotificaciones() {
  const insets = useSafeAreaInsets();
  const { usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  const citasContext = useContext(CitasContext);
  const pacientesContext = useContext(PacientesContext);
  if (!citasContext || !pacientesContext) throw new Error('Los contextos no están disponibles');
  const { citas, editarCita } = citasContext;
  const { pacientes } = pacientesContext;
  const [citaPendienteConfirmacion, setCitaPendienteConfirmacion] = useState<Cita | null>(null);

  const { citasHoy, porConfirmar, cumpleanos } = useMemo(() => {
    const ahora = marcaAhora();
    const hoyStr = formatearFecha(new Date());
    const futuras = citas
      .filter(c => marcaTiempo(c.fecha, c.hora) >= ahora)
      .sort((a, b) => marcaTiempo(a.fecha, a.hora).localeCompare(marcaTiempo(b.fecha, b.hora)));

    const cumples: CumpleProximo[] = pacientes
      .map(p => ({ paciente: p, dias: diasParaCumple(p.fechaNacimiento), edad: edadQueCumple(p.fechaNacimiento) }))
      .filter((c): c is CumpleProximo => c.dias !== null && c.dias <= 30)
      .sort((a, b) => a.dias - b.dias);

    return {
      citasHoy: futuras.filter(c => c.fecha === hoyStr),
      porConfirmar: futuras.filter(c => !c.confirmada).slice(0, 10),
      cumpleanos: cumples,
    };
  }, [citas, pacientes]);

  const abrirCita = (cita: Cita) => {
    router.push({ pathname: '/notas/[citaId]', params: { citaId: cita.id, modo: 'ver' } });
  };

  const abrirPaciente = (id: string) => {
    router.push({ pathname: '/paciente/[pacienteId]', params: { pacienteId: id } });
  };

  const confirmarCita = () => {
    if (!citaPendienteConfirmacion) return;
    const cita = citaPendienteConfirmacion;
    const { id, ...resto } = cita;
    editarCita(id, { ...resto, confirmada: true });
    setCitaPendienteConfirmacion(null);
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
        <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
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
            <Ionicons name="checkmark-done-circle-outline" size={56} color={paleta.textoSecundario} />
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
                paleta.primaria,
                paleta.suave,
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
                paleta.primaria,
                paleta.suave,
                c.paciente,
                `${etiquetaRelativa(c.fecha)}, ${c.hora} · ${c.tipo}`,
                () => abrirCita(c),
                { texto: 'Confirmar', alPresionar: () => setCitaPendienteConfirmacion(c) }
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
                paleta.primaria,
                paleta.suave,
                c.paciente.nombre,
                `${fechaCorta(c.paciente.fechaNacimiento)} · ${textoCumple(c.dias)}`,
                () => abrirPaciente(c.paciente.id)
              )
            )}
          </View>
        ) : null}
      </ScrollView>
      <Modal
        visible={citaPendienteConfirmacion !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCitaPendienteConfirmacion(null)}
      >
        <View style={styles.fondoModal}>
          <View style={styles.dialogoConfirmacion}>
            <View style={styles.iconoConfirmacion}>
              <Ionicons name="checkmark-circle-outline" size={32} color={paleta.primaria} />
            </View>
            <Text style={styles.tituloConfirmacion}>¿Confirmar esta cita?</Text>
            <Text style={styles.detalleConfirmacion}>
              {citaPendienteConfirmacion
                ? `${citaPendienteConfirmacion.paciente}\n${etiquetaRelativa(citaPendienteConfirmacion.fecha)}, ${citaPendienteConfirmacion.hora} · ${citaPendienteConfirmacion.tipo}`
                : ''}
            </Text>
            <View style={styles.accionesConfirmacion}>
              <TouchableOpacity
                style={styles.botonCancelarConfirmacion}
                onPress={() => setCitaPendienteConfirmacion(null)}
                accessibilityRole="button"
              >
                <Text style={styles.textoCancelarConfirmacion}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonAceptarConfirmacion}
                onPress={confirmarCita}
                accessibilityRole="button"
              >
                <Text style={styles.textoAceptarConfirmacion}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: paleta.fondo },
  encabezado: { paddingHorizontal: 20, marginBottom: 16 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: paleta.texto },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  seccion: { marginBottom: 22 },
  tituloSeccion: { fontSize: 16, fontWeight: 'bold', color: paleta.texto, marginBottom: 12 },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: paleta.tarjeta,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
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
    borderColor: paleta.borde,
  },
  infoTarjeta: { flex: 1 },
  tituloTarjeta: { fontSize: 15, fontWeight: 'bold', color: paleta.texto },
  detalleTarjeta: { fontSize: 13, color: paleta.textoSecundario, marginTop: 2 },
  botonAccion: {
    backgroundColor: paleta.primaria,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  textoAccion: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialogoConfirmacion: { width: '100%', maxWidth: 380, backgroundColor: paleta.tarjeta, borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: paleta.borde, elevation: 8 },
  iconoConfirmacion: { width: 58, height: 58, borderRadius: 29, backgroundColor: paleta.suave, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  tituloConfirmacion: { fontSize: 19, fontWeight: 'bold', color: paleta.texto, textAlign: 'center' },
  detalleConfirmacion: { fontSize: 14, color: paleta.textoSecundario, textAlign: 'center', lineHeight: 21, marginTop: 8 },
  accionesConfirmacion: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 22 },
  botonCancelarConfirmacion: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde },
  textoCancelarConfirmacion: { color: paleta.texto, fontSize: 14, fontWeight: '600' },
  botonAceptarConfirmacion: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: paleta.primaria },
  textoAceptarConfirmacion: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  vacioContenedor: { alignItems: 'center', marginTop: 80 },
  vacioTitulo: { fontSize: 18, fontWeight: 'bold', color: paleta.textoSecundario, marginTop: 12 },
  vacioTexto: { fontSize: 14, color: paleta.textoSecundario, marginTop: 4 },
});
