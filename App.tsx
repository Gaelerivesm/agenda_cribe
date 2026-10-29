import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import PantallaLogin from './PantallaLogin';
import NavegacionPrincipal from './Navegacion';

export default function App() {
  const [sesionIniciada, setSesionIniciada] = useState(false);

  if (!sesionIniciada) {
    return <PantallaLogin onLoginExitoso={() => setSesionIniciada(true)} />;
  }

  return (
    <NavigationContainer>
      <NavegacionPrincipal />
    </NavigationContainer>
  );
}