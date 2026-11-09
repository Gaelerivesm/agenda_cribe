import { NavigatorScreenParams } from '@react-navigation/native';
import { Cita } from './CitasContext';

export type CalendarioStackParamList = {
  VistaCalendario: { nuevaCita?: boolean; paciente?: string } | undefined;
  NotasSesion: { cita: Cita; modo?: 'ver' | 'editar' };
};

export type PacientesStackParamList = {
  ListaPacientes: undefined;
  FichaPaciente: { pacienteId: string };
};

export type RootTabParamList = {
  Inicio: undefined;
  Calendario: NavigatorScreenParams<CalendarioStackParamList> | undefined;
  Pacientes: NavigatorScreenParams<PacientesStackParamList> | undefined;
  Notificaciones: undefined;
  Perfil: undefined;
};