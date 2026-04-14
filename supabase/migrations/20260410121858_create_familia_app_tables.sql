/*
  # Familia App - Tablas principales

  ## Descripción
  Crea las tres tablas principales de la app familiar:
  - `eventos`: Eventos del calendario familiar
  - `recetas`: Recetas de cocina
  - `lista_compra`: Items de la lista de la compra

  ## Tablas nuevas

  ### eventos
  - `id` (uuid, PK): Identificador único
  - `nombre` (text): Nombre del evento
  - `descripcion` (text): Descripción opcional
  - `fecha` (date): Fecha del evento
  - `hora_inicio` (time): Hora de inicio opcional
  - `hora_fin` (time): Hora de fin opcional
  - `quien` (text): Miembro de la familia (Aitor, Aita, Ama)
  - `created_at`, `updated_at`: Timestamps

  ### recetas
  - `id` (uuid, PK): Identificador único
  - `nombre` (text): Nombre de la receta
  - `descripcion` (text): Descripción/instrucciones
  - `categorias` (text[]): Array de categorías
  - `numero_personas` (integer): Número de comensales
  - `video_tipo` (text): Tipo de video ('url' o 'file')
  - `video_valor` (text): URL o path del video
  - `foto` (text): URL o path de la foto
  - `created_at`, `updated_at`: Timestamps

  ### lista_compra
  - `id` (uuid, PK): Identificador único
  - `nombre` (text): Nombre del producto
  - `categoria` (text): Categoría del producto
  - `cantidad` (text): Cantidad opcional
  - `comprado` (boolean): Si ya está comprado
  - `created_at`, `updated_at`: Timestamps

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Acceso anónimo permitido (app familiar sin autenticación)
  - Políticas separadas por operación (SELECT, INSERT, UPDATE, DELETE)
*/

-- =====================
-- TABLA: eventos
-- =====================
CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text DEFAULT '',
  fecha date NOT NULL,
  hora_inicio time,
  hora_fin time,
  quien text NOT NULL CHECK (quien IN ('Aitor', 'Aita', 'Ama')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso anon select eventos"
  ON eventos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Acceso anon insert eventos"
  ON eventos FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Acceso anon update eventos"
  ON eventos FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acceso anon delete eventos"
  ON eventos FOR DELETE
  TO anon
  USING (true);

-- =====================
-- TABLA: recetas
-- =====================
CREATE TABLE IF NOT EXISTS recetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text DEFAULT '',
  categorias text[] DEFAULT '{}',
  numero_personas integer DEFAULT 2,
  video_tipo text CHECK (video_tipo IN ('url', 'file')),
  video_valor text,
  foto text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso anon select recetas"
  ON recetas FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Acceso anon insert recetas"
  ON recetas FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Acceso anon update recetas"
  ON recetas FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acceso anon delete recetas"
  ON recetas FOR DELETE
  TO anon
  USING (true);

-- =====================
-- TABLA: lista_compra
-- =====================
CREATE TABLE IF NOT EXISTS lista_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text NOT NULL,
  cantidad text DEFAULT '',
  comprado boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lista_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso anon select lista_compra"
  ON lista_compra FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Acceso anon insert lista_compra"
  ON lista_compra FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Acceso anon update lista_compra"
  ON lista_compra FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acceso anon delete lista_compra"
  ON lista_compra FOR DELETE
  TO anon
  USING (true);
