-- Migration: Create lookup tables for categories and users
-- These tables allow adding new values from the Supabase dashboard
-- without recompiling the app.

-- 1. Categorías de recetas
CREATE TABLE IF NOT EXISTS categorias_recetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categorias_recetas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_categorias_recetas" ON categorias_recetas
  FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO categorias_recetas (nombre, orden) VALUES
  ('Carne', 1),
  ('Pescado', 2),
  ('Verduras', 3),
  ('Legumbres', 4),
  ('Arroz', 5),
  ('Pasta', 6),
  ('Ensaladas', 7),
  ('Sopas', 8),
  ('Huevos', 9),
  ('Postres', 10)
ON CONFLICT (nombre) DO NOTHING;

-- 2. Categorías de compra
CREATE TABLE IF NOT EXISTS categorias_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categorias_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_categorias_compra" ON categorias_compra
  FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO categorias_compra (nombre, orden) VALUES
  ('Verdura', 1),
  ('Fruta', 2),
  ('Carniceria', 3),
  ('Charcuteria', 4),
  ('Pescaderia', 5),
  ('Congelados', 6),
  ('Bebidas', 7),
  ('Panadería', 8),
  ('Dulces', 9),
  ('Snacks', 10),
  ('Desayuno', 11),
  ('Limpieza', 12),
  ('Higiene', 13),
  ('Lácteos', 14),
  ('Otros', 99)
ON CONFLICT (nombre) DO NOTHING;

-- 3. Usuarios (quien) — for calendar events
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#666666',
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_full_access_usuarios" ON usuarios
  FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO usuarios (nombre, color, orden) VALUES
  ('Aitor', '#2563EB', 1),
  ('Aita', '#059669', 2),
  ('Ama', '#7C2D3A', 3)
ON CONFLICT (nombre) DO NOTHING;

-- Enable realtime for all 3 tables
ALTER PUBLICATION supabase_realtime ADD TABLE categorias_recetas;
ALTER PUBLICATION supabase_realtime ADD TABLE categorias_compra;
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;
