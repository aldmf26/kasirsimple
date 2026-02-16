-- Add bluetooth settings to printer_settings table
ALTER TABLE printer_settings ADD COLUMN IF NOT EXISTS bluetooth_device_name TEXT;
ALTER TABLE printer_settings ADD COLUMN IF NOT EXISTS bluetooth_device_address TEXT;

-- Update printer_type check constraint if it exists
-- First drop it if we can find its name, or just add a new one after removing old one if needed.
-- But standard ALTER TABLE usually doesn't need to touch constraints unless they conflict.
-- The existing constraint was: CHECK (printer_type IN ('thermal', 'a4', 'none'))
-- We want to allow 'bluetooth'

DO $$ 
BEGIN 
    ALTER TABLE printer_settings DROP CONSTRAINT IF EXISTS printer_settings_printer_type_check;
    ALTER TABLE printer_settings ADD CONSTRAINT printer_settings_printer_type_check CHECK (printer_type IN ('thermal', 'a4', 'bluetooth', 'none'));
EXCEPTION
    WHEN others THEN NULL;
END $$;
