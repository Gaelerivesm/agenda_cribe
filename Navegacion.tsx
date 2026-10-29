import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import PantallaInicio from './PantallaInicio';
import PantallaCalendario from './PantallaCalendario';
import PantallaNotasSesion from './PantallaNotasSesion';
import PantallaPacientes from './PantallaPacientes';
import PantallaFichaPaciente from './PantallaFichaPaciente';
import PantallaNotificaciones from './PantallaNotificaciones';
import PantallaPerfil from './PantallaPerfil';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CalendarioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VistaCalendario" component={PantallaCalendario} />
      <Stack.Screen name="NotasSesion" component={PantallaNotasSesion} />
    </Stack.Navigator>
  );
}

function PacientesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaPacientes" component={PantallaPacientes} />
      <Stack.Screen name="FichaPaciente" component={PantallaFichaPaciente} />
    </Stack.Navigator>
  );
}

interface NavegacionPrincipalProps {
  onCerrarSesion: () => void;
}

export default function NavegacionPrincipal({ onCerrarSesion }: NavegacionPrincipalProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let nombreIcono: any;
          if (route.name === 'Inicio') nombreIcono = 'home';
          else if (route.name === 'Calendario') nombreIcono = 'calendar'; 
          else if (route.name === 'Pacientes') nombreIcono = 'people'; 
          else if (route.name === 'Notificaciones') nombreIcono = 'notifications';
          else if (route.name === 'Perfil') nombreIcono = 'person';
          return <Ionicons name={nombreIcono} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#115e59',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={PantallaInicio} />
      <Tab.Screen name="Calendario" component={CalendarioStack} />
      <Tab.Screen name="Pacientes" component={PacientesStack} />
      <Tab.Screen name="Notificaciones" component={PantallaNotificaciones} />
      {/* Pasamos la función onCerrarSesion a la PantallaPerfil */}
      <Tab.Screen name="Perfil">
        {() => <PantallaPerfil onCerrarSesion={onCerrarSesion} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}