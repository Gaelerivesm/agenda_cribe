import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import NavegacionPrincipal from './Navegacion';
// Importa aquí tu pantalla de login si la tienes, o una vista temporal:
// import PantallaLogin from './PantallaLogin';

export default function App() {
  const [estaAutenticado, setEstaAutenticado] = useState(true);

  const cerrarSesion = () => {
    setEstaAutenticado(false);
  };

  return (
    <NavigationContainer>
      {estaAutenticado ? (
        // Pasamos la función de cerrar sesión a tu navegador principal
        <NavegacionPrincipal onCerrarSesion={cerrarSesion} />
      ) : (
        // Aquí puedes poner tu pantalla de Login. Si no tienes una, puedes poner una vista simple:
        // <PantallaLogin onLoginSuccess={() => setEstaAutenticado(true)} />
        <NavegacionPrincipal onCerrarSesion={() => setEstaAutenticado(true)} /> // Temporal para pruebas
      )}
    </NavigationContainer>
  );
}