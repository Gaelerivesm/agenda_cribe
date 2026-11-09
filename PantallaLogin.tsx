import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native';
import LogoCribe from './LogoCribe';

type Props = {
  onLoginExitoso: () => void;
};

export default function PantallaLogin({ onLoginExitoso }: Props) {
  const [correo, setCorreo] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const manejarEntrar = () => {
    const esValido = correo.length > 0 && password.length > 0;
    if (esValido) {
      onLoginExitoso();
    } else {
      Alert.alert('Faltan datos', 'Por favor llena todos los campos');
    }
  };

  return (
    <ImageBackground
      source={require('./assets/fondo-login.png')}
      style={styles.fondo}
      resizeMode="cover"
    >
      <View style={styles.contenedor}>
        <View style={styles.cabecera}>
          <LogoCribe tamano={72} />
          <Text style={styles.marca}>Agenda Cribe</Text>
        </View>
        <Text style={styles.titulo}>Iniciar sesión</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#9ca3af"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.botonEntrar} onPress={manejarEntrar}>
          <Text style={styles.textoBoton}>Entrar</Text>
        </TouchableOpacity>

        <Text style={styles.olvidaste}>¿Olvidaste tu contraseña?</Text>

        <TouchableOpacity style={styles.botonCrear}>
          <Text style={styles.textoCrear}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  contenedor: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  cabecera: {
    alignItems: 'center',
    marginBottom: 20,
  },
  marca: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#115e59',
    marginTop: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e1b4b',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    color: '#1e1b4b',
  },
  botonEntrar: {
    backgroundColor: '#115e59',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBoton: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  olvidaste: {
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 16,
  },
  botonCrear: {
    borderWidth: 1,
    borderColor: '#115e59',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  textoCrear: {
    color: '#115e59',
    fontWeight: 'bold',
  },
});