import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CitasContext, Cita, formatearFecha } from './CitasContext';
import { PacientesContext, diasParaCumple, edadQueCumple } from './PacientesContext';
import { RootTabParamList } from './tiposNavegacion';
import { fechaCorta } from './utilidades';

const NOMBRES_MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const etiquetaDia = (fecha: string, hoyStr: string, mananaStr: string) => {
  if (fecha === hoyStr) return 'Hoy';
  if (fecha === mananaStr) return 'Mañana';
  const [, mes, dia] = fecha.split('-').map(Number);
  return `${dia} ${NOMBRES_MESES_CORTOS[mes - 1]}`;
};

export default function PantallaInicio() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const insets = useSafeAreaInsets();

  const context = useContext(CitasContext);
  if (!context) throw new Error('CitasContext no está disponible');
  const { citas, recargar: recargarCitas } = context;

  const pacientesContext = useContext(PacientesContext);
  if (!pacientesContext) throw new Error('PacientesContext no está disponible');
  const { pacientes, recargar: recargarPacientes } = pacientesContext;

  const [refrescando, setRefrescando] = useState(false);

  const alRefrescar = async () => {
    setRefrescando(true);
    await Promise.all([recargarCitas(), recargarPacientes()]);
    setRefrescando(false);
  };

  const ahora = new Date();
  const hoyStr = formatearFecha(ahora);
  const mananaStr = formatearFecha(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1));
  const marcaAhora = `${hoyStr} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

  const { citasHoy, totalPacientes, recordatorios, proximasCitas } = useMemo(() => {
    const futuras = citas
      .filter(c => `${c.fecha} ${c.hora}` >= marcaAhora)
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
    return {
      citasHoy: citas.filter(c => c.fecha === hoyStr).length,
      totalPacientes: pacientes.length,
      recordatorios: futuras.filter(c => !c.confirmada).length,
      proximasCitas: futuras,
    };
  }, [citas, pacientes, hoyStr, marcaAhora]);

  const cumpleanos = useMemo(
    () =>
      pacientes
        .map(p => ({ paciente: p, dias: diasParaCumple(p.fechaNacimiento), edad: edadQueCumple(p.fechaNacimiento) }))
        .filter(c => c.dias !== null)
        .sort((a, b) => (a.dias as number) - (b.dias as number))
        .slice(0, 3),
    [pacientes]
  );

  const abrirCita = (cita: Cita) => {
    navigation.navigate('Calendario', { screen: 'NotasSesion', params: { cita, modo: 'ver' } });
  };

  const abrirNuevaCita = () => {
    navigation.navigate('Calendario', { screen: 'VistaCalendario', params: { nuevaCita: true } });
  };

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPrincipal}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} colors={['#115e59']} tintColor="#115e59" />
        }
      >
        <View style={styles.encabezado}>
          <View>
            <Text style={styles.saludo}>Hola, Dra. Sánchez</Text>
            <Text style={styles.subtitulo}>Hoy es un gran día</Text>
          </View>
          <TouchableOpacity style={styles.botonAjustes} onPress={() => navigation.navigate('Perfil')}>
            <Ionicons name="settings" size={24} color="#115e59" />
          </TouchableOpacity>
        </View>

        <View style={styles.filaEstadisticas}>
          <TouchableOpacity style={styles.tarjetaEstadistica} onPress={() => navigation.navigate('Calendario')}>
            <Text style={styles.numeroEstadistica}>{citasHoy}</Text>
            <Text style={styles.textoEstadistica}>Citas hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tarjetaEstadistica} onPress={() => navigation.navigate('Pacientes')}>
            <Text style={styles.numeroEstadistica}>{totalPacientes}</Text>
            <Text style={styles.textoEstadistica}>Pacientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tarjetaEstadistica} onPress={() => navigation.navigate('Notificaciones')}>
            <Text style={styles.numeroEstadistica}>{recordatorios}</Text>
            <Text style={styles.textoEstadistica}>Recordatorios</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.seccionGrupo}>
          <Text style={styles.tituloSeccion}>Próximos cumpleaños</Text>
          {cumpleanos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cumpleanos.map(item => (
                <TouchableOpacity
                  key={item.paciente.id}
                  style={styles.tarjetaCumpleanos}
                  onPress={() => navigation.navigate('Pacientes', { screen: 'FichaPaciente', params: { pacienteId: item.paciente.id } })}
                >
                  <Ionicons name="gift" size={24} color="#8b5cf6" style={styles.iconoCumpleanos} />
                  <Text style={styles.nombreCumpleanos}>{item.paciente.nombre}</Text>
                  <Text style={styles.fechaCumpleanos}>{item.dias === 0 ? 'Hoy' : fechaCorta(item.paciente.fechaNacimiento)}</Text>
                  <Text style={styles.edadCumpleanos}>{item.edad !== null ? `Cumple ${item.edad} años` : ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.sinCitas}>Registra la fecha de nacimiento de tus pacientes para ver sus cumpleaños.</Text>
          )}
        </View>

        <View style={styles.seccionGrupo}>
          <Text style={styles.tituloSeccion}>Próximas citas</Text>
          <View style={styles.contenedorListaCitas}>
            {proximasCitas.length > 0 ? (
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator style={styles.scrollCitas}>
                {proximasCitas.map(cita => (
                  <TouchableOpacity key={cita.id} style={styles.tarjetaCita} onPress={() => abrirCita(cita)}>
                    <View style={styles.columnaHora}>
                      <Text style={styles.horaCita}>{cita.hora}</Text>
                      <Text style={styles.diaCita}>{etiquetaDia(cita.fecha, hoyStr, mananaStr)}</Text>
                    </View>
                    <View style={styles.infoCita}>
                      <Text style={styles.nombreCita}>{cita.paciente}</Text>
                      <Text style={styles.motivoCita}>{cita.tipo}</Text>
                    </View>
                    {cita.confirmada ? (
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" style={styles.iconoConfirmada} />
                    ) : null}
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.sinCitas}>No tienes citas próximas.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.botonFlotante} onPress={abrirNuevaCita}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7' },
  scrollPrincipal: { paddingHorizontal: 20, paddingBottom: 100 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  saludo: { fontSize: 26, fontWeight: 'bold', color: '#1e1b4b' },
  subtitulo: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  botonAjustes: { backgroundColor: '#d1fae5', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  filaEstadisticas: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  tarjetaEstadistica: { backgroundColor: '#d1fae5', flex: 1, marginHorizontal: 5, paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  numeroEstadistica: { fontSize: 22, fontWeight: 'bold', color: '#115e59', marginBottom: 4 },
  textoEstadistica: { fontSize: 12, color: '#374151', fontWeight: '600' },
  seccionGrupo: { marginBottom: 30 },
  tituloSeccion: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', marginBottom: 15 },
  tarjetaCumpleanos: { backgroundColor: '#ffffff', padding: 15, borderRadius: 16, marginRight: 15, width: 140, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconoCumpleanos: { marginBottom: 10 },
  nombreCumpleanos: { fontSize: 14, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
  fechaCumpleanos: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  edadCumpleanos: { fontSize: 12, color: '#8b5cf6', marginTop: 2, fontWeight: 'bold' },
  contenedorListaCitas: { backgroundColor: '#ffffff', borderRadius: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  scrollCitas: { maxHeight: 280 },
  tarjetaCita: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginBottom: 10 },
  columnaHora: { width: 64 },
  horaCita: { fontSize: 15, fontWeight: 'bold', color: '#115e59' },
  diaCita: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  infoCita: { flex: 1 },
  nombreCita: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  motivoCita: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  iconoConfirmada: { marginRight: 6 },
  sinCitas: { textAlign: 'center', color: '#9ca3af', paddingVertical: 24, fontSize: 14 },
  botonFlotante: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#115e59', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});