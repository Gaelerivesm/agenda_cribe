import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CitaAgenda } from './types';
import { useNavigation } from '@react-navigation/native';

// Días de la semana interactivos
const diasSemana = [
  { dia: 'L', fechaNum: '21', fechaStr: '2025-04-21' },
  { dia: 'M', fechaNum: '22', fechaStr: '2025-04-22' },
  { dia: 'M', fechaNum: '23', fechaStr: '2025-04-23' }, // Seleccionado por defecto
  { dia: 'J', fechaNum: '24', fechaStr: '2025-04-24' },
  { dia: 'V', fechaNum: '25', fechaStr: '2025-04-25' },
  { dia: 'S', fechaNum: '26', fechaStr: '2025-04-26' },
  { dia: 'D', fechaNum: '27', fechaStr: '2025-04-27' },
];

// Citas simuladas para los diferentes días
const citasBase: CitaAgenda[] = [
  { id: '1', fecha: '2025-04-23', hora: '09:00', paciente: 'Ana López', tipo: 'ocupado', motivo: 'Ansiedad por situaciones laborales.', notas: 'Se observa mejora en la gestión de la ansiedad. Se asigna tarea.', estado: 'ocupado' },
  { id: '2', fecha: '2025-04-23', hora: '11:30', paciente: 'Carlos Ruiz', tipo: 'ocupado', motivo: 'Seguimiento mensual.', notas: 'Paciente reporta estabilidad emocional.', estado: 'ocupado' },
  { id: '3', fecha: '2025-04-23', hora: '14:00', paciente: 'Libre', tipo: 'libre', motivo: '', notas: '', estado: 'libre' },
  { id: '4', fecha: '2025-04-23', hora: '16:00', paciente: 'Valeria Torres', tipo: 'ocupado', motivo: 'Terapia familiar.', notas: 'Sesión productiva con enfoque en límites.', estado: 'ocupado' },
  { id: '5', fecha: '2025-04-24', hora: '10:00', paciente: 'Diego Ramírez', tipo: 'ocupado', motivo: 'Estrés postraumático.', notas: 'Revisión de ejercicios de respiración.', estado: 'ocupado' },
];

export default function PantallaCalendario() {
  const [diaSeleccionado, setDiaSeleccionado] = useState('2025-04-23');
  const navigation = useNavigation<any>();

  // Filtramos las citas según el día seleccionado
  const citasFiltradas = citasBase.filter(c => c.fecha === diaSeleccionado);

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Agenda</Text>
        <Ionicons name="ellipsis-vertical" size={24} color="#115e59" />
      </View>

      <Text style={styles.mes}>Abril 2025</Text>

      {/* Fila interactiva de días */}
      <View style={styles.filaDias}>
        {diasSemana.map((item, index) => {
          const estaSeleccionado = item.fechaStr === diaSeleccionado;
          return (
            <TouchableOpacity 
              key={index} 
              style={styles.columnaDia}
              onPress={() => setDiaSeleccionado(item.fechaStr)}
            >
              <Text style={styles.textoDiaLetra}>{item.dia}</Text>
              <View style={[styles.circuloDia, estaSeleccionado && styles.circuloSeleccionado]}>
                <Text style={[styles.textoDiaNum, estaSeleccionado && styles.textoNumSeleccionado]}>
                  {item.fechaNum}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {citasFiltradas.length > 0 ? (
          citasFiltradas.map((cita) => {
            const esLibre = cita.estado === 'libre';
            return (
              <TouchableOpacity
                key={cita.id}
                style={[styles.tarjetaCita, esLibre ? styles.tarjetaLibre : styles.tarjetaOcupada]}
                disabled={esLibre}
                onPress={() => navigation.navigate('NotasSesion', { cita })}
              >
                <Text style={styles.horaCita}>{cita.hora}</Text>
                <Text style={[styles.pacienteCita, esLibre && { color: '#9ca3af' }]}>
                  {cita.paciente}
                </Text>
                {!esLibre && <Ionicons name="chevron-forward" size={18} color="#6b7280" />}
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.sinCitas}>No hay citas programadas para este día.</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.botonFlotante}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: 40 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#115e59' },
  mes: { fontSize: 16, fontWeight: 'bold', color: '#374151', paddingHorizontal: 20, marginBottom: 15 },
  filaDias: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 15 },
  columnaDia: { alignItems: 'center' },
  textoDiaLetra: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  circuloDia: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  circuloSeleccionado: { backgroundColor: '#115e59' },
  textoDiaNum: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  textoNumSeleccionado: { color: '#ffffff' },
  tarjetaCita: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12 },
  tarjetaOcupada: { backgroundColor: '#d1fae5' },
  tarjetaLibre: { backgroundColor: '#f3f4f6' },
  horaCita: { fontSize: 15, fontWeight: 'bold', color: '#115e59', width: 60 },
  pacienteCita: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  sinCitas: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  botonFlotante: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#115e59', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});