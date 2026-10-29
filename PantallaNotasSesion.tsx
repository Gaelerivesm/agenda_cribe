import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function PantallaNotasSesion() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { cita } = route.params;

  const [motivo, setMotivo] = useState(cita.motivo);
  const [notas, setNotas] = useState(cita.notas);

  const guardarNotas = () => {
    alert('¡Notas guardadas con éxito!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.encabezado}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#115e59" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Notas de sesión</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.tarjetaPacienteInfo}>
          <View style={styles.avatarGris}>
            <Ionicons name="person" size={24} color="#6b7280" />
          </View>
          <View>
            <Text style={styles.fechaHora}>{cita.fecha} - {cita.hora}</Text>
            <Text style={styles.nombrePaciente}>{cita.paciente}</Text>
          </View>
        </View>

        <Text style={styles.label}>Motivo de la sesión</Text>
        <TextInput
          style={styles.inputMotivo}
          value={motivo}
          onChangeText={setMotivo}
          multiline
        />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={styles.inputNotas}
          value={notas}
          onChangeText={setNotas}
          multiline
        />

        <TouchableOpacity style={styles.botonGuardar} onPress={guardarNotas}>
          <Text style={styles.textoBotonGuardar}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: 20 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  tituloHeader: { fontSize: 20, fontWeight: 'bold', color: '#115e59' },
  tarjetaPacienteInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 20 },
  avatarGris: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  fechaHora: { fontSize: 13, color: '#6b7280' },
  nombrePaciente: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#115e59', marginBottom: 6 },
  inputMotivo: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 20, height: 80, textAlignVertical: 'top' },
  inputNotas: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 30, height: 140, textAlignVertical: 'top' },
  botonGuardar: { backgroundColor: '#115e59', padding: 16, borderRadius: 12, alignItems: 'center' },
  textoBotonGuardar: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});