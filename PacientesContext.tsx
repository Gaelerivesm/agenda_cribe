import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatearFecha } from './CitasContext';
import { useAuth } from './AuthContext';

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

const CLAVE_ALMACENAMIENTO = 'agenda_cribe_pacientes_v2';
const CLAVE_ANTIGUA = 'agenda_cribe_pacientes_v1';
const CLAVE_DUENO_ANTIGUO = 'agenda_cribe_pacientes_dueno_v1';

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

export const PacientesContext = createContext<PacientesContextType | undefined>(undefined);

export const PacientesProvider = ({ children }: { children: ReactNode }) => {
  const { usuarioActual, cargandoAuth } = useAuth();
  const usuarioId = usuarioActual?.id ?? null;
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioDatosId, setUsuarioDatosId] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!usuarioId || cargandoAuth) return;
    setCargando(true);
    setUsuarioDatosId(null);
    setPacientes([]);
    const claveUsuario = `${CLAVE_ALMACENAMIENTO}:${usuarioId}`;
    try {
      const guardado = await AsyncStorage.getItem(claveUsuario);
      if (guardado) {
        setPacientes(JSON.parse(guardado));
      } else {
        const [duenoAntiguo, antiguo] = await Promise.all([
          AsyncStorage.getItem(CLAVE_DUENO_ANTIGUO),
          AsyncStorage.getItem(CLAVE_ANTIGUA),
        ]);
        if (!duenoAntiguo && antiguo) {
          await AsyncStorage.setItem(claveUsuario, antiguo);
          await AsyncStorage.setItem(CLAVE_DUENO_ANTIGUO, usuarioId);
          setPacientes(JSON.parse(antiguo));
        } else {
          setPacientes([]);
        }
      }
      setUsuarioDatosId(usuarioId);
    } catch (error) {
      console.log('Error al cargar pacientes', error);
      setPacientes([]);
    } finally {
      setCargando(false);
    }
  }, [usuarioId, cargandoAuth]);

  useEffect(() => {
    if (cargandoAuth) return;
    if (!usuarioId) {
      setPacientes([]);
      setUsuarioDatosId(null);
      setCargando(false);
      return;
    }
    void recargar();
  }, [recargar, cargandoAuth, usuarioId]);

  useEffect(() => {
    if (cargando || !usuarioId || usuarioDatosId !== usuarioId) return;
    AsyncStorage.setItem(`${CLAVE_ALMACENAMIENTO}:${usuarioId}`, JSON.stringify(pacientes)).catch(error =>
      console.log('Error al guardar pacientes', error)
    );
  }, [pacientes, cargando, usuarioId, usuarioDatosId]);

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
