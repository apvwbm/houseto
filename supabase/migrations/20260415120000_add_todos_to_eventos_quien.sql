/*
  # Permitir 'Todos' en eventos.quien

  ## Descripción
  Actualiza el CHECK constraint de la tabla eventos para permitir 'Todos' 
  además de los valores existentes: 'Aitor', 'Aita', 'Ama'

  ## Cambios
  - Modifica el constraint CHECK en la columna `quien` para incluir 'Todos'
*/

-- =====================
-- UPDATE: eventos.quien CHECK constraint
-- =====================

-- Primero, dropeamos el constraint existente
ALTER TABLE eventos
  DROP CONSTRAINT eventos_quien_check;

-- Luego, creamos el nuevo constraint que incluye 'Todos'
ALTER TABLE eventos
  ADD CONSTRAINT eventos_quien_check 
  CHECK (quien IN ('Aitor', 'Aita', 'Ama', 'Todos'));
