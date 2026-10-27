import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  onLoginExitoso: () => void;
};

export default function PantallaLogin({ onLoginExitoso }: Props) {
  const [correo, setCorreo] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const manejarEntrar = () => {
    let esValido = correo.length > 0 && password.length > 0;
    if (esValido) {
      onLoginExitoso();
    } else {
      alert('Por favor llena todos los campos');
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Iniciar sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
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
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e1b4b',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  botonEntrar: {
    backgroundColor: '#8C0876',
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
    color: '#64748b',
    marginVertical: 16,
  },
  botonCrear: {
    borderWidth: 1,
    borderColor: '#8C0876',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  textoCrear: {
    color: '#8C0876',
    fontWeight: 'bold',
  },
});