-- 001_create_schema.sql
-- Create DB (run as a superuser or postgres user):
-- psql -U postgres -c "CREATE DATABASE oficios_db OWNER your_user;"
-- Then connect to the DB and run the rest:
-- psql -U your_user -d oficios_db -f db/001_create_schema.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- provides gen_random_uuid()

-- Schemas (optional)
CREATE SCHEMA IF NOT EXISTS public;

-- Tables
CREATE TABLE IF NOT EXISTS conselhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  responsavel text,
  cargo_responsavel text,
  estados text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formandos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ra text UNIQUE,
  nome text NOT NULL,
  curso text NOT NULL,
  estado text NOT NULL,
  polo text,
  data_colacao date,
  data_conclusao date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oficios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  data_envio timestamptz NOT NULL,
  conselho_id uuid NOT NULL REFERENCES conselhos(id) ON DELETE RESTRICT,
  assunto text NOT NULL,
  corpo text NOT NULL,
  responsavel_assinatura text,
  cargo_assinatura text,
  formandos_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oficios_formandos (
  oficio_id uuid NOT NULL REFERENCES oficios(id) ON DELETE CASCADE,
  formando_id uuid NOT NULL REFERENCES formandos(id) ON DELETE RESTRICT,
  pos integer NOT NULL DEFAULT 0,
  PRIMARY KEY (oficio_id, formando_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_formandos_curso_estado ON formandos (curso, estado);
CREATE INDEX IF NOT EXISTS idx_oficios_created_at ON oficios (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oficios_numero ON oficios (numero);

-- Transaction-safe helper function to create an oficio with snapshot and links
CREATE OR REPLACE FUNCTION create_oficio(
  p_numero text,
  p_data_envio timestamptz,
  p_conselho_id uuid,
  p_assunto text,
  p_corpo text,
  p_responsavel text,
  p_cargo text,
  p_formandos uuid[]
) RETURNS uuid AS $$
DECLARE
  v_oficio_id uuid;
  v_f uuid;
  v_pos int := 1;
  v_snapshot jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', f.id,
    'ra', f.ra,
    'nome', f.nome,
    'curso', f.curso,
    'estado', f.estado,
    'polo', f.polo,
    'data_colacao', to_char(f.data_colacao, 'YYYY-MM-DD'),
    'data_conclusao', to_char(f.data_conclusao, 'YYYY-MM-DD')
  ) ORDER BY array_position(p_formandos, f.id))
  INTO v_snapshot
  FROM formandos f
  WHERE f.id = ANY(p_formandos);

  INSERT INTO oficios (id, numero, data_envio, conselho_id, assunto, corpo, responsavel_assinatura, cargo_assinatura, formandos_snapshot)
  VALUES (gen_random_uuid(), p_numero, p_data_envio, p_conselho_id, p_assunto, p_corpo, p_responsavel, p_cargo, COALESCE(v_snapshot, '[]'::jsonb))
  RETURNING id INTO v_oficio_id;

  FOREACH v_f IN ARRAY p_formandos LOOP
    INSERT INTO oficios_formandos (oficio_id, formando_id, pos)
    VALUES (v_oficio_id, v_f, v_pos);
    v_pos := v_pos + 1;
  END LOOP;

  RETURN v_oficio_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Helper: generate basic HTML for a stored oficio using the snapshot (useful for server-side rendering)
CREATE OR REPLACE FUNCTION oficio_generate_html(p_oficio_id uuid) RETURNS text AS $$
DECLARE
  o RECORD;
  f jsonb;
  rows text := '';
  html text;
BEGIN
  SELECT o.numero, o.data_envio, o.assunto, o.corpo, o.responsavel_assinatura, o.cargo_assinatura, o.formandos_snapshot,
         c.nome as conselho_nome, c.responsavel as conselho_responsavel, c.cargo_responsavel as conselho_cargo
  INTO o
  FROM oficios o
  JOIN conselhos c ON c.id = o.conselho_id
  WHERE o.id = p_oficio_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Oficio % not found', p_oficio_id;
  END IF;

  IF jsonb_array_length(o.formandos_snapshot) > 0 THEN
    FOR f IN SELECT * FROM jsonb_array_elements(o.formandos_snapshot)
    LOOP
      rows := rows || format('<tr><td style="font-family:monospace;">%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
        f ->> 'ra', f ->> 'nome', f ->> 'curso', f ->> 'estado', COALESCE(f ->> 'polo', '-'), COALESCE(f ->> 'data_colacao', f ->> 'data_conclusao', ''));
    END LOOP;
  END IF;

  html := format(
    '<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Oficio %s</title>
        <style>body { font-family: "Merriweather", Georgia, serif; font-size: 12pt; padding: 40px;} table{width:100%%; border-collapse: collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f5f5f5;font-weight:600;} .page-break{page-break-before:always;}</style>
      </head>
      <body>
        <div class="meta"><p>Maringá/PR, %s</p><p><strong>Ofício nº %s</strong></p></div>
        <div class="recipient"><p>Ao %s</p><p>A/C Sr(a). %s</p><p>%s</p></div>
        <div class="subject"><p><strong>REF.:</strong> %s</p></div>
        <div class="body">%s</div>
        <div class="page-break"></div>
        <h3>ANEXO I - LISTA DE FORMANDOS</h3>
        <table>
          <thead><tr><th>RA</th><th>Nome</th><th>Curso</th><th>Estado</th><th>Polo</th><th>Data Colação</th></tr></thead>
          <tbody>%s</tbody>
        </table>
      </body>
      </html>',
    o.numero,
    to_char(o.data_envio, 'DD/MM/YYYY'),
    o.numero,
    o.conselho_nome,
    o.conselho_responsavel,
    o.conselho_cargo,
    o.assunto,
    o.corpo,
    rows
  );

  RETURN html;
END;
$$ LANGUAGE plpgsql STABLE;

-- Example seeds
INSERT INTO conselhos (nome, responsavel, cargo_responsavel, estados)
VALUES ('Conselho Exemplo', 'Fulano de Tal', 'Secretário', ARRAY['PR','SP'])
ON CONFLICT (nome) DO NOTHING;

INSERT INTO formandos (ra, nome, curso, estado, polo, data_conclusao)
VALUES
('2024001', 'Ana Silva', 'Pedagogia', 'PR', 'Polo A', '2024-12-15')
ON CONFLICT (ra) DO NOTHING;

-- Example usage: create an oficio using the function (replace conselho_id with real id)
-- SELECT create_oficio('001/2025/LH/UNICESUMAR/NEAD', now(), (SELECT id FROM conselhos WHERE nome='Conselho Exemplo'), 'Envio de Relação de Formandos', 'Corpo do ofício...', 'Responsável X', 'Cargo X', ARRAY[(SELECT id FROM formandos WHERE ra='2024001')]);

-- Grant basic access to the public role for read operations (customize for your needs)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO public;
GRANT EXECUTE ON FUNCTION create_oficio(uuid,text,timestamptz,uuid,text,text,text,uuid[]) TO public;
GRANT EXECUTE ON FUNCTION oficio_generate_html(uuid) TO public;
