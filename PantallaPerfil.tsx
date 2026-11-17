import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { iniciales } from './utilidades';

interface PantallaPerfilProps {
  onCerrarSesion?: () => void;
}

export default function PantallaPerfil({ onCerrarSesion }: PantallaPerfilProps) {
  const insets = useSafeAreaInsets();
  const { usuarioActual, cerrarSesion, actualizarPerfil } = useAuth();

  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(usuarioActual?.nombre || '');
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState(usuarioActual?.especialidad || '');

  const manejarCierreSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            if (onCerrarSesion) {
              onCerrarSesion();
            } else {
              cerrarSesion();
            }
          },
        },
      ]
    );
  };

  const guardarCambios = () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Nombre vacío', 'Por favor ingresa un nombre válido.');
      return;
    }
    actualizarPerfil(nuevoNombre, nuevaEspecialidad);
    setModalEditarVisible(false);
    Alert.alert('Éxito', 'Información de perfil actualizada correctamente.');
  };

  const inicialesDoc = usuarioActual?.nombre ? iniciales(usuarioActual.nombre) : 'DR';

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.titulo}>Mi Perfil</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de perfil con avatar grande */}
        <View style={styles.tarjetaPerfil}>
          <View style={styles.avatarGrande}>
            <Text style={styles.textoAvatarGrande}>{inicialesDoc}</Text>
          </View>
          <Text style={styles.nombreDoctor}>{usuarioActual?.nombre || 'Dr. Alejandro Ruiz'}</Text>
          <Text style={styles.especialidadDoctor}>{usuarioActual?.especialidad || 'Terapeuta / Psicólogo'}</Text>
          <Text style={styles.correoDoctor}>{usuarioActual?.correo || 'alejandro.ruiz@correo.com'}</Text>
        </View>

        {/* Menú de opciones */}
        <View style={styles.menuOpciones}>
          <TouchableOpacity
            style={styles.opcionItem}
            onPress={() => {
              setNuevoNombre(usuarioActual?.nombre || '');
              setNuevaEspecialidad(usuarioActual?.especialidad || '');
              setModalEditarVisible(true);
            }}
          >
            <View style={styles.filaOpcion}>
              <Ionicons name="person-outline" size={20} color="#4b5563" style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Editar información personal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opcionItem}
            onPress={() =>
              Alert.alert('Notificaciones', 'Las notificaciones automáticas y recordatorios están activas.')
            }
          >
            <View style={styles.filaOpcion}>
              <Ionicons name="notifications-outline" size={20} color="#4b5563" style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Configuración de notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opcionItem}
            onPress={() =>
              Alert.alert('Seguridad', 'Tu contraseña y acceso están protegidos en este dispositivo.')
            }
          >
            <View style={styles.filaOpcion}>
              <Ionicons name="lock-closed-outline" size={20} color="#4b5563" style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Seguridad y contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.opcionItem, styles.opcionItemUltima]}
            onPress={() =>
              Alert.alert('Ayuda y soporte', 'Agenda Cribe v1.0.0 · Diseñada para profesionales de la salud.')
            }
          >
            <View style={styles.filaOpcion}>
              <Ionicons name="help-circle-outline" size={20} color="#4b5563" style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Ayuda y soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión en Rosa Suave / Magenta */}
        <TouchableOpacity style={styles.botonCerrarSesion} onPress={manejarCierreSesion}>
          <Ionicons name="log-out-outline" size={20} color="#B80065" style={styles.iconoLogout} />
          <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para editar información personal */}
      <Modal visible={modalEditarVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalTarjeta}>
            <Text style={styles.modalTitulo}>Editar información</Text>
            <Text style={styles.modalSubtitulo}>Actualiza tus datos profesionales:</Text>

            <Text style={styles.labelModal}>Nombre completo:</Text>
            <TextInput
              style={styles.inputModal}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Ej. Dr. Alejandro Ruiz"
            />

            <Text style={styles.labelModal}>Especialidad:</Text>
            <TextInput
              style={styles.inputModal}
              value={nuevaEspecialidad}
              onChangeText={setNuevaEspecialidad}
              placeholder="Ej. Terapeuta / Psicólogo"
            />

            <View style={styles.filaModalBotones}>
              <TouchableOpacity
                style={styles.botonModalCancelar}
                onPress={() => setModalEditarVisible(false)}
              >
                <Text style={styles.textoModalCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonModalGuardar} onPress={guardarCambios}>
                <Text style={styles.textoModalGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 20 },
  scroll: { paddingBottom: 40 },
  tarjetaPerfil: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarGrande: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#FCE7F3',
  },
  textoAvatarGrande: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B80065',
  },
  nombreDoctor: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  especialidadDoctor: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  correoDoctor: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  menuOpciones: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  opcionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  opcionItemUltima: {
    borderBottomWidth: 0,
  },
  filaOpcion: { flexDirection: 'row', alignItems: 'center' },
  iconoOpcion: { marginRight: 14 },
  textoOpcion: { fontSize: 14, color: '#374151', fontWeight: '500' },

  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F8',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  iconoLogout: {
    marginRight: 8,
  },
  textoCerrarSesion: {
    color: '#B80065',
    fontWeight: 'bold',
    fontSize: 15,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitulo: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 14,
  },
  labelModal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 4,
  },
  inputModal: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 14,
    marginBottom: 14,
  },
  filaModalBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  botonModalCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  textoModalCancelar: {
    color: '#6b7280',
    fontWeight: '600',
  },
  botonModalGuardar: {
    backgroundColor: '#B80065',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  textoModalGuardar: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
