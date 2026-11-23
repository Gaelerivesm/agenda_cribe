import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../../AuthContext';

export default function IndexRoute() {
  const { estaAutenticado, cargandoAuth } = useAuth();
  if (cargandoAuth) return null;
  return estaAutenticado ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
