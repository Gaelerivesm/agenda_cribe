import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, validarPassword } from './AuthContext';
import { obtenerPaleta } from './tema';

interface Props { visible: boolean; onCerrar: () => void }

export default function ModalCambioPassword({ visible, onCerrar }: Props) {
  const { cambiarPassword, usuarioActual } = useAuth();
  const paleta = obtenerPaleta(usuarioActual?.paleta);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const cerrar = () => {
    setActual(''); setNueva(''); setConfirmacion(''); onCerrar();
  };

  const guardar = async () => {
    if (!validarPassword(nueva)) {
      Alert.alert('Contraseña débil', 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.');
      return;
    }
    if (nueva !== confirmacion) {
      Alert.alert('No coincide', 'La nueva contraseña y su confirmación deben ser iguales.');
      return;
    }
    const resultado = await cambiarPassword(actual, nueva);
    if (!resultado.exito) {
      Alert.alert('No se pudo cambiar', resultado.error ?? 'Verifica los datos e inténtalo de nuevo.');
      return;
    }
    cerrar();
    Alert.alert('Contraseña actualizada', 'Tu contraseña se cambió correctamente.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cerrar}>
      <Pressable style={styles.fondo} onPress={cerrar}>
        <Pressable style={styles.tarjeta} onPress={evento => evento.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.header}>
                <Text style={styles.titulo}>Cambiar contraseña</Text>
                <TouchableOpacity onPress={cerrar} accessibilityLabel="Cerrar ventana"><Ionicons name="close" size={22} color="#6b7280" /></TouchableOpacity>
              </View>
              <Text style={styles.label}>Contraseña actual</Text>
              <TextInput style={styles.input} value={actual} onChangeText={setActual} secureTextEntry placeholder="Escribe tu contraseña actual" />
              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput style={styles.input} value={nueva} onChangeText={setNueva} secureTextEntry placeholder="Nueva contraseña" />
              <Text style={styles.requisito}>Mínimo 8 caracteres, un número, una mayúscula y un símbolo.</Text>
              <Text style={styles.label}>Confirmar nueva contraseña</Text>
              <TextInput style={styles.input} value={confirmacion} onChangeText={setConfirmacion} secureTextEntry placeholder="Repite la nueva contraseña" />
              <TouchableOpacity style={styles.boton} onPress={guardar}><Text style={styles.textoBoton}>Actualizar contraseña</Text></TouchableOpacity>
            </KeyboardAvoidingView>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', padding: 22 },
  tarjeta: { maxHeight: '90%', backgroundColor: '#fff', borderRadius: 22, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#111827' },
  label: { color: '#374151', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 13, padding: 12, marginBottom: 14, color: '#111827' },
  requisito: { color: '#6b7280', fontSize: 11, marginTop: -7, marginBottom: 13 },
  boton: { backgroundColor: paleta.primaria, borderRadius: 13, alignItems: 'center', padding: 14, marginTop: 8 },
  textoBoton: { color: '#fff', fontWeight: '700' },
});
