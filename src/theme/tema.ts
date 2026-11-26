export type Apariencia = 'sistema' | 'claro' | 'beige' | 'oscuro';

export interface PaletaColor {
  id: string;
  nombre: string;
  primaria: string;
}

export const COLORES_ACENTO: PaletaColor[] = [
  { id: 'rosa', nombre: 'Magenta Cribe', primaria: '#79528F' },
  { id: 'azul', nombre: 'Azul sereno', primaria: '#2563EB' },
  { id: 'verde', nombre: 'Verde salvia', primaria: '#0F766E' },
  { id: 'turquesa', nombre: 'Turquesa', primaria: '#0E7490' },
  { id: 'coral', nombre: 'Coral', primaria: '#C2413B' },
  { id: 'ambar', nombre: 'Ámbar', primaria: '#A16207' },
];

export interface Tema {
  id: string;
  nombre: string;
  primaria: string;
  suave: string;
  borde: string;
  fondo: string;
  tarjeta: string;
  texto: string;
  textoSecundario: string;
  inputFondo: string;
  inputBorde: string;
  esOscuro: boolean;
  esBeige: boolean;
}

export type Paleta = Tema;
export const PALETAS = COLORES_ACENTO;

const COLORES_CLAROS: Record<string, { suave: string; borde: string }> = {
  rosa: { suave: '#F3ECF6', borde: '#E4D5EB' },
  azul: { suave: '#EFF6FF', borde: '#DBEAFE' },
  verde: { suave: '#F0FDFA', borde: '#CCFBF1' },
  turquesa: { suave: '#E6F6F8', borde: '#BFE7EC' },
  coral: { suave: '#FFF0ED', borde: '#F3D2CA' },
  ambar: { suave: '#FFF7E5', borde: '#F0DFB8' },
};

const COLORES_OSCUROS: Record<string, { primaria: string; suave: string }> = {
  rosa: { primaria: '#C5A0D6', suave: 'rgba(197, 160, 214, 0.20)' },
  azul: { primaria: '#83B4FF', suave: 'rgba(37, 99, 235, 0.22)' },
  verde: { primaria: '#69C9B8', suave: 'rgba(15, 118, 110, 0.25)' },
  turquesa: { primaria: '#67C5D4', suave: 'rgba(14, 116, 144, 0.25)' },
  coral: { primaria: '#F09483', suave: 'rgba(194, 65, 59, 0.22)' },
  ambar: { primaria: '#E8BD65', suave: 'rgba(161, 98, 7, 0.25)' },
};

export const obtenerTema = (id?: string, modo?: boolean | 'beige'): Tema => {
  const acento = COLORES_ACENTO.find(color => color.id === id) ?? COLORES_ACENTO[0];
  const coloresClaros = COLORES_CLAROS[acento.id];
  const coloresOscuros = COLORES_OSCUROS[acento.id];

  if (modo === true) {
    return {
      id: acento.id,
      nombre: acento.nombre,
      primaria: coloresOscuros.primaria,
      suave: coloresOscuros.suave,
      borde: '#2C2C32',
      fondo: '#121214',
      tarjeta: '#1C1C20',
      texto: '#F9FAFB',
      textoSecundario: '#9CA3AF',
      inputFondo: '#17171A',
      inputBorde: '#323238',
      esOscuro: true,
      esBeige: false,
    };
  }

  if (modo === 'beige') {
    return {
      id: acento.id,
      nombre: acento.nombre,
      primaria: acento.primaria,
      suave: '#F2EBDD',
      borde: '#E1D6C4',
      fondo: '#F4EFE6',
      tarjeta: '#FFFCF6',
      texto: '#29261F',
      textoSecundario: '#756B60',
      inputFondo: '#F7F2E9',
      inputBorde: '#E5DCCB',
      esOscuro: false,
      esBeige: true,
    };
  }

  return {
    id: acento.id,
    nombre: acento.nombre,
    primaria: acento.primaria,
    suave: coloresClaros.suave,
    borde: coloresClaros.borde,
    fondo: '#FAFAFA',
    tarjeta: '#FFFFFF',
    texto: '#111827',
    textoSecundario: '#6B7280',
    inputFondo: '#F9FAFB',
    inputBorde: '#E5E7EB',
    esOscuro: false,
    esBeige: false,
  };
};

export const obtenerPaleta = (id?: string, modo?: boolean | 'beige'): Tema => obtenerTema(id, modo);
