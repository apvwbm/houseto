/*
  # Actualizar default de numero_personas y añadir rango de fechas a eventos

  ## Cambios

  ### recetas
  - Cambiar default de `numero_personas` de 2 a 3

  ### eventos
  - Renombrar columna `fecha` a `fecha_inicio`
  - Añadir columna `fecha_fin` (date, default = fecha_inicio)
  - Crear índice para búsquedas por rango de fechas
*/

-- =====================
-- RECETAS: default 3 personas
-- =====================
ALTER TABLE recetas ALTER COLUMN numero_personas SET DEFAULT 3;

-- =====================
-- EVENTOS: fecha_inicio + fecha_fin
-- =====================
ALTER TABLE eventos RENAME COLUMN fecha TO fecha_inicio;

ALTER TABLE eventos ADD COLUMN fecha_fin date;

-- Rellenar fecha_fin con el valor de fecha_inicio para datos existentes
UPDATE eventos SET fecha_fin = fecha_inicio WHERE fecha_fin IS NULL;

-- Hacer fecha_fin NOT NULL después de rellenar datos existentes
ALTER TABLE eventos ALTER COLUMN fecha_fin SET NOT NULL;

-- Default: fecha_fin no tiene default (se debe proporcionar siempre)
-- Índice para búsquedas por rango de fechas
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_range ON eventos (fecha_inicio, fecha_fin);
