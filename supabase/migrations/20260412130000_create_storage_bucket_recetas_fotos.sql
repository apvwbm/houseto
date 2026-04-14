/*
  # Crear bucket de Storage para fotos de recetas

  ## Descripción
  Crea un bucket público 'recetas-fotos' para almacenar las fotos de recetas.
  Permite acceso anónimo para subir, leer y borrar (app familiar sin auth).

  ## Límites
  - Tamaño máximo por archivo: 5MB
  - Solo imágenes (JPEG, PNG, WebP)
*/

-- Crear bucket público para fotos de recetas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recetas-fotos',
  'recetas-fotos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Permitir a anon subir archivos al bucket
CREATE POLICY "Anon puede subir fotos de recetas"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'recetas-fotos');

-- Permitir a anon leer archivos del bucket
CREATE POLICY "Anon puede ver fotos de recetas"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'recetas-fotos');

-- Permitir a anon actualizar archivos del bucket
CREATE POLICY "Anon puede actualizar fotos de recetas"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'recetas-fotos')
  WITH CHECK (bucket_id = 'recetas-fotos');

-- Permitir a anon borrar archivos del bucket
CREATE POLICY "Anon puede borrar fotos de recetas"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'recetas-fotos');
