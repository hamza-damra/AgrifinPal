-- This script will manually insert a cart item for testing
-- Run this script directly in your database management tool

-- First, check if the user exists
SELECT * FROM users WHERE user_id = 1;

-- Then, check if the cart exists for this user
SELECT * FROM carts WHERE user_id = 1;

-- If the cart doesn't exist, create it
-- Replace 1 with your actual user ID
INSERT INTO carts (user_id, total_price, total_quantity, status, created_at, updated_at)
VALUES (1, 0.00, 0, 'ACTIVE', NOW(), NOW());

-- Get the cart ID (should be 1 if this is the first cart)
SELECT cart_id FROM carts WHERE user_id = 1 AND status = 'ACTIVE';

-- Check if the product exists
SELECT * FROM products WHERE product_id = 1;

-- Insert a cart item
-- Replace 1 with your actual cart ID and product ID
INSERT INTO cart_items (cart_id, product_id, quantity, price, created_at, updated_at)
VALUES (1, 1, 1, 20.00, NOW(), NOW());

-- Check if the cart item was inserted
SELECT * FROM cart_items WHERE cart_id = 1;

-- Update the cart totals
UPDATE carts 
SET total_price = 20.00, 
    total_quantity = 1, 
    updated_at = NOW() 
WHERE cart_id = 1;

-- Check if the cart was updated
SELECT * FROM carts WHERE cart_id = 1;
