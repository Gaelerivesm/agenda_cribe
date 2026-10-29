import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importamos todas las pantallas
import PantallaInicio from './PantallaInicio';
import PantallaPacientes from './PantallaPacientes';
import PantallaCalendario from './PantallaCalendario';
import PantallaPerfil from './PantallaPerfil';

const Tab = createBottomTabNavigator();

export default function NavegacionPrincipal() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Configuramos el ícono dependiendo del nombre de la pestaña
        tabBarIcon: ({ color, size }) => {
          let nombreIcono: any;

          if (route.name === 'Inicio') {
            nombreIcono = 'home';
          } else if (route.name === 'Pacientes') {
            nombreIcono = 'people'; // Ícono de un grupo de personas
          } else if (route.name === 'Calendario') {
            nombreIcono = 'calendar'; // Ícono de un calendario
          } else if (route.name === 'Perfil') {
            nombreIcono = 'person';
          }

          return <Ionicons name={nombreIcono} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {/* Agregamos las pantallas en el orden que queremos que aparezcan abajo */}
      <Tab.Screen name="Inicio" component={PantallaInicio} />
      <Tab.Screen name="Pacientes" component={PantallaPacientes} />
      <Tab.Screen name="Calendario" component={PantallaCalendario} />
      <Tab.Screen name="Perfil" component={PantallaPerfil} />
    </Tab.Navigator>
  );
}