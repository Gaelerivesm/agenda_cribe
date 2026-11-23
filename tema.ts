export interface Paleta {
  id: string;
  nombre: string;
  primaria: string;
  suave: string;
  borde: string;
}

export const PALETAS: Paleta[] = [
  { id: 'rosa', nombre: 'Rosa Cribe', primaria: '#B80065', suave: '#FDF2F8', borde: '#FCE7F3' },
  { id: 'azul', nombre: 'Azul sereno', primaria: '#2563EB', suave: '#EFF6FF', borde: '#DBEAFE' },
  { id: 'verde', nombre: 'Verde salvia', primaria: '#0F766E', suave: '#F0FDFA', borde: '#CCFBF1' },
  { id: 'violeta', nombre: 'Violeta suave', primaria: '#7C3AED', suave: '#F5F3FF', borde: '#EDE9FE' },
];

export const obtenerPaleta = (id?: string) => PALETAS.find(paleta => paleta.id === id) ?? PALETAS[0];
