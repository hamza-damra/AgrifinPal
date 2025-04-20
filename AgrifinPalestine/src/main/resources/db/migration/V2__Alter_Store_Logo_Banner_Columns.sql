-- Alter the store_logo and store_banner columns to TEXT type
ALTER TABLE stores MODIFY COLUMN store_logo TEXT;
ALTER TABLE stores MODIFY COLUMN store_banner TEXT;
