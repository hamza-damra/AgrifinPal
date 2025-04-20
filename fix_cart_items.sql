-- This script will fix any potential issues with the cart_items table
-- Run this script directly in your database management tool

-- First, check if the cart_items table exists
SELECT COUNT(*) FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'cart_items';

-- If the cart_items table doesn't exist, create it
CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT UK_cart_product UNIQUE (cart_id, product_id),
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Check if the price column exists in the cart_items table
SELECT COUNT(*) FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'cart_items' 
AND COLUMN_NAME = 'price';

-- If the price column doesn't exist, add it
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER quantity;

-- Check if the unique constraint exists
SELECT COUNT(*) FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'cart_items' 
AND INDEX_NAME = 'UK_cart_product';

-- If the unique constraint doesn't exist, add it
ALTER TABLE cart_items 
ADD CONSTRAINT IF NOT EXISTS UK_cart_product UNIQUE (cart_id, product_id);

-- Check if the foreign keys exist
SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'cart_items' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- If the foreign keys don't exist, add them
ALTER TABLE cart_items 
ADD CONSTRAINT IF NOT EXISTS FK_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
ADD CONSTRAINT IF NOT EXISTS FK_cart_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;
