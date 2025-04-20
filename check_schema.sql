-- This script will check the database schema
-- Run this script directly in your database management tool

-- Check the carts table schema
DESCRIBE carts;

-- Check the cart_items table schema
DESCRIBE cart_items;

-- Check if there are any constraints on the cart_items table
SELECT * FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'cart_items';

-- Check if there are any foreign keys on the cart_items table
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'cart_items' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check if there are any unique constraints on the cart_items table
SELECT * FROM information_schema.STATISTICS 
WHERE TABLE_NAME = 'cart_items' 
AND NON_UNIQUE = 0;

-- Check if there are any active carts
SELECT * FROM carts WHERE status = 'ACTIVE';

-- Check if there are any cart items
SELECT * FROM cart_items;

-- Check if there are any products
SELECT * FROM products LIMIT 5;
