-- Tipo: a fact about the wine (Tinto/Branco/Rosé/Espumante/Fortificado/Outro),
-- set once by the Organizer. schema.sql's CREATE TABLE IF NOT EXISTS does not
-- alter the existing pours table, hence this migration.
ALTER TABLE pours ADD COLUMN tipo TEXT NOT NULL DEFAULT 'Outro';
