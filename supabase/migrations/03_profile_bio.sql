-- Add profile bio fields to users table

-- Add new columns for profile information
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.location IS 'User''s current location/city';
COMMENT ON COLUMN users.occupation IS 'User''s job or what they do';
COMMENT ON COLUMN users.birthday IS 'User''s birthday (year optional for privacy)';
COMMENT ON COLUMN users.bio IS 'Short bio or fun facts about the user';
