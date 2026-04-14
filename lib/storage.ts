import { supabase } from './supabase';

const BUCKET_FOTOS = 'recetas-fotos';
const BUCKET_VIDEOS = 'recetas-videos';

/** Mapa extensión → content type para imágenes permitidas por el bucket */
const MIME_MAP_IMAGEN: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** Mapa extensión → content type para videos permitidos por el bucket */
const MIME_MAP_VIDEO: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

/**
 * Sube una foto desde un URI local al bucket de Supabase Storage.
 * Devuelve la URL pública de la foto subida, o null si falla.
 */
export async function uploadRecetaFoto(localUri: string): Promise<string | null> {
  try {
    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = MIME_MAP_IMAGEN[ext] ? ext : 'jpg';
    const contentType = MIME_MAP_IMAGEN[safeExt] || 'image/jpeg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const filePath = `fotos/${fileName}`;

    // Leer el archivo como ArrayBuffer (más fiable en React Native que blob)
    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo foto:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Error subiendo foto:', err);
    return null;
  }
}

/**
 * Sube un video desde un URI local al bucket de Supabase Storage.
 * Devuelve la URL pública del video subido, o null si falla.
 */
export async function uploadRecetaVideo(localUri: string): Promise<string | null> {
  try {
    const ext = localUri.split('.').pop()?.toLowerCase() || 'mp4';
    const safeExt = MIME_MAP_VIDEO[ext] ? ext : 'mp4';
    const contentType = MIME_MAP_VIDEO[safeExt] || 'video/mp4';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const filePath = `videos/${fileName}`;

    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from(BUCKET_VIDEOS)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo video:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET_VIDEOS).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Error subiendo video:', err);
    return null;
  }
}

/**
 * Borra una foto de Supabase Storage a partir de su URL pública.
 */
export async function deleteRecetaFoto(publicUrl: string): Promise<void> {
  try {
    const marker = `/storage/v1/object/public/${BUCKET_FOTOS}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;

    const filePath = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(BUCKET_FOTOS).remove([filePath]);
  } catch (err) {
    console.error('Error borrando foto:', err);
  }
}

/**
 * Borra un video de Supabase Storage a partir de su URL pública.
 */
export async function deleteRecetaVideo(publicUrl: string): Promise<void> {
  try {
    const marker = `/storage/v1/object/public/${BUCKET_VIDEOS}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;

    const filePath = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(BUCKET_VIDEOS).remove([filePath]);
  } catch (err) {
    console.error('Error borrando video:', err);
  }
}

/**
 * Comprueba si un URI es una URL remota (ya subida) o un archivo local.
 */
export function isRemoteUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}
