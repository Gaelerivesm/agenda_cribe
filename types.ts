export type Cita = {
  id: number;
  hora: string;
  paciente: string;
  tipo: string;
  notaOpcional?: string;
};

// Nuevo tipo para los pacientes
export type Paciente = {
  id: string;
  nombre: string;
  edad: number;
  tipoTerapia: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
};

export type CitaAgenda = {
  id: string;
  fecha: string; // Formato 'YYYY-MM-DD' para filtrar fácil
  hora: string;
  paciente: string;
  tipo: string;
  motivo: string;
  notas: string;
  estado: 'ocupado' | 'libre';
};