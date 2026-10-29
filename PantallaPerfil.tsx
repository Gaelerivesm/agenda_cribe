import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PantallaPerfilProps {
  onCerrarSesion?: () => void;
}

export default function PantallaPerfil({ onCerrarSesion }: PantallaPerfilProps) {
  const manejarCierreSesion = () => {
    if (onCerrarSesion) {
      onCerrarSesion();
    } else {
      console.log('Cerrar sesión presionado');
    }
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <Text style={styles.titulo}>Perfil</Text>

      <View style={styles.seccionPerfil}>
        <View style={styles.avatarGrande}>
          <Ionicons name="person" size={45} color="#6b7280" />
        </View>
        <View>
          <Text style={styles.nombreDra}>Dra. Sánchez</Text>
          <Text style={styles.especialidad}>Psicóloga</Text>
        </View>
      </View>

      <View style={styles.menuOpciones}>
        <TouchableOpacity style={styles.opcionItem}>
          <View style={styles.filaOpcion}>
            <Ionicons name="create-outline" size={22} color="#115e59" style={styles.iconoOpcion} />
            <Text style={styles.textoOpcion}>Editar perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcionItem}>
          <View style={styles.filaOpcion}>
            <Ionicons name="settings-outline" size={22} color="#115e59" style={styles.iconoOpcion} />
            <Text style={styles.textoOpcion}>Configuración</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcionItem}>
          <View style={styles.filaOpcion}>
            <Ionicons name="help-circle-outline" size={22} color="#115e59" style={styles.iconoOpcion} />
            <Text style={styles.textoOpcion}>Ayuda</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcionItem} onPress={manejarCierreSesion}>
          <View style={styles.filaOpcion}>
            <Ionicons name="log-out-outline" size={22} color="#dc2626" style={styles.iconoOpcion} />
            <Text style={[styles.textoOpcion, { color: '#dc2626' }]}>Cerrar sesión</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: 40, paddingHorizontal: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#115e59', marginBottom: 25 },
  seccionPerfil: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  avatarGrande: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nombreDra: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  especialidad: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  menuOpciones: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  opcionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filaOpcion: { flexDirection: 'row', alignItems: 'center' },
  iconoOpcion: { marginRight: 15 },
  textoOpcion: { fontSize: 16, color: '#374151', fontWeight: '500' },
});