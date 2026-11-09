import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatearFecha } from './CitasContext';

export interface Paciente {
  id: string;
  nombre: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
}

export type DatosPaciente = Omit<Paciente, 'id'>;

interface PacientesContextType {
  pacientes: Paciente[];
  cargando: boolean;
  recargar: () => Promise<void>;
  agregarPaciente: (datos: DatosPaciente) => void;
  editarPaciente: (id: string, datos: DatosPaciente) => void;
  eliminarPaciente: (id: string) => void;
}

const CLAVE_ALMACENAMIENTO = 'agenda_cribe_pacientes_v1';

const parsearNacimiento = (fecha: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!m) return null;
  return { anio: Number(m[1]), mes: Number(m[2]) - 1, dia: Number(m[3]) };
};

export const diasParaCumple = (fechaNacimiento: string, ref: Date = new Date()): number | null => {
  const n = parsearNacimiento(fechaNacimiento);
  if (!n) return null;
  const hoy = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  let proximo = new Date(ref.getFullYear(), n.mes, n.dia);
  if (proximo.getTime() < hoy.getTime()) proximo = new Date(ref.getFullYear() + 1, n.mes, n.dia);
  return Math.round((proximo.getTime() - hoy.getTime()) / 86400000);
};

export const calcularEdad = (fechaNacimiento: string, ref: Date = new Date()): number | null => {
  const n = parsearNacimiento(fechaNacimiento);
  if (!n) return null;
  let edad = ref.getFullYear() - n.anio;
  const aunNoCumple = ref.getMonth() < n.mes || (ref.getMonth() === n.mes && ref.getDate() < n.dia);
  if (aunNoCumple) edad -= 1;
  return edad;
};

export const edadQueCumple = (fechaNacimiento: string, ref: Date = new Date()): number | null => {
  const n = parsearNacimiento(fechaNacimiento);
  const dias = diasParaCumple(fechaNacimiento, ref);
  if (!n || dias === null) return null;
  const anioCumple = dias === 0 ? ref.getFullYear() : new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + dias).getFullYear();
  return anioCumple - n.anio;
};

const crearPacientesIniciales = (): Paciente[] => {
  const hoy = new Date();
  const nacimiento = (anio: number, dias: number) =>
    formatearFecha(new Date(anio, hoy.getMonth(), hoy.getDate() + dias));
  return [
    { id: 'p1', nombre: 'Ana Torres', fechaNacimiento: nacimiento(1994, 90), telefono: '614 555 0101', correo: 'ana.torres@correo.com' },
    { id: 'p2', nombre: 'Luis García', fechaNacimiento: nacimiento(1988, 150), telefono: '614 555 0102', correo: '' },
    { id: 'p3', nombre: 'Sofía Ramírez', fechaNacimiento: nacimiento(1999, 200), telefono: '614 555 0103', correo: 'sofia.r@correo.com' },
    { id: 'p4', nombre: 'Carlos Ruiz', fechaNacimiento: nacimiento(1993, 3), telefono: '614 555 0104', correo: '' },
    { id: 'p5', nombre: 'Elena Vargas', fechaNacimiento: nacimiento(1998, 6), telefono: '614 555 0105', correo: 'elena.v@correo.com' },
    { id: 'p6', nombre: 'Roberto Gómez', fechaNacimiento: nacimiento(1980, 12), telefono: '614 555 0106', correo: '' },
  ];
};

export const PacientesContext = createContext<PacientesContextType | undefined>(undefined);

export const PacientesProvider = ({ children }: { children: ReactNode }) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      const guardado = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
      setPacientes(guardado ? JSON.parse(guardado) : crearPacientesIniciales());
    } catch (error) {
      console.log('Error al cargar pacientes', error);
      setPacientes(crearPacientesIniciales());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    if (cargando) return;
    AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(pacientes)).catch(error =>
      console.log('Error al guardar pacientes', error)
    );
  }, [pacientes, cargando]);

  const agregarPaciente = useCallback((datos: DatosPaciente) => {
    const nuevo: Paciente = { ...datos, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    setPacientes(prev => [...prev, nuevo]);
  }, []);

  const editarPaciente = useCallback((id: string, datos: DatosPaciente) => {
    setPacientes(prev => prev.map(p => (p.id === id ? { ...datos, id } : p)));
  }, []);

  const eliminarPaciente = useCallback((id: string) => {
    setPacientes(prev => prev.filter(p => p.id !== id));
  }, []);

  const valor = useMemo(
    () => ({ pacientes, cargando, recargar, agregarPaciente, editarPaciente, eliminarPaciente }),
    [pacientes, cargando, recargar, agregarPaciente, editarPaciente, eliminarPaciente]
  );

  return <PacientesContext.Provider value={valor}>{children}</PacientesContext.Provider>;
};