export type EstadoCita = 'Cita próxima' | 'En curso' | 'Cita pasada';

export const parsearFechaHoraLocal = (fecha: string, hora: string): Date | null => {
  const partesFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const partesHora = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!partesFecha || !partesHora) return null;

  const [, anio, mes, dia] = partesFecha;
  const [, horas, minutos] = partesHora;
  const inicio = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(horas), Number(minutos), 0, 0);
  if (
    inicio.getFullYear() !== Number(anio) || inicio.getMonth() !== Number(mes) - 1 ||
    inicio.getDate() !== Number(dia) || inicio.getHours() !== Number(horas) ||
    inicio.getMinutes() !== Number(minutos)
  ) return null;
  return inicio;
};

export const citaYaInicio = (fecha: string, hora: string, ahora = new Date()): boolean => {
  const inicio = parsearFechaHoraLocal(fecha, hora);
  return !inicio || inicio.getTime() < ahora.getTime();
};

export const obtenerEstadoCita = (fecha: string, hora: string, ahora = new Date(), duracionMinutos = 60): EstadoCita => {
  const inicio = parsearFechaHoraLocal(fecha, hora);
  if (!inicio) return 'Cita pasada';
  const tiempoActual = ahora.getTime();
  if (tiempoActual < inicio.getTime()) return 'Cita próxima';
  if (tiempoActual < inicio.getTime() + duracionMinutos * 60_000) return 'En curso';
  return 'Cita pasada';
};
