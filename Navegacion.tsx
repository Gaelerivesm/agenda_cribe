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
import { RootTabParamList, CalendarioStackParamList, PacientesStackParamList } from './tiposNavegacion';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<CalendarioStackParamList>();
const StackPacientes = createNativeStackNavigator<PacientesStackParamList>();

const ICONOS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home',
  Calendario: 'calendar',
  Pacientes: 'people',
  Notificaciones: 'notifications',
  Perfil: 'person',
};

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
    <StackPacientes.Navigator screenOptions={{ headerShown: false }}>
      <StackPacientes.Screen name="ListaPacientes" component={PantallaPacientes} />
      <StackPacientes.Screen name="FichaPaciente" component={PantallaFichaPaciente} />
    </StackPacientes.Navigator>
  );
}

interface NavegacionPrincipalProps {
  onCerrarSesion: () => void;
}

export default function NavegacionPrincipal({ onCerrarSesion }: NavegacionPrincipalProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONOS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#115e59',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={PantallaInicio} />
      <Tab.Screen name="Calendario" component={CalendarioStack} />
      <Tab.Screen name="Pacientes" component={PacientesStack} />
      <Tab.Screen name="Notificaciones" component={PantallaNotificaciones} />
      <Tab.Screen name="Perfil">
        {() => <PantallaPerfil onCerrarSesion={onCerrarSesion} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}