export type Quien = string;

export interface Evento {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  quien: Quien;
  created_at?: string;
  updated_at?: string;
}

export interface Receta {
  id: string;
  nombre: string;
  descripcion: string;
  categorias: string[];
  numero_personas: number;
  video_tipo: 'url' | 'file' | null;
  video_valor: string | null;
  foto: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ItemCompra {
  id: string;
  nombre: string;
  cantidad: string;
  comprado: boolean;
  orden: number;
  created_at?: string;
  updated_at?: string;
}

// Fallback constants — used only if DB lookup fails
export const QUIEN_OPTIONS: string[] = ['Aitor', 'Aita', 'Ama'];

export const CATEGORIAS_RECETAS = [
  'Carne',
  'Pescado',
  'Verduras',
  'Legumbres',
  'Arroz',
  'Pasta',
  'Ensaladas',
  'Sopas',
  'Huevos',
  'Postres',
];


export const QUIEN_COLORS: Record<string, string> = {
  Aitor: '#2563EB',
  Aita: '#059669',
  Ama: '#7C2D3A',
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
