import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type TarjetaCitaProps = {
  hora: string;
  paciente: string;
  tipo: string;
};

export function TarjetaCita(props: TarjetaCitaProps) {
  return (
    <View style={styles.tarjeta}>
      <Text style={styles.hora}>{props.hora}</Text>
      <View style={styles.info}>
        <Text style={styles.paciente}>{props.paciente}</Text>
        <Text style={styles.tipo}>{props.tipo}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: '#f5f7fa',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
  },
  hora: {
    fontWeight: 'bold',
    width: 60,
    color: '#333',
  },
  info: {
    flex: 1,
  },
  paciente: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tipo: {
    color: '#64748b',
    fontSize: 12,
  },
});