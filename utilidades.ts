import { formatearFecha } from './CitasContext';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const normalizarNombre = (nombre: string) => nombre.trim().toLowerCase();

export const iniciales = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => (p[0] ? p[0].toUpperCase() : ''))
    .join('');

export const fechaLarga = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  if (!anio || !mes || !dia) return fecha;
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
};

export const fechaCorta = (fecha: string) => {
  const [, mes, dia] = fecha.split('-').map(Number);
  if (!mes || !dia) return fecha;
  return `${dia} de ${MESES[mes - 1]}`;
};

export const marcaTiempo = (fecha: string, hora: string) => `${fecha} ${hora}`;

export const marcaAhora = (ref: Date = new Date()) =>
  `${formatearFecha(ref)} ${String(ref.getHours()).padStart(2, '0')}:${String(ref.getMinutes()).padStart(2, '0')}`;

export const etiquetaRelativa = (fecha: string, ref: Date = new Date()) => {
  const hoy = formatearFecha(ref);
  const manana = formatearFecha(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1));
  const ayer = formatearFecha(new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1));
  if (fecha === hoy) return 'Hoy';
  if (fecha === manana) return 'Mañana';
  if (fecha === ayer) return 'Ayer';
  const [, mes, dia] = fecha.split('-').map(Number);
  return `${dia} ${MESES[mes - 1].slice(0, 3)}`;
};