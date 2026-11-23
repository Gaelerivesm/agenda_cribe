import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  correo: string;
  telefono: string;
  passwordHash: string;
  passwordSalt: string;
  especialidad?: string;
  paleta?: string;
}

interface ResultadoAuth {
  exito: boolean;
  error?: string;
  codigo?: string;
  correo?: string;
}

interface AuthContextType {
  usuarioActual: Usuario | null;
  estaAutenticado: boolean;
  cargandoAuth: boolean;
  iniciarSesion: (usuarioOCorreo: string, password: string) => Promise<ResultadoAuth>;
  registrarse: (nombre: string, usuario: string, correo: string, telefono: string, password: string, especialidad?: string) => Promise<ResultadoAuth>;
  cerrarSesion: () => void;
  generarCodigoRecuperacion: (correoOUser: string) => Promise<ResultadoAuth>;
  restablecerPassword: (correoOUser: string, codigoIngresado: string, codigoEsperado: string, nuevaPassword: string) => Promise<ResultadoAuth>;
  cambiarPassword: (passwordActual: string, nuevaPassword: string) => Promise<ResultadoAuth>;
  actualizarPerfil: (nombre: string, especialidad?: string) => void;
  actualizarPaleta: (paleta: string) => void;
}

const CLAVE_CUENTAS = 'agenda_cribe_cuentas_v2';
const CLAVE_SESION = 'agenda_cribe_sesion_v2';
const PREFIJO_INTENTOS = 'agenda_cribe_intentos_v1:';
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

export const validarPassword = (password: string) =>
  password.length >= 8 && /\p{N}/u.test(password) && /\p{Lu}/u.test(password) && /[^\p{L}\p{N}\s]/u.test(password);

const normalizar = (valor: string) => valor.trim().toLowerCase();
const digitosHex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const hashPassword = (password: string, salt: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);

const leerCuentas = async (): Promise<Usuario[]> => {
  try {
    const valor = await AsyncStorage.getItem(CLAVE_CUENTAS);
    return valor ? JSON.parse(valor) as Usuario[] : [];
  } catch {
    return [];
  }
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [cuentas, setCuentas] = useState<Usuario[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  useEffect(() => {
    let activo = true;
    const inicializar = async () => {
      try {
        const [cuentasGuardadas, sesionId] = await Promise.all([
          leerCuentas(),
          AsyncStorage.getItem(CLAVE_SESION),
        ]);
        if (!activo) return;
        setCuentas(cuentasGuardadas);
        setUsuarioActual(cuentasGuardadas.find(c => c.id === sesionId) ?? null);
        if (sesionId && !cuentasGuardadas.some(c => c.id === sesionId)) {
          await AsyncStorage.removeItem(CLAVE_SESION);
        }
      } catch (error) {
        console.log('No se pudo restaurar la sesión local', error);
      } finally {
        if (activo) setCargandoAuth(false);
      }
    };
    void inicializar();
    return () => { activo = false; };
  }, []);

  const guardarCuentas = useCallback(async (nuevas: Usuario[]) => {
    try {
      await AsyncStorage.setItem(CLAVE_CUENTAS, JSON.stringify(nuevas));
      setCuentas(nuevas);
      return true;
    } catch (error) {
      console.log('No se pudo guardar la cuenta local', error);
      return false;
    }
  }, []);

  const iniciarSesion = useCallback(async (usuarioOCorreo: string, password: string): Promise<ResultadoAuth> => {
    const ident = normalizar(usuarioOCorreo);
    const telefonoIdentificador = ident.replace(/\D/g, '');
    const identificadorNormalizado = /^\d{10}$/.test(telefonoIdentificador) ? telefonoIdentificador : ident;
    const cuenta = cuentas.find(c => c.correo === identificadorNormalizado || c.usuario === identificadorNormalizado || c.telefono === identificadorNormalizado);
    const claveIntentos = `${PREFIJO_INTENTOS}${cuenta?.id ?? identificadorNormalizado}`;
    const ahora = Date.now();
    let intentos = { cantidad: 0, bloqueadoHasta: 0 };
    try {
      const guardado = await AsyncStorage.getItem(claveIntentos);
      if (guardado) intentos = { ...intentos, ...JSON.parse(guardado) };
    } catch { /* Si el registro de intentos falla, el acceso sigue verificándose. */ }

    if (intentos.bloqueadoHasta > ahora) {
      const minutos = Math.ceil((intentos.bloqueadoHasta - ahora) / 60000);
      return { exito: false, error: `Demasiados intentos. Vuelve a probar en ${minutos} min.` };
    }

    const hashIngresado = cuenta ? await hashPassword(password, cuenta.passwordSalt) : '';
    if (!cuenta || hashIngresado !== cuenta.passwordHash) {
      const previos = intentos.bloqueadoHasta > 0 && intentos.bloqueadoHasta <= ahora ? 0 : intentos.cantidad;
      const cantidad = previos + 1;
      const bloqueadoHasta = cantidad >= MAX_INTENTOS ? ahora + BLOQUEO_MS : 0;
      await AsyncStorage.setItem(claveIntentos, JSON.stringify({ cantidad, bloqueadoHasta }));
      return {
        exito: false,
        error: bloqueadoHasta
          ? 'Alcanzaste 5 intentos fallidos. El acceso se bloqueó durante 15 minutos.'
          : `Usuario o contraseña incorrectos. Intentos restantes: ${MAX_INTENTOS - cantidad}.`,
      };
    }

    try {
      await AsyncStorage.removeItem(claveIntentos);
      await AsyncStorage.setItem(CLAVE_SESION, cuenta.id);
    } catch {
      return { exito: false, error: 'No se pudo guardar la sesión en este dispositivo.' };
    }
    setUsuarioActual(cuenta);
    return { exito: true };
  }, [cuentas]);

  const registrarse = useCallback(async (
    nombre: string,
    usuario: string,
    correo: string,
    telefono: string,
    password: string,
    especialidad?: string
  ): Promise<ResultadoAuth> => {
    const email = normalizar(correo);
    const user = normalizar(usuario);
    const phone = telefono.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phone)) return { exito: false, error: 'El teléfono debe tener exactamente 10 dígitos.' };
    if (!validarPassword(password)) return { exito: false, error: 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.' };
    if (cuentas.some(c => c.correo === email)) return { exito: false, error: 'Ese correo ya está registrado.' };
    if (cuentas.some(c => c.usuario === user)) return { exito: false, error: 'Ese nombre de usuario ya está en uso.' };
    if (cuentas.some(c => c.telefono === phone)) return { exito: false, error: 'Ese teléfono ya está registrado.' };

    const passwordSalt = digitosHex(await Crypto.getRandomBytesAsync(16));
    const nueva: Usuario = {
      id: Crypto.randomUUID(),
      nombre: nombre.trim(),
      usuario: user,
      correo: email,
      telefono: phone,
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt),
      especialidad: especialidad?.trim() || 'Terapeuta / Psicólogo',
      paleta: 'rosa',
    };
    const nuevas = [...cuentas, nueva];
    if (!await guardarCuentas(nuevas)) return { exito: false, error: 'No se pudo guardar la cuenta en este dispositivo.' };
    try {
      await AsyncStorage.setItem(CLAVE_SESION, nueva.id);
    } catch {
      return { exito: false, error: 'La cuenta se guardó, pero no se pudo iniciar la sesión. Intenta entrar de nuevo.' };
    }
    setUsuarioActual(nueva);
    return { exito: true };
  }, [cuentas, guardarCuentas]);

  const cerrarSesion = useCallback(() => {
    setUsuarioActual(null);
    void AsyncStorage.removeItem(CLAVE_SESION);
  }, []);

  const generarCodigoRecuperacion = useCallback(async (correoOUser: string): Promise<ResultadoAuth> => {
    const busqueda = normalizar(correoOUser);
    const telefonoBusqueda = busqueda.replace(/\D/g, '');
    const identificadorNormalizado = /^\d{10}$/.test(telefonoBusqueda) ? telefonoBusqueda : busqueda;
    const cuenta = cuentas.find(c => c.correo === identificadorNormalizado || c.usuario === identificadorNormalizado || c.telefono === identificadorNormalizado);
    if (!cuenta) return { exito: false, error: 'No encontramos ninguna cuenta con ese usuario o correo.' };
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    return { exito: true, codigo, correo: cuenta.correo };
  }, [cuentas]);

  const restablecerPassword = useCallback(async (
    correoOUser: string,
    codigoIngresado: string,
    codigoEsperado: string,
    nuevaPassword: string
  ): Promise<ResultadoAuth> => {
    if (codigoIngresado.trim() !== codigoEsperado.trim()) return { exito: false, error: 'El código de verificación no coincide.' };
    if (!validarPassword(nuevaPassword)) return { exito: false, error: 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.' };
    const busqueda = normalizar(correoOUser);
    const telefonoBusqueda = busqueda.replace(/\D/g, '');
    const identificadorNormalizado = /^\d{10}$/.test(telefonoBusqueda) ? telefonoBusqueda : busqueda;
    const index = cuentas.findIndex(c => c.correo === identificadorNormalizado || c.usuario === identificadorNormalizado || c.telefono === identificadorNormalizado);
    if (index === -1) return { exito: false, error: 'Cuenta no encontrada.' };
    const passwordSalt = digitosHex(await Crypto.getRandomBytesAsync(16));
    const nuevas = [...cuentas];
    nuevas[index] = { ...nuevas[index], passwordSalt, passwordHash: await hashPassword(nuevaPassword, passwordSalt) };
    if (!await guardarCuentas(nuevas)) return { exito: false, error: 'No se pudo guardar la contraseña en este dispositivo.' };
    return { exito: true };
  }, [cuentas, guardarCuentas]);

  const cambiarPassword = useCallback(async (passwordActual: string, nuevaPassword: string): Promise<ResultadoAuth> => {
    if (!usuarioActual) return { exito: false, error: 'Inicia sesión para cambiar la contraseña.' };
    const hashActual = await hashPassword(passwordActual, usuarioActual.passwordSalt);
    if (hashActual !== usuarioActual.passwordHash) return { exito: false, error: 'La contraseña actual es incorrecta.' };
    if (!validarPassword(nuevaPassword)) return { exito: false, error: 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.' };
    const passwordSalt = digitosHex(await Crypto.getRandomBytesAsync(16));
    const actualizado = { ...usuarioActual, passwordSalt, passwordHash: await hashPassword(nuevaPassword, passwordSalt) };
    const nuevas = cuentas.map(c => c.id === actualizado.id ? actualizado : c);
    if (!await guardarCuentas(nuevas)) return { exito: false, error: 'No se pudo guardar la contraseña en este dispositivo.' };
    setUsuarioActual(actualizado);
    return { exito: true };
  }, [cuentas, guardarCuentas, usuarioActual]);

  const actualizarPerfil = useCallback((nombre: string, especialidad?: string) => {
    if (!usuarioActual) return;
    const actualizado = {
      ...usuarioActual,
      nombre: nombre.trim(),
      especialidad: especialidad !== undefined ? especialidad.trim() : usuarioActual.especialidad,
    };
    setUsuarioActual(actualizado);
    void guardarCuentas(cuentas.map(c => c.id === actualizado.id ? actualizado : c));
  }, [cuentas, guardarCuentas, usuarioActual]);

  const actualizarPaleta = useCallback((paleta: string) => {
    if (!usuarioActual) return;
    const actualizado = { ...usuarioActual, paleta };
    setUsuarioActual(actualizado);
    void guardarCuentas(cuentas.map(c => c.id === actualizado.id ? actualizado : c));
  }, [cuentas, guardarCuentas, usuarioActual]);

  const valor = useMemo(() => ({
    usuarioActual,
    estaAutenticado: usuarioActual !== null,
    cargandoAuth,
    iniciarSesion,
    registrarse,
    cerrarSesion,
    generarCodigoRecuperacion,
    restablecerPassword,
    cambiarPassword,
    actualizarPerfil,
    actualizarPaleta,
  }), [usuarioActual, cargandoAuth, iniciarSesion, registrarse, cerrarSesion, generarCodigoRecuperacion, restablecerPassword, cambiarPassword, actualizarPerfil, actualizarPaleta]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  return context;
};
