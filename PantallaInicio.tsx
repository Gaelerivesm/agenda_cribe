import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Cita } from './types';
import { TarjetaCita } from './TarjetaCita';

const citasIniciales: Cita[] = [
  { id: 1, hora: '10:00', paciente: 'Ana Torres', tipo: 'Terapia individual' },
  { id: 2, hora: '11:30', paciente: 'Luis García', tipo: 'Terapia individual' },
  { id: 3, hora: '16:00', paciente: 'Sofía Ramírez', tipo: 'Terapia individual' },
];

export default function PantallaInicio() {
  const [listaCitas, setListaCitas] = useState<Cita[]>(citasIniciales);

  const agregarCitaRapida = () => {
    const nuevaCita: Cita = {
      id: Date.now(),
      hora: '17:00',
      paciente: 'Nuevo Paciente',
      tipo: 'Consulta general',
    };

    setListaCitas((citasPrevias: Cita[]) => [...citasPrevias, nuevaCita]);
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.saludo}>Hola, Dra. López</Text>
      <Text style={styles.subtitulo}>Hoy es un gran día</Text>

      <View style={styles.filaTarjetas}>
        <View style={styles.cajaConteo}>
          <Text style={styles.numero}>{listaCitas.length}</Text>
          <Text style={styles.etiqueta}>Citas hoy</Text>
        </View>
        <View style={styles.cajaConteo}>
          <Text style={styles.numero}>5</Text>
          <Text style={styles.etiqueta}>Pacientes</Text>
        </View>
        <View style={styles.cajaConteo}>
          <Text style={styles.numero}>1</Text>
          <Text style={styles.etiqueta}>Recordatorio</Text>
        </View>
      </View>

      <View style={styles.encabezadoSeccion}>
        <Text style={styles.tituloSeccion}>Próximas citas</Text>
        <TouchableOpacity onPress={agregarCitaRapida}>
          <Text style={styles.verTodas}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {listaCitas.map((item: Cita) => (
        <TarjetaCita
          key={item.id}
          hora={item.hora}
          paciente={item.paciente}
          tipo={item.tipo}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  saludo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  subtitulo: {
    color: '#64748b',
    marginBottom: 20,
  },
  filaTarjetas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  cajaConteo: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  numero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  etiqueta: {
    fontSize: 10,
    color: '#475569',
  },
  encabezadoSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e1b4b',
  },
  verTodas: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});