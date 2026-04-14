/*
  # Crear bucket de Storage para videos de recetas

  ## Descripción
  Crea un bucket público 'recetas-videos' para almacenar los videos de recetas.
  Permite acceso anónimo para subir, leer y borrar (app familiar sin auth).

  ## Límites
  - Tamaño máximo por archivo: 50MB
  - Solo videos (MP4, QuickTime/MOV, WebM)
*/

-- Crear bucket público para videos de recetas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recetas-videos',
  'recetas-videos',
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Permitir a anon subir archivos al bucket
CREATE POLICY "Anon puede subir videos de recetas"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'recetas-videos');

-- Permitir a anon leer archivos del bucket
CREATE POLICY "Anon puede ver videos de recetas"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'recetas-videos');

-- Permitir a anon actualizar archivos del bucket
CREATE POLICY "Anon puede actualizar videos de recetas"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'recetas-videos')
  WITH CHECK (bucket_id = 'recetas-videos');

-- Permitir a anon borrar archivos del bucket
CREATE POLICY "Anon puede borrar videos de recetas"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'recetas-videos');
