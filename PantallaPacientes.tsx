import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Paciente } from './types';
import { useNavigation } from '@react-navigation/native';

// Lista extendida para que la pantalla necesite hacer scroll
const pacientesPrueba: Paciente[] = [
  { id: '1', nombre: 'Ana López', edad: 22, tipoTerapia: 'Terapia individual', telefono: '+52 614 123 4567', correo: 'ana.lopez@email.com', fechaNacimiento: '12/03/2003', contactoEmergencia: 'María López (mamá)', telefonoEmergencia: '+52 614 987 6543' },
  { id: '2', nombre: 'Carlos Ruiz', edad: 29, tipoTerapia: 'Terapia individual', telefono: '+52 614 111 2222', correo: 'carlos@email.com', fechaNacimiento: '10/05/1994', contactoEmergencia: 'Juan Ruiz', telefonoEmergencia: '+52 614 333 4444' },
  { id: '3', nombre: 'Valeria Torres', edad: 16, tipoTerapia: 'Terapia individual', telefono: '+52 614 222 3333', correo: 'valeria@email.com', fechaNacimiento: '15/08/2008', contactoEmergencia: 'Rosa Torres', telefonoEmergencia: '+52 614 444 5555' },
  { id: '4', nombre: 'Diego Ramírez', edad: 34, tipoTerapia: 'Terapia de pareja', telefono: '+52 614 555 6666', correo: 'diego@email.com', fechaNacimiento: '20/11/1989', contactoEmergencia: 'Laura Gómez', telefonoEmergencia: '+52 614 777 8888' },
  { id: '5', nombre: 'María González', edad: 41, tipoTerapia: 'Terapia individual', telefono: '+52 614 999 0000', correo: 'maria@email.com', fechaNacimiento: '05/02/1983', contactoEmergencia: 'Pedro González', telefonoEmergencia: '+52 614 123 0000' },
  { id: '6', nombre: 'Jorge Silva', edad: 28, tipoTerapia: 'Terapia individual', telefono: '+52 614 321 0000', correo: 'jorge@email.com', fechaNacimiento: '14/09/1995', contactoEmergencia: 'Carmen Silva', telefonoEmergencia: '+52 614 654 0000' },
  { id: '7', nombre: 'Lucía Fernández', edad: 30, tipoTerapia: 'Terapia de pareja', telefono: '+52 614 987 1111', correo: 'lucia@email.com', fechaNacimiento: '30/12/1993', contactoEmergencia: 'Roberto Fernández', telefonoEmergencia: '+52 614 123 2222' },
  { id: '8', nombre: 'Fernando Herrera', edad: 45, tipoTerapia: 'Terapia individual', telefono: '+52 614 555 1234', correo: 'fernando@email.com', fechaNacimiento: '11/07/1979', contactoEmergencia: 'Elena Herrera', telefonoEmergencia: '+52 614 555 9876' }
];

export default function PantallaPacientes() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Pacientes</Text>
        <Ionicons name="ellipsis-vertical" size={24} color="#115e59" />
      </View>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput style={styles.inputBuscador} placeholder="Buscar paciente..." />
      </View>

      {/* Se agregó paddingBottom para que el final de la lista no quede escondido detrás del botón flotante */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {pacientesPrueba.map((paciente) => (
          <TouchableOpacity 
            key={paciente.id} 
            style={styles.tarjetaPaciente}
            onPress={() => navigation.navigate('FichaPaciente', { paciente })}
          >
            <View style={styles.avatarGris}>
              <Ionicons name="person" size={24} color="#6b7280" />
            </View>
            <View style={styles.infoPaciente}>
              <Text style={styles.nombre}>{paciente.nombre}</Text>
              <Text style={styles.detalle}>{paciente.edad} años - {paciente.tipoTerapia}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.botonFlotante}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: 40 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#115e59' },
  buscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 20, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
  inputBuscador: { flex: 1, marginLeft: 10, fontSize: 16 },
  tarjetaPaciente: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 12 },
  avatarGris: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoPaciente: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  detalle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  botonFlotante: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#115e59', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});