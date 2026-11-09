import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Cita {
  id: string;
  paciente: string;
  fecha: string;
  hora: string;
  tipo: string;
  notas: string;
  confirmada: boolean;
}

export type DatosCita = Omit<Cita, 'id'>;

interface CitasContextType {
  citas: Cita[];
  cargando: boolean;
  recargar: () => Promise<void>;
  agregarCita: (cita: DatosCita) => void;
  editarCita: (id: string, datos: DatosCita) => void;
  eliminarCita: (id: string) => void;
}

const CLAVE_ALMACENAMIENTO = 'agenda_cribe_citas_v1';

export const formatearFecha = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const crearCitasIniciales = (): Cita[] => {
  const hoy = new Date();
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  return [
    { id: '1', paciente: 'Ana Torres', fecha: formatearFecha(hoy), hora: '10:00', tipo: 'Terapia individual', notas: 'Primera sesión. Ansiedad laboral.', confirmada: true },
    { id: '2', paciente: 'Luis García', fecha: formatearFecha(hoy), hora: '11:30', tipo: 'Seguimiento', notas: 'Revisión de avances.', confirmada: false },
    { id: '3', paciente: 'Sofía Ramírez', fecha: formatearFecha(manana), hora: '16:00', tipo: 'Terapia de pareja', notas: 'Trabajo en comunicación.', confirmada: true },
  ];
};

export const CitasContext = createContext<CitasContextType | undefined>(undefined);

export const CitasProvider = ({ children }: { children: ReactNode }) => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      const guardado = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
      setCitas(guardado ? JSON.parse(guardado) : crearCitasIniciales());
    } catch (error) {
      console.log('Error al cargar citas', error);
      setCitas(crearCitasIniciales());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    if (cargando) return;
    AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(citas)).catch(error =>
      console.log('Error al guardar citas', error)
    );
  }, [citas, cargando]);

  const agregarCita = useCallback((datos: DatosCita) => {
    const nueva: Cita = { ...datos, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    setCitas(prev => [...prev, nueva]);
  }, []);

  const editarCita = useCallback((id: string, datos: DatosCita) => {
    setCitas(prev => prev.map(c => (c.id === id ? { ...datos, id } : c)));
  }, []);

  const eliminarCita = useCallback((id: string) => {
    setCitas(prev => prev.filter(c => c.id !== id));
  }, []);

  const valor = useMemo(
    () => ({ citas, cargando, recargar, agregarCita, editarCita, eliminarCita }),
    [citas, cargando, recargar, agregarCita, editarCita, eliminarCita]
  );

  return <CitasContext.Provider value={valor}>{children}</CitasContext.Provider>;
};