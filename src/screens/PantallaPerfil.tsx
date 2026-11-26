import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { iniciales } from '../utils/utilidades';
import ModalCambioPassword from '../components/ModalCambioPassword';
import ModalPaletas from '../components/ModalPaletas';
import { obtenerPaleta, Apariencia } from '../theme/tema';
import SelectorEspecialidad from '../components/SelectorEspecialidad';
import { router } from 'expo-router';
import { CitasContext } from '../context/CitasContext';
import { PacientesContext } from '../context/PacientesContext';
import { solicitarPermisoNotificaciones, sincronizarNotificaciones } from '../services/notificaciones';

interface PantallaPerfilProps {
  onCerrarSesion?: () => void;
}

export default function PantallaPerfil({ onCerrarSesion }: PantallaPerfilProps) {
  const insets = useSafeAreaInsets();
  const citas = React.useContext(CitasContext);
  const pacientes = React.useContext(PacientesContext);
  const { usuarioActual, cerrarSesion, actualizarPerfil, actualizarApariencia } = useAuth();

  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [modalPaletasVisible, setModalPaletasVisible] = useState(false);
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
              router.replace('/login');
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

  const configurarNotificaciones = async () => {
    try {
      const permitido = await solicitarPermisoNotificaciones();
      if (!permitido) {
        Alert.alert('Permiso necesario', 'Activa las notificaciones de Agenda Cribe en los ajustes del teléfono para recibir recordatorios.');
        return;
      }
      if (citas && pacientes) await sincronizarNotificaciones(citas.citas, pacientes.pacientes);
      Alert.alert('Recordatorios activados', 'Recibirás avisos 24 horas y 1 hora antes de tus citas, y un día antes de los cumpleaños.');
    } catch {
      Alert.alert('No se pudo activar', 'Revisa los permisos de notificaciones en los ajustes del teléfono.');
    }
  };

  const inicialesDoc = usuarioActual?.nombre ? iniciales(usuarioActual.nombre) : 'DR';
  const apariencia = usuarioActual?.apariencia ?? 'sistema';
  const esOscuro = usuarioActual?.modoOscuro === true;
  const paleta = obtenerPaleta(usuarioActual?.paleta, usuarioActual?.modoOscuro);
  const styles = useMemo(() => crearStyles(paleta), [paleta]);

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.titulo}>Mi Perfil</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de perfil con avatar grande */}
        <View style={styles.tarjetaPerfil}>
          <View style={[styles.avatarGrande, { backgroundColor: paleta.suave, borderColor: paleta.borde }]}>
            <Text style={[styles.textoAvatarGrande, { color: paleta.primaria }]}>{inicialesDoc}</Text>
          </View>
          <Text style={styles.nombreDoctor}>{usuarioActual?.nombre || 'Profesional de la salud'}</Text>
          <Text style={styles.especialidadDoctor}>{usuarioActual?.especialidad || 'Especialidad no registrada'}</Text>
          {usuarioActual?.correo ? <Text style={styles.correoDoctor}>{usuarioActual.correo}</Text> : null}
        </View>

        {/* Selector de aspecto */}
        <View style={styles.seccionAspecto}>
          <Text style={styles.etiquetaSeccion}>ASPECTO</Text>
          <View style={styles.tarjetaAspecto}>
            <View style={styles.filaAspecto}>
              <View style={styles.infoAspecto}>
              <Ionicons name={apariencia === 'sistema' ? 'phone-portrait-outline' : apariencia === 'beige' ? 'contrast-outline' : esOscuro ? 'moon-outline' : 'sunny-outline'} size={21} color={paleta.primaria} />
                <View style={styles.textosAspecto}>
                  <Text style={styles.nombreModo}>{apariencia === 'sistema' ? 'Apariencia del sistema' : apariencia === 'beige' ? 'Tema beige' : esOscuro ? 'Tema oscuro' : 'Tema claro'}</Text>
                  <Text style={styles.descripcionModo}>Se adapta al teléfono o elige un tema fijo</Text>
                </View>
              </View>
            </View>
            <View style={styles.opcionesApariencia}>
              {([
                ['sistema', 'Sistema'], ['claro', 'Blanco'], ['oscuro', 'Negro'], ['beige', 'Beige'],
              ] as [Apariencia, string][]).map(([valor, etiqueta]) => (
                <TouchableOpacity key={valor} style={[styles.botonApariencia, apariencia === valor && styles.aparienciaActiva]} onPress={() => actualizarApariencia(valor)}>
                  <Text style={[styles.textoApariencia, apariencia === valor && styles.textoAparienciaActiva]}>{etiqueta}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
              <Ionicons name="person-outline" size={20} color={paleta.textoSecundario} style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Editar información personal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.opcionItem} onPress={() => setModalPaletasVisible(true)}>
            <View style={styles.filaOpcion}>
              <Ionicons name="color-palette-outline" size={20} color={paleta.primaria} style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Color de interfaz</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opcionItem}
            onPress={() => { void configurarNotificaciones(); }}
          >
            <View style={styles.filaOpcion}>
              <Ionicons name="notifications-outline" size={20} color={paleta.textoSecundario} style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Configuración de notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.opcionItem}
            onPress={() => setModalPasswordVisible(true)}
          >
            <View style={styles.filaOpcion}>
              <Ionicons name="lock-closed-outline" size={20} color={paleta.textoSecundario} style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Seguridad y contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.opcionItem, styles.opcionItemUltima]}
            onPress={() =>
              Alert.alert('Ayuda y soporte', 'Agenda Cribe v1.0.0 · Diseñada para profesionales de la salud.')
            }
          >
            <View style={styles.filaOpcion}>
              <Ionicons name="help-circle-outline" size={20} color={paleta.textoSecundario} style={styles.iconoOpcion} />
              <Text style={styles.textoOpcion}>Ayuda y soporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={paleta.textoSecundario} />
          </TouchableOpacity>
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.botonCerrarSesion} onPress={manejarCierreSesion}>
          <Ionicons name="log-out-outline" size={20} color={paleta.primaria} style={styles.iconoLogout} />
          <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para editar información personal */}
      <Modal visible={modalEditarVisible} transparent animationType="fade" onRequestClose={() => setModalEditarVisible(false)}>
        <Pressable style={styles.modalFondo} onPress={() => setModalEditarVisible(false)}>
          <Pressable style={styles.modalTarjeta} onPress={evento => evento.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.modalEncabezado}>
                  <Text style={styles.modalTitulo}>Editar información</Text>
                  <TouchableOpacity onPress={() => setModalEditarVisible(false)} accessibilityLabel="Cerrar ventana">
                    <Ionicons name="close" size={22} color={paleta.textoSecundario} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitulo}>Actualiza tus datos profesionales:</Text>

                <Text style={styles.labelModal}>Nombre completo:</Text>
                <TextInput
                  style={styles.inputModal}
                  value={nuevoNombre}
                  onChangeText={setNuevoNombre}
                  placeholder="Ej. Dr. Alejandro Ruiz"
                />

                <Text style={styles.labelModal}>Especialidad:</Text>
                <SelectorEspecialidad value={nuevaEspecialidad} onChange={setNuevaEspecialidad} paleta={paleta} />

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
              </KeyboardAvoidingView>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <ModalCambioPassword visible={modalPasswordVisible} onCerrar={() => setModalPasswordVisible(false)} />
      <ModalPaletas visible={modalPaletasVisible} onCerrar={() => setModalPaletasVisible(false)} />
    </View>
  );
}

const crearStyles = (paleta: ReturnType<typeof obtenerPaleta>) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: paleta.fondo, paddingHorizontal: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: paleta.texto, textAlign: 'center', marginBottom: 20 },
  scroll: { paddingBottom: 40 },
  tarjetaPerfil: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: paleta.borde,
    shadowColor: '#000',
    shadowOpacity: paleta.esOscuro ? 0.25 : 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarGrande: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: paleta.suave,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: paleta.borde,
  },
  textoAvatarGrande: {
    fontSize: 28,
    fontWeight: 'bold',
    color: paleta.primaria,
  },
  nombreDoctor: { fontSize: 20, fontWeight: 'bold', color: paleta.texto },
  especialidadDoctor: { fontSize: 13, color: paleta.textoSecundario, marginTop: 4 },
  correoDoctor: { fontSize: 12, color: paleta.textoSecundario, marginTop: 2 },

  seccionAspecto: {
    marginBottom: 20,
  },
  etiquetaSeccion: {
    fontSize: 12,
    fontWeight: '700',
    color: paleta.textoSecundario,
    marginBottom: 8,
    paddingHorizontal: 4,
    letterSpacing: 0.8,
  },
  tarjetaAspecto: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: paleta.borde,
    shadowColor: '#000',
    shadowOpacity: paleta.esOscuro ? 0.2 : 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  filaAspecto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opcionesApariencia: { flexDirection: 'row', gap: 6, marginTop: 16 },
  botonApariencia: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: paleta.inputFondo, borderWidth: 1, borderColor: paleta.inputBorde },
  aparienciaActiva: { backgroundColor: paleta.primaria, borderColor: paleta.primaria },
  textoApariencia: { color: paleta.textoSecundario, fontSize: 11, fontWeight: '600' },
  textoAparienciaActiva: { color: '#fff' },
  infoAspecto: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  textosAspecto: { flex: 1 },
  nombreModo: { fontSize: 14, fontWeight: '700', color: paleta.texto },
  descripcionModo: { fontSize: 12, color: paleta.textoSecundario, marginTop: 3 },

  menuOpciones: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: paleta.borde,
    shadowColor: '#000',
    shadowOpacity: paleta.esOscuro ? 0.2 : 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  opcionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: paleta.borde,
  },
  opcionItemUltima: {
    borderBottomWidth: 0,
  },
  filaOpcion: { flexDirection: 'row', alignItems: 'center' },
  iconoOpcion: { marginRight: 14 },
  textoOpcion: { fontSize: 14, color: paleta.texto, fontWeight: '500' },

  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paleta.suave,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: paleta.borde,
  },
  iconoLogout: {
    marginRight: 8,
  },
  textoCerrarSesion: {
    color: paleta.primaria,
    fontWeight: 'bold',
    fontSize: 15,
  },

  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTarjeta: {
    backgroundColor: paleta.tarjeta,
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: paleta.borde,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: paleta.texto,
    marginBottom: 4,
  },
  modalEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalSubtitulo: {
    fontSize: 13,
    color: paleta.textoSecundario,
    marginBottom: 14,
  },
  labelModal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: paleta.texto,
    marginBottom: 4,
  },
  inputModal: {
    backgroundColor: paleta.inputFondo,
    borderWidth: 1,
    borderColor: paleta.inputBorde,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: paleta.texto,
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
    color: paleta.textoSecundario,
    fontWeight: '600',
  },
  botonModalGuardar: {
    backgroundColor: paleta.primaria,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  textoModalGuardar: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
