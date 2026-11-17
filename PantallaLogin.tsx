import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoCribe from './LogoCribe';
import { useAuth } from './AuthContext';

type ModoPantalla = 'login' | 'registro' | 'recuperar_solicitar' | 'recuperar_verificar';

export default function PantallaLogin() {
  const insets = useSafeAreaInsets();
  const { iniciarSesion, registrarse, generarCodigoRecuperacion, restablecerPassword } = useAuth();

  const [modo, setModo] = useState<ModoPantalla>('login');

  // Campos Login
  const [identificadorLogin, setIdentificadorLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [mostrarPassLogin, setMostrarPassLogin] = useState(false);

  // Campos Registro
  const [nombreRegistro, setNombreRegistro] = useState('');
  const [usuarioRegistro, setUsuarioRegistro] = useState('');
  const [correoRegistro, setCorreoRegistro] = useState('');
  const [especialidadRegistro, setEspecialidadRegistro] = useState('');
  const [passwordRegistro, setPasswordRegistro] = useState('');
  const [confirmarPassRegistro, setConfirmarPassRegistro] = useState('');

  // Campos Recuperar Contraseña
  const [identificadorRecuperar, setIdentificadorRecuperar] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarNuevaPassword, setConfirmarNuevaPassword] = useState('');
  const [correoDestinoSimulado, setCorreoDestinoSimulado] = useState('');

  // Manejar Login
  const manejarEntrar = () => {
    if (!identificadorLogin.trim() || !passwordLogin) {
      Alert.alert('Faltan datos', 'Por favor ingresa tu correo o usuario y tu contraseña.');
      return;
    }

    const resultado = iniciarSesion(identificadorLogin, passwordLogin);
    if (!resultado.exito) {
      Alert.alert('Error de acceso', resultado.error || 'Credenciales inválidas');
    }
  };

  // Manejar Registro
  const manejarCrearCuenta = () => {
    if (
      !nombreRegistro.trim() ||
      !usuarioRegistro.trim() ||
      !correoRegistro.trim() ||
      !passwordRegistro.trim()
    ) {
      Alert.alert('Faltan campos', 'Por favor completa los campos obligatorios del registro.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(correoRegistro.trim())) {
      Alert.alert('Correo inválido', 'Por favor escribe un correo válido (ej. usuario@correo.com).');
      return;
    }

    if (passwordRegistro.length < 4) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (passwordRegistro !== confirmarPassRegistro) {
      Alert.alert('No coincide', 'Las contraseñas ingresadas no son iguales.');
      return;
    }

    const res = registrarse(
      nombreRegistro,
      usuarioRegistro,
      correoRegistro,
      passwordRegistro,
      especialidadRegistro || 'Terapeuta / Psicólogo'
    );
    if (!res.exito) {
      Alert.alert('No se pudo registrar', res.error || 'Error al crear la cuenta');
    } else {
      Alert.alert('¡Bienvenido(a)!', `Cuenta creada con éxito para ${nombreRegistro}.`);
    }
  };

  // Manejar Solicitud de Código (Paso 1 recuperación)
  const manejarSolicitarCodigo = () => {
    if (!identificadorRecuperar.trim()) {
      Alert.alert('Dato requerido', 'Escribe el correo o usuario de la cuenta que deseas recuperar.');
      return;
    }

    const res = generarCodigoRecuperacion(identificadorRecuperar);
    if (!res.exito) {
      Alert.alert('Error', res.error || 'No se encontró la cuenta');
      return;
    }

    setCodigoGenerado(res.codigo!);
    setCorreoDestinoSimulado(res.correo!);
    setModo('recuperar_verificar');
  };

  // Manejar Restablecer Clave (Paso 2 recuperación)
  const manejarRestablecerClave = () => {
    if (!codigoIngresado.trim()) {
      Alert.alert('Código faltante', 'Por favor escribe el código de 6 dígitos.');
      return;
    }

    if (codigoIngresado.trim() !== codigoGenerado) {
      Alert.alert('Código incorrecto', 'El código ingresado no coincide con el generado.');
      return;
    }

    if (nuevaPassword.length < 4) {
      Alert.alert('Contraseña débil', 'La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarNuevaPassword) {
      Alert.alert('No coincide', 'Las nuevas contraseñas no coinciden entre sí.');
      return;
    }

    const res = restablecerPassword(identificadorRecuperar, codigoIngresado, codigoGenerado, nuevaPassword);
    if (!res.exito) {
      Alert.alert('Error', res.error || 'No se pudo restablecer la contraseña');
      return;
    }

    Alert.alert(
      '¡Contraseña actualizada!',
      'Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión.',
      [
        {
          text: 'Ir a Iniciar Sesión',
          onPress: () => {
            setIdentificadorLogin(identificadorRecuperar);
            setPasswordLogin(nuevaPassword);
            setModo('login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.pantalla}>
      {/* Cabecera visual con forma curvada y color magenta de la nueva identidad */}
      <View style={[styles.cabeceraCurva, { paddingTop: insets.top + 20 }]}>
        <View style={styles.decoracionBlanca} />
        <View style={styles.contenedorLogo}>
          <LogoCribe tamano={64} color="#ffffff" />
          <Text style={styles.marcaLogo}>Agenda Cribe</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.tarjetaContenido}>
            {/* MODO LOGIN */}
            {modo === 'login' && (
              <>
                <Text style={styles.titulo}>Iniciar sesión</Text>
                <Text style={styles.subtitulo}>Bienvenido de nuevo</Text>

                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Correo electrónico o usuario"
                    placeholderTextColor="#9ca3af"
                    value={identificadorLogin}
                    onChangeText={setIdentificadorLogin}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!mostrarPassLogin}
                    value={passwordLogin}
                    onChangeText={setPasswordLogin}
                  />
                  <TouchableOpacity
                    style={styles.iconoOjo}
                    onPress={() => setMostrarPassLogin(!mostrarPassLogin)}
                  >
                    <Ionicons
                      name={mostrarPassLogin ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.botonPrincipal} onPress={manejarEntrar}>
                  <Text style={styles.textoBotonPrincipal}>Iniciar sesión</Text>
                </TouchableOpacity>

                <View style={styles.contenedorEnlaces}>
                  <TouchableOpacity onPress={() => setModo('registro')}>
                    <Text style={styles.textoPregunta}>
                      ¿No tienes cuenta? <Text style={styles.enlaceDestacado}>REGÍSTRATE</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setModo('recuperar_solicitar')}>
                    <Text style={styles.enlaceSecundario}>RESTABLECER CONTRASEÑA</Text>
                  </TouchableOpacity>
                </View>

                {/* Tarjeta de ayuda rápida con credenciales demo */}
                <View style={styles.cajaDemo}>
                  <Text style={styles.tituloDemo}>Acceso de prueba:</Text>
                  <Text style={styles.textoDemo}>
                    Usuario: <Text style={styles.negrita}>ale.ruiz</Text> · Clave: <Text style={styles.negrita}>1234</Text>
                  </Text>
                </View>
              </>
            )}

            {/* MODO REGISTRO */}
            {modo === 'registro' && (
              <>
                <Text style={styles.titulo}>Crear cuenta</Text>
                <Text style={styles.subtitulo}>Regístrate en tu agenda profesional</Text>

                <Text style={styles.label}>Nombre completo</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Dr. Alejandro Ruiz"
                    placeholderTextColor="#9ca3af"
                    value={nombreRegistro}
                    onChangeText={setNombreRegistro}
                  />
                </View>

                <Text style={styles.label}>Nombre de usuario</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="ale.ruiz"
                    placeholderTextColor="#9ca3af"
                    value={usuarioRegistro}
                    onChangeText={setUsuarioRegistro}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Text style={styles.label}>Especialidad profesional</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Terapeuta / Psicólogo"
                    placeholderTextColor="#9ca3af"
                    value={especialidadRegistro}
                    onChangeText={setEspecialidadRegistro}
                  />
                </View>

                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="alejandro.ruiz@correo.com"
                    placeholderTextColor="#9ca3af"
                    value={correoRegistro}
                    onChangeText={setCorreoRegistro}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 4 caracteres"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={passwordRegistro}
                    onChangeText={setPasswordRegistro}
                  />
                </View>

                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Repite tu contraseña"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={confirmarPassRegistro}
                    onChangeText={setConfirmarPassRegistro}
                  />
                </View>

                <TouchableOpacity style={styles.botonPrincipal} onPress={manejarCrearCuenta}>
                  <Text style={styles.textoBotonPrincipal}>Crear cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.botonVolver} onPress={() => setModo('login')}>
                  <Text style={styles.textoVolver}>¿Ya tienes cuenta? <Text style={styles.enlaceDestacado}>INICIA SESIÓN</Text></Text>
                </TouchableOpacity>
              </>
            )}

            {/* MODO RECUPERAR: SOLICITAR CÓDIGO */}
            {modo === 'recuperar_solicitar' && (
              <>
                <Text style={styles.titulo}>Recuperar clave</Text>
                <Text style={styles.subtitulo}>Ingresa tu usuario o correo para verificar tu cuenta</Text>

                <Text style={styles.label}>Usuario o Correo</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="alejandro.ruiz@correo.com"
                    placeholderTextColor="#9ca3af"
                    value={identificadorRecuperar}
                    onChangeText={setIdentificadorRecuperar}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={styles.botonPrincipal} onPress={manejarSolicitarCodigo}>
                  <Text style={styles.textoBotonPrincipal}>Generar código</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.botonVolver} onPress={() => setModo('login')}>
                  <Text style={styles.textoVolver}>Volver al inicio de sesión</Text>
                </TouchableOpacity>
              </>
            )}

            {/* MODO RECUPERAR: VERIFICAR Y RESTABLECER */}
            {modo === 'recuperar_verificar' && (
              <>
                <Text style={styles.titulo}>Nueva Contraseña</Text>
                <Text style={styles.subtitulo}>Ingresa el código generado y tu nueva clave</Text>

                <View style={styles.bannerSimulado}>
                  <Ionicons name="mail-unread-outline" size={24} color="#B80065" />
                  <View style={styles.infoBanner}>
                    <Text style={styles.textoBannerTitulo}>Simulación de Correo:</Text>
                    <Text style={styles.textoBannerDetalle}>Para: {correoDestinoSimulado}</Text>
                    <Text style={styles.codigoDestacado}>{codigoGenerado}</Text>
                    <Text style={styles.textoBannerPista}>(Ingresa este código a continuación)</Text>
                  </View>
                </View>

                <Text style={styles.label}>Código de 6 dígitos</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.inputCentrado]}
                    placeholder="000000"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    maxLength={6}
                    value={codigoIngresado}
                    onChangeText={setCodigoIngresado}
                  />
                </View>

                <Text style={styles.label}>Nueva contraseña</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 4 caracteres"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={nuevaPassword}
                    onChangeText={setNuevaPassword}
                  />
                </View>

                <Text style={styles.label}>Confirmar nueva contraseña</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Repite la nueva contraseña"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={confirmarNuevaPassword}
                    onChangeText={setConfirmarNuevaPassword}
                  />
                </View>

                <TouchableOpacity style={styles.botonPrincipal} onPress={manejarRestablecerClave}>
                  <Text style={styles.textoBotonPrincipal}>Actualizar contraseña</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonVolver}
                  onPress={() => {
                    setModo('recuperar_solicitar');
                    setCodigoIngresado('');
                  }}
                >
                  <Text style={styles.textoVolver}>Atrás</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  cabeceraCurva: {
    backgroundColor: '#B80065',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  decoracionBlanca: {
    position: 'absolute',
    top: 15,
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  contenedorLogo: {
    alignItems: 'center',
  },
  marcaLogo: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  tarjetaContenido: {
    flex: 1,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputCentrado: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  iconoOjo: {
    padding: 6,
  },
  botonPrincipal: {
    backgroundColor: '#B80065',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#B80065',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  textoBotonPrincipal: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contenedorEnlaces: {
    alignItems: 'center',
    marginTop: 24,
    gap: 14,
  },
  textoPregunta: {
    fontSize: 13,
    color: '#4b5563',
  },
  enlaceDestacado: {
    color: '#B80065',
    fontWeight: 'bold',
  },
  enlaceSecundario: {
    fontSize: 12,
    color: '#B80065',
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  botonVolver: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  textoVolver: {
    fontSize: 14,
    color: '#6b7280',
  },
  cajaDemo: {
    marginTop: 28,
    backgroundColor: '#FDF2F8',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  tituloDemo: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B80065',
  },
  textoDemo: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  negrita: {
    fontWeight: 'bold',
    color: '#111827',
  },
  bannerSimulado: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoBanner: {
    flex: 1,
  },
  textoBannerTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B80065',
  },
  textoBannerDetalle: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  codigoDestacado: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B80065',
    letterSpacing: 4,
    marginTop: 4,
  },
  textoBannerPista: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
