import React, { createContext, useState, ReactNode, useContext } from 'react';

export interface Usuario {
  nombre: string;
  usuario: string;
  correo: string;
  password: string;
  especialidad?: string;
}

interface AuthContextType {
  usuarioActual: Usuario | null;
  estaAutenticado: boolean;
  iniciarSesion: (usuarioOCorreo: string, password: string) => { exito: boolean; error?: string };
  registrarse: (nombre: string, usuario: string, correo: string, password: string, especialidad?: string) => { exito: boolean; error?: string };
  cerrarSesion: () => void;
  generarCodigoRecuperacion: (correoOUser: string) => { exito: boolean; codigo?: string; correo?: string; error?: string };
  restablecerPassword: (correoOUser: string, codigoIngresado: string, codigoEsperado: string, nuevaPassword: string) => { exito: boolean; error?: string };
  actualizarPerfil: (nombre: string, especialidad?: string) => void;
}

// Cuenta predeterminada en memoria para pruebas rápidas
const CUENTAS_INICIALES: Usuario[] = [
  {
    nombre: 'Dr. Alejandro Ruiz',
    usuario: 'ale.ruiz',
    correo: 'alejandro.ruiz@correo.com',
    password: '1234',
    especialidad: 'Terapeuta / Psicólogo',
  },
];

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Cuentas en memoria (se reinician al reiniciar la aplicación)
  const [cuentas, setCuentas] = useState<Usuario[]>(CUENTAS_INICIALES);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);

  const iniciarSesion = (usuarioOCorreo: string, password: string) => {
    const ident = usuarioOCorreo.trim().toLowerCase();
    const cuenta = cuentas.find(
      c => c.correo.toLowerCase() === ident || c.usuario.toLowerCase() === ident
    );

    if (!cuenta) {
      return { exito: false, error: 'No existe una cuenta con ese correo o usuario' };
    }

    if (cuenta.password !== password) {
      return { exito: false, error: 'Contraseña incorrecta' };
    }

    setUsuarioActual(cuenta);
    return { exito: true };
  };

  const registrarse = (nombre: string, usuario: string, correo: string, password: string, especialidad?: string) => {
    const emailNormalizado = correo.trim().toLowerCase();
    const userNormalizado = usuario.trim().toLowerCase();

    const yaExisteCorreo = cuentas.some(c => c.correo.toLowerCase() === emailNormalizado);
    if (yaExisteCorreo) {
      return { exito: false, error: 'Ese correo ya está registrado' };
    }

    const yaExisteUsuario = cuentas.some(c => c.usuario.toLowerCase() === userNormalizado);
    if (yaExisteUsuario) {
      return { exito: false, error: 'Ese nombre de usuario ya está en uso' };
    }

    const nuevaCuenta: Usuario = {
      nombre: nombre.trim(),
      usuario: userNormalizado,
      correo: emailNormalizado,
      password,
      especialidad: especialidad?.trim() || 'Terapeuta / Psicólogo',
    };

    setCuentas(prev => [...prev, nuevaCuenta]);
    setUsuarioActual(nuevaCuenta);
    return { exito: true };
  };

  const cerrarSesion = () => {
    setUsuarioActual(null);
  };

  const generarCodigoRecuperacion = (correoOUser: string) => {
    const busqueda = correoOUser.trim().toLowerCase();
    const cuenta = cuentas.find(
      c => c.correo.toLowerCase() === busqueda || c.usuario.toLowerCase() === busqueda
    );

    if (!cuenta) {
      return { exito: false, error: 'No encontramos ninguna cuenta con ese usuario o correo' };
    }

    // Generar código numérico aleatorio de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    return { exito: true, codigo, correo: cuenta.correo };
  };

  const restablecerPassword = (
    correoOUser: string,
    codigoIngresado: string,
    codigoEsperado: string,
    nuevaPassword: string
  ) => {
    if (codigoIngresado.trim() !== codigoEsperado.trim()) {
      return { exito: false, error: 'El código de verificación no coincide' };
    }

    const busqueda = correoOUser.trim().toLowerCase();
    const index = cuentas.findIndex(
      c => c.correo.toLowerCase() === busqueda || c.usuario.toLowerCase() === busqueda
    );

    if (index === -1) {
      return { exito: false, error: 'Cuenta no encontrada' };
    }

    setCuentas(prev => {
      const copia = [...prev];
      copia[index] = { ...copia[index], password: nuevaPassword };
      return copia;
    });

    return { exito: true };
  };

  const actualizarPerfil = (nombre: string, especialidad?: string) => {
    if (!usuarioActual) return;
    const actualizado: Usuario = {
      ...usuarioActual,
      nombre: nombre.trim(),
      especialidad: especialidad !== undefined ? especialidad.trim() : usuarioActual.especialidad,
    };
    setUsuarioActual(actualizado);
    setCuentas(prev => prev.map(c => (c.usuario === usuarioActual.usuario ? actualizado : c)));
  };

  return (
    <AuthContext.Provider
      value={{
        usuarioActual,
        estaAutenticado: usuarioActual !== null,
        iniciarSesion,
        registrarse,
        cerrarSesion,
        generarCodigoRecuperacion,
        restablecerPassword,
        actualizarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
