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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoCribe from '../components/LogoCribe';
import { useAuth, validarPassword } from '../context/AuthContext';

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
  const [telefonoRegistro, setTelefonoRegistro] = useState('');
  const [especialidadRegistro, setEspecialidadRegistro] = useState('');
  const [passwordRegistro, setPasswordRegistro] = useState('');
  const [mostrarPassRegistro, setMostrarPassRegistro] = useState(false);
  const [confirmarPassRegistro, setConfirmarPassRegistro] = useState('');

  // Campos Recuperar Contraseña
  const [identificadorRecuperar, setIdentificadorRecuperar] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarNuevaPassword, setConfirmarNuevaPassword] = useState('');
  const [correoDestinoSimulado, setCorreoDestinoSimulado] = useState('');

  // Manejar Login
  const manejarEntrar = async () => {
    if (!identificadorLogin.trim() || !passwordLogin) {
      Alert.alert('Faltan datos', 'Por favor ingresa tu correo o usuario y tu contraseña.');
      return;
    }

    const resultado = await iniciarSesion(identificadorLogin, passwordLogin);
    if (!resultado.exito) {
      Alert.alert('Error de acceso', resultado.error || 'Credenciales inválidas');
    } else {
      router.replace('/(tabs)');
    }
  };

  // Manejar Registro
  const manejarCrearCuenta = async () => {
    if (
      !nombreRegistro.trim() ||
      !usuarioRegistro.trim() ||
      !correoRegistro.trim() ||
      !telefonoRegistro.trim() ||
      !passwordRegistro.trim()
    ) {
      Alert.alert('Faltan campos', 'Por favor completa los campos obligatorios del registro.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(correoRegistro.trim())) {
      Alert.alert('Correo inválido', 'Por favor escribe un correo válido (ej. usuario@correo.com).');
      return;
    }

    if (!/^\d{10}$/.test(telefonoRegistro.replace(/\D/g, ''))) {
      Alert.alert('Teléfono inválido', 'Ingresa un número de teléfono de exactamente 10 dígitos.');
      return;
    }

    if (!validarPassword(passwordRegistro)) {
      Alert.alert('Contraseña débil', 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.');
      return;
    }

    if (passwordRegistro !== confirmarPassRegistro) {
      Alert.alert('No coincide', 'Las contraseñas ingresadas no son iguales.');
      return;
    }

    const res = await registrarse(
      nombreRegistro,
      usuarioRegistro,
      correoRegistro,
      telefonoRegistro,
      passwordRegistro,
      especialidadRegistro || 'Terapeuta / Psicólogo'
    );
    if (!res.exito) {
      Alert.alert('No se pudo registrar', res.error || 'Error al crear la cuenta');
    } else {
      Alert.alert('¡Bienvenido(a)!', `Cuenta creada con éxito para ${nombreRegistro}.`);
      router.replace('/(tabs)');
    }
  };

  const manejarCambioTelefono = (valor: string) => {
    const digitos = valor.replace(/\D/g, '').slice(0, 10);
    const formateado = digitos.replace(/^(\d{3})(?=\d)/, '$1 ').replace(/^(\d{3} \d{3})(?=\d)/, '$1 ');
    setTelefonoRegistro(formateado);
  };

  // Manejar Solicitud de Código (Paso 1 recuperación)
  const manejarSolicitarCodigo = async () => {
    if (!identificadorRecuperar.trim()) {
      Alert.alert('Dato requerido', 'Escribe el correo o usuario de la cuenta que deseas recuperar.');
      return;
    }

    const res = await generarCodigoRecuperacion(identificadorRecuperar);
    if (!res.exito) {
      Alert.alert('Error', res.error || 'No se encontró la cuenta');
      return;
    }

    setCodigoGenerado(res.codigo!);
    setCorreoDestinoSimulado(res.correo!);
    setModo('recuperar_verificar');
  };

  // Manejar Restablecer Clave (Paso 2 recuperación)
  const manejarRestablecerClave = async () => {
    if (!codigoIngresado.trim()) {
      Alert.alert('Código faltante', 'Por favor escribe el código de 6 dígitos.');
      return;
    }

    if (codigoIngresado.trim() !== codigoGenerado) {
      Alert.alert('Código incorrecto', 'El código ingresado no coincide con el generado.');
      return;
    }

    if (!validarPassword(nuevaPassword)) {
      Alert.alert('Contraseña débil', 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.');
      return;
    }

    if (nuevaPassword !== confirmarNuevaPassword) {
      Alert.alert('No coincide', 'Las nuevas contraseñas no coinciden entre sí.');
      return;
    }

    const res = await restablecerPassword(identificadorRecuperar, codigoIngresado, codigoGenerado, nuevaPassword);
    if (!res.exito) {
      Alert.alert('Error', res.error || 'No se pudo actualizar la contraseña');
      return;
    }

    Alert.alert('¡Éxito!', 'Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con ella.');
    setModo('login');
    setIdentificadorLogin(identificadorRecuperar);
    setPasswordLogin('');
    setIdentificadorRecuperar('');
    setCodigoGenerado('');
    setCodigoIngresado('');
    setNuevaPassword('');
    setConfirmarNuevaPassword('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contenedorScroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera con Logo */}
        <View style={styles.seccionLogo}>
          <LogoCribe tamano={80} color="#79528F" />
          <Text style={styles.nombreApp}>CRIBE</Text>
          <Text style={styles.subtituloApp}>Agenda para Profesionales</Text>
        </View>

        {/* ============================================================== */}
        {/* MODO 1: INICIAR SESIÓN */}
        {/* ============================================================== */}
        {modo === 'login' && (
          <View style={styles.tarjetaFormulario}>
            <Text style={styles.tituloForm}>Iniciar Sesión</Text>

            <Text style={styles.etiquetaCampo}>Correo, usuario o teléfono</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="ej. psicologa.maria"
                placeholderTextColor="#9ca3af"
                value={identificadorLogin}
                onChangeText={setIdentificadorLogin}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.etiquetaCampo}>Contraseña</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={passwordLogin}
                onChangeText={setPasswordLogin}
                secureTextEntry={!mostrarPassLogin}
              />
              <TouchableOpacity
                onPress={() => setMostrarPassLogin(!mostrarPassLogin)}
                style={styles.botonOjo}
              >
                <Ionicons
                  name={mostrarPassLogin ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setModo('recuperar_solicitar')}
              style={styles.olvideBoton}
            >
              <Text style={styles.textoOlvide}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonPrincipal} onPress={manejarEntrar}>
              <Text style={styles.textoBotonPrincipal}>Entrar a mi agenda</Text>
            </TouchableOpacity>

            <View style={styles.filaPie}>
              <Text style={styles.textoPie}>¿No tienes cuenta? </Text>
              <TouchableOpacity onPress={() => setModo('registro')}>
                <Text style={styles.enlacePie}>Crear cuenta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* MODO 2: REGISTRO */}
        {/* ============================================================== */}
        {modo === 'registro' && (
          <View style={styles.tarjetaFormulario}>
            <Text style={styles.tituloForm}>Crear Cuenta</Text>

            <Text style={styles.etiquetaCampo}>Nombre y Apellidos *</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="person-circle-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="Dra. María Sánchez"
                placeholderTextColor="#9ca3af"
                value={nombreRegistro}
                onChangeText={setNombreRegistro}
              />
            </View>

            <Text style={styles.etiquetaCampo}>Nombre de usuario *</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="at-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="maria.psico"
                placeholderTextColor="#9ca3af"
                value={usuarioRegistro}
                onChangeText={setUsuarioRegistro}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.etiquetaCampo}>Correo electrónico *</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="maria@correo.com"
                placeholderTextColor="#9ca3af"
                value={correoRegistro}
                onChangeText={setCorreoRegistro}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.etiquetaCampo}>Teléfono (10 dígitos) *</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="call-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="614 555 0101"
                placeholderTextColor="#9ca3af"
                value={telefonoRegistro}
                onChangeText={manejarCambioTelefono}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            <Text style={styles.etiquetaCampo}>Especialidad o Enfoque (opcional)</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="school-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="ej. Terapia Cognitivo Conductual"
                placeholderTextColor="#9ca3af"
                value={especialidadRegistro}
                onChangeText={setEspecialidadRegistro}
              />
            </View>

            <Text style={styles.etiquetaCampo}>Contraseña segura *</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#9ca3af"
                value={passwordRegistro}
                onChangeText={setPasswordRegistro}
                secureTextEntry={!mostrarPassRegistro}
              />
              <TouchableOpacity
                onPress={() => setMostrarPassRegistro(mostrar => !mostrar)}
                style={styles.botonOjo}
                accessibilityRole="button"
                accessibilityLabel={mostrarPassRegistro ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons
                  name={mostrarPassRegistro ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.pistaSeguridad}>
              Debe incluir al menos 8 caracteres, un número, una mayúscula y un símbolo.
            </Text>

            <Text style={styles.etiquetaCampo}>Confirmar contraseña *</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#9ca3af"
                value={confirmarPassRegistro}
                onChangeText={setConfirmarPassRegistro}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.botonPrincipal} onPress={manejarCrearCuenta}>
              <Text style={styles.textoBotonPrincipal}>Registrarme</Text>
            </TouchableOpacity>

            <View style={styles.filaPie}>
              <Text style={styles.textoPie}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => setModo('login')}>
                <Text style={styles.enlacePie}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* MODO 3: RECUPERAR CONTRASEÑA (Paso 1: Solicitar Código) */}
        {/* ============================================================== */}
        {modo === 'recuperar_solicitar' && (
          <View style={styles.tarjetaFormulario}>
            <Text style={styles.tituloForm}>Recuperar Contraseña</Text>
            <Text style={styles.descripcionModo}>
              Ingresa el correo, usuario o teléfono vinculado a tu cuenta para generar tu código de restablecimiento.
            </Text>

            <Text style={styles.etiquetaCampo}>Correo, usuario o teléfono</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="ej. usuario@correo.com"
                placeholderTextColor="#9ca3af"
                value={identificadorRecuperar}
                onChangeText={setIdentificadorRecuperar}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.botonPrincipal} onPress={manejarSolicitarCodigo}>
              <Text style={styles.textoBotonPrincipal}>Obtener código</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonSecundarioTexto}
              onPress={() => setModo('login')}
            >
              <Text style={styles.textoBotonSecundario}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* MODO 4: RECUPERAR CONTRASEÑA (Paso 2: Verificar y Cambiar) */}
        {/* ============================================================== */}
        {modo === 'recuperar_verificar' && (
          <View style={styles.tarjetaFormulario}>
            <Text style={styles.tituloForm}>Nueva Contraseña</Text>
            <Text style={styles.descripcionModo}>
              Hemos generado tu código para la cuenta registrada con correo{' '}
              <Text style={{ fontWeight: 'bold', color: '#111827' }}>{correoDestinoSimulado}</Text>.
            </Text>

            <View style={styles.bannerCodigo}>
              <Text style={styles.etiquetaCodigoDemo}>Tu código de verificación:</Text>
              <Text style={styles.valorCodigoDemo}>{codigoGenerado}</Text>
            </View>

            <Text style={styles.etiquetaCampo}>Código de 6 dígitos</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="key-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor="#9ca3af"
                value={codigoIngresado}
                onChangeText={setCodigoIngresado}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <Text style={styles.etiquetaCampo}>Nueva Contraseña</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#9ca3af"
                value={nuevaPassword}
                onChangeText={setNuevaPassword}
                secureTextEntry
              />
            </View>
            <Text style={styles.pistaSeguridad}>
              Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.
            </Text>

            <Text style={styles.etiquetaCampo}>Confirmar Nueva Contraseña</Text>
            <View style={styles.cajaInput}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6b7280" style={styles.iconoInput} />
              <TextInput
                style={styles.input}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor="#9ca3af"
                value={confirmarNuevaPassword}
                onChangeText={setConfirmarNuevaPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.botonPrincipal} onPress={manejarRestablecerClave}>
              <Text style={styles.textoBotonPrincipal}>Actualizar Contraseña</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonSecundarioTexto}
              onPress={() => setModo('recuperar_solicitar')}
            >
              <Text style={styles.textoBotonSecundario}>Atrás</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedorScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    backgroundColor: '#F8F5FA',
    justifyContent: 'center',
  },
  seccionLogo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  nombreApp: {
    fontSize: 28,
    fontWeight: '800',
    color: '#79528F',
    letterSpacing: 2,
    marginTop: 8,
  },
  subtituloApp: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  tarjetaFormulario: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#79528F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E4D5EB',
  },
  tituloForm: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  descripcionModo: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6,
  },
  cajaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  iconoInput: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  botonOjo: {
    padding: 4,
  },
  pistaSeguridad: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  olvideBoton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 16,
  },
  textoOlvide: {
    fontSize: 13,
    color: '#79528F',
    fontWeight: '600',
  },
  botonPrincipal: {
    backgroundColor: '#79528F',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#79528F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  filaPie: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  textoPie: {
    fontSize: 14,
    color: '#6b7280',
  },
  enlacePie: {
    fontSize: 14,
    color: '#79528F',
    fontWeight: '700',
  },
  botonSecundarioTexto: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  textoBotonSecundario: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  bannerCodigo: {
    backgroundColor: '#F3ECF6',
    borderColor: '#E4D5EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  etiquetaCodigoDemo: {
    fontSize: 12,
    color: '#604074',
  },
  valorCodigoDemo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#79528F',
    letterSpacing: 4,
    marginTop: 4,
  },
});
