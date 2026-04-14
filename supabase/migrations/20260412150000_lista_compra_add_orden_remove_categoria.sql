/*
  # Lista compra: añadir campo orden, eliminar categoria

  ## Cambios
  - Añade columna `orden` (integer) para permitir reordenación manual
  - Establece valores por defecto para `orden` en items existentes
  - Elimina la columna `categoria` por completo
*/

-- Añadir columna orden
ALTER TABLE lista_compra ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0;

-- Rellenar orden en items existentes según created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM lista_compra
)
UPDATE lista_compra
SET orden = ranked.rn
FROM ranked
WHERE lista_compra.id = ranked.id;

-- Eliminar columna categoria
ALTER TABLE lista_compra DROP COLUMN IF EXISTS categoria;
