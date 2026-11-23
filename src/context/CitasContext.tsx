import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

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

const CLAVE_ALMACENAMIENTO = 'agenda_cribe_citas_v2';
const CLAVE_ANTIGUA = 'agenda_cribe_citas_v1';
const CLAVE_DUENO_ANTIGUO = 'agenda_cribe_citas_dueno_v1';

export const formatearFecha = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const CitasContext = createContext<CitasContextType | undefined>(undefined);

export const CitasProvider = ({ children }: { children: ReactNode }) => {
  const { usuarioActual, cargandoAuth } = useAuth();
  const usuarioId = usuarioActual?.id ?? null;
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioDatosId, setUsuarioDatosId] = useState<string | null>(null);

  const cargarCitas = useCallback(async (id: string) => {
    setCargando(true);
    const claveUsuario = `${CLAVE_ALMACENAMIENTO}:${id}`;
    try {
      const guardado = await AsyncStorage.getItem(claveUsuario);
      if (guardado) {
        setCitas(JSON.parse(guardado));
      } else {
        const [duenoAntiguo, antiguo] = await Promise.all([
          AsyncStorage.getItem(CLAVE_DUENO_ANTIGUO),
          AsyncStorage.getItem(CLAVE_ANTIGUA),
        ]);
        if (!duenoAntiguo && antiguo) {
          await AsyncStorage.setItem(claveUsuario, antiguo);
          await AsyncStorage.setItem(CLAVE_DUENO_ANTIGUO, id);
          setCitas(JSON.parse(antiguo));
        } else {
          setCitas([]);
        }
      }
      setUsuarioDatosId(id);
    } catch (error) {
      console.log('Error al cargar citas', error);
      setCitas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  const recargar = useCallback(async () => {
    if (!usuarioId || cargandoAuth) return;
    await cargarCitas(usuarioId);
  }, [usuarioId, cargandoAuth, cargarCitas]);

  useEffect(() => {
    let activo = true;
    if (cargandoAuth) return;
    const sincronizar = async () => {
      if (!usuarioId) {
        await Promise.resolve();
        if (!activo) return;
        setCitas([]);
        setUsuarioDatosId(null);
        setCargando(false);
        return;
      }
      await cargarCitas(usuarioId);
    };
    void sincronizar();
    return () => {
      activo = false;
    };
  }, [cargandoAuth, usuarioId, cargarCitas]);

  useEffect(() => {
    if (cargando || !usuarioId || usuarioDatosId !== usuarioId) return;
    AsyncStorage.setItem(`${CLAVE_ALMACENAMIENTO}:${usuarioId}`, JSON.stringify(citas)).catch(error =>
      console.log('Error al guardar citas', error)
    );
  }, [citas, cargando, usuarioId, usuarioDatosId]);

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
