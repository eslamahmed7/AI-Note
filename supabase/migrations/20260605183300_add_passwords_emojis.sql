-- Add password and emoji fields to folders
ALTER TABLE folders ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS emoji text;

-- Add password and emoji fields to tags
ALTER TABLE tags ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS emoji text;

-- Add password field to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS password_hash text;

-- Reset existing is_encrypted flag on notes to prevent lockout since global vault is gone
UPDATE notes SET is_encrypted = false WHERE is_encrypted = true;
