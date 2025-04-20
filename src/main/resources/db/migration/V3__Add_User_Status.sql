-- Add status column to users table
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- Set default status based on is_active flag
UPDATE users SET status = 'ACTIVE' WHERE is_active = true OR is_active IS NULL;
UPDATE users SET status = 'INACTIVE' WHERE is_active = false;
