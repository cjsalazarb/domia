-- 022: Add tipo column to mantenimientos for incident categorization
ALTER TABLE mantenimientos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'otro';
