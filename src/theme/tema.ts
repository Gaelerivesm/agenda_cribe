export interface PaletaColor {
  id: string;
  nombre: string;
  primaria: string;
}

export const COLORES_ACENTO: PaletaColor[] = [
  { id: 'rosa', nombre: 'Magenta Cribe', primaria: '#79528F' },
  { id: 'azul', nombre: 'Azul sereno', primaria: '#2563EB' },
  { id: 'verde', nombre: 'Verde salvia', primaria: '#0F766E' },
  { id: 'violeta', nombre: 'Violeta suave', primaria: '#7C3AED' },
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
}

export type Paleta = Tema;
export const PALETAS = COLORES_ACENTO;

export const obtenerTema = (id?: string, esOscuro?: boolean): Tema => {
  const acento = COLORES_ACENTO.find(c => c.id === id) ?? COLORES_ACENTO[0];
  const oscuro = Boolean(esOscuro);
  const colorPrimario = oscuro && acento.id === 'rosa' ? '#B995CC' : acento.primaria;

  if (oscuro) {
    const suaveAcento =
      acento.id === 'rosa'
        ? 'rgba(185, 149, 204, 0.20)'
        : acento.id === 'azul'
        ? 'rgba(37, 99, 235, 0.20)'
        : acento.id === 'verde'
        ? 'rgba(15, 118, 110, 0.25)'
        : 'rgba(124, 58, 237, 0.20)';

    return {
      id: acento.id,
      nombre: acento.nombre,
      primaria: colorPrimario,
      suave: suaveAcento,
      borde: '#2C2C32',
      fondo: '#121214',          // Tono grafito/carbón
      tarjeta: '#1C1C20',        // Superficie elevada
      texto: '#F9FAFB',          // Texto principal claro
      textoSecundario: '#9CA3AF', // Texto secundario
      inputFondo: '#17171A',
      inputBorde: '#323238',
      esOscuro: true,
    };
  }

  return {
    id: acento.id,
    nombre: acento.nombre,
    primaria: colorPrimario,
    suave:
      acento.id === 'rosa'
        ? '#F3ECF6'
        : acento.id === 'azul'
        ? '#EFF6FF'
        : acento.id === 'verde'
        ? '#F0FDFA'
        : '#F5F3FF',
    borde:
      acento.id === 'rosa'
        ? '#E4D5EB'
        : acento.id === 'azul'
        ? '#DBEAFE'
        : acento.id === 'verde'
        ? '#CCFBF1'
        : '#EDE9FE',
    fondo: '#FAFAFA',
    tarjeta: '#FFFFFF',
    texto: '#111827',
    textoSecundario: '#6B7280',
    inputFondo: '#F9FAFB',
    inputBorde: '#E5E7EB',
    esOscuro: false,
  };
};

export const obtenerPaleta = (id?: string, esOscuro?: boolean): Tema => obtenerTema(id, esOscuro);
