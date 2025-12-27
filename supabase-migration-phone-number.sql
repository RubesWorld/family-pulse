-- Add phone_number field to users table for native messaging

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.phone_number IS 'User''s phone number for native SMS integration';
