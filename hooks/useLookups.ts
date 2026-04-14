import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Usuario {
  id: string;
  nombre: string;
  color: string;
  orden: number;
}

interface LookupData {
  categoriasRecetas: string[];
  usuarios: Usuario[];
  usuarioColors: Record<string, string>;
  loading: boolean;
}

// Module-level cache so we don't refetch on every mount
let cache: {
  categoriasRecetas: string[];
  usuarios: Usuario[];
} | null = null;

export function useLookups(): LookupData {
  const [categoriasRecetas, setCategoriasRecetas] = useState<string[]>(
    cache?.categoriasRecetas ?? []
  );
  const [usuarios, setUsuarios] = useState<Usuario[]>(
    cache?.usuarios ?? []
  );
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    async function fetch() {
      const [r1, r2] = await Promise.all([
        supabase
          .from('categorias_recetas')
          .select('nombre')
          .order('orden', { ascending: true }),
        supabase
          .from('usuarios')
          .select('*')
          .order('orden', { ascending: true }),
      ]);

      const cr = r1.data?.map((r) => r.nombre) ?? [];
      const us = (r2.data as Usuario[]) ?? [];

      cache = { categoriasRecetas: cr, usuarios: us };

      setCategoriasRecetas(cr);
      setUsuarios(us);
      setLoading(false);
    }

    fetch();
  }, []);

  const usuarioColors: Record<string, string> = {};
  for (const u of usuarios) {
    usuarioColors[u.nombre] = u.color;
  }

  return {
    categoriasRecetas,
    usuarios,
    usuarioColors,
    loading,
  };
}
