BEGIN;

SET search_path = public, pg_catalog;

-- Add a maintenance table with a single flag column, `enabled`.
CREATE TABLE IF NOT EXISTS maintenance (
    enabled BOOLEAN NOT NULL DEFAULT false
);

-- Initialize the maintenance enabled flag to `false`.
INSERT INTO maintenance VALUES (false);

COMMIT;
