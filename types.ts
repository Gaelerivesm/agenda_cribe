// Define la estructura para una cita médica
export type Cita = {
  id: number;
  hora: string;
  paciente: string;
  tipo: string;
  notaOpcional?: string; // Propiedad opcional con '?'
};