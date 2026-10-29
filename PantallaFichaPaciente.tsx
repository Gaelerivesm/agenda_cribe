import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function PantallaFichaPaciente() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  // Recibimos los datos del paciente seleccionado
  const { paciente } = route.params; 

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#115e59" />
        </TouchableOpacity>
        <Ionicons name="ellipsis-vertical" size={24} color="#115e59" />
      </View>

      <View style={styles.perfilCentral}>
        <View style={styles.avatarGrande}>
          <Ionicons name="person" size={40} color="#6b7280" />
        </View>
        <Text style={styles.nombreGrande}>{paciente.nombre}</Text>
        <Text style={styles.detalleGrande}>{paciente.edad} años - {paciente.tipoTerapia}</Text>
      </View>

      <View style={styles.pestañas}>
        <Text style={[styles.textoPestaña, styles.pestañaActiva]}>Información</Text>
        <Text style={styles.textoPestaña}>Historial</Text>
        <Text style={styles.textoPestaña}>Notas</Text>
      </View>

      <ScrollView style={styles.listaInfo}>
        <View style={styles.itemInfo}>
          <Text style={styles.label}>Teléfono</Text>
          <Text style={styles.valor}>{paciente.telefono}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.label}>Correo</Text>
          <Text style={styles.valor}>{paciente.correo}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <Text style={styles.valor}>{paciente.fechaNacimiento}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.label}>Contacto de emergencia</Text>
          <Text style={styles.valor}>{paciente.contactoEmergencia}</Text>
          <Text style={styles.valor}>{paciente.telefonoEmergencia}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.botonFlotante}>
        <Ionicons name="pencil" size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: 40 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  perfilCentral: { alignItems: 'center', marginBottom: 20 },
  avatarGrande: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  nombreGrande: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  detalleGrande: { fontSize: 14, color: '#6b7280' },
  pestañas: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 10, marginBottom: 20 },
  textoPestaña: { fontSize: 16, color: '#9ca3af' },
  pestañaActiva: { color: '#115e59', fontWeight: 'bold', textDecorationLine: 'underline' },
  listaInfo: { paddingHorizontal: 20 },
  itemInfo: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#115e59', marginBottom: 4 },
  valor: { fontSize: 16, color: '#374151' },
  botonFlotante: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#115e59', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});