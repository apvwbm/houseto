import { supabase } from './supabase';

const BUCKET = 'recetas-fotos';

/**
 * Sube una foto desde un URI local al bucket de Supabase Storage.
 * Devuelve la URL pública de la foto subida, o null si falla.
 */
export async function uploadRecetaFoto(localUri: string): Promise<string | null> {
  try {
    // Generar nombre único basado en timestamp
    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `fotos/${fileName}`;

    // Leer el archivo como blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, {
        contentType: blob.type || `image/${ext}`,
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo foto:', error.message);
      return null;
    }

    // Obtener URL pública
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Error subiendo foto:', err);
    return null;
  }
}

/**
 * Borra una foto de Supabase Storage a partir de su URL pública.
 */
export async function deleteRecetaFoto(publicUrl: string): Promise<void> {
  try {
    // Extraer el path del bucket desde la URL pública
    // URL formato: https://<project>.supabase.co/storage/v1/object/public/recetas-fotos/fotos/xxx.jpg
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;

    const filePath = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch (err) {
    console.error('Error borrando foto:', err);
  }
}

/**
 * Comprueba si un URI es una URL remota (ya subida) o un archivo local.
 */
export function isRemoteUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}
