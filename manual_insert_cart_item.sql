-- This script will manually insert a cart item for testing
-- Run this script directly in your database management tool

-- First, check if the cart exists
SELECT * FROM carts WHERE user_id = 2;

-- If the cart doesn't exist, create it
-- INSERT INTO carts (user_id, total_price, total_quantity, status, created_at, updated_at)
-- VALUES (2, 0.00, 0, 'ACTIVE', NOW(), NOW());

-- Insert a cart item
INSERT INTO cart_items (cart_id, product_id, quantity, price, created_at, updated_at)
VALUES (2, 1, 1, 20.00, NOW(), NOW());

-- Update the cart totals
UPDATE carts 
SET total_price = 20.00, 
    total_quantity = 1, 
    updated_at = NOW() 
WHERE cart_id = 2;

-- Check if the cart item was inserted
SELECT * FROM cart_items WHERE cart_id = 2;
