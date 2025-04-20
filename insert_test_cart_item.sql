-- First, check if the cart exists
SELECT * FROM carts WHERE user_id = 2;

-- If the cart doesn't exist, create it
-- INSERT INTO carts (user_id, total_price, total_quantity, status, created_at, updated_at)
-- VALUES (2, 0.00, 0, 'ACTIVE', NOW(), NOW());

-- Get the cart ID
-- SELECT cart_id FROM carts WHERE user_id = 2 AND status = 'ACTIVE';

-- Insert a test cart item (replace cart_id with the actual cart ID from the previous query)
INSERT INTO cart_items (cart_id, product_id, quantity, created_at, updated_at)
VALUES (1, 1, 1, NOW(), NOW());

-- Check if the cart item was inserted
SELECT * FROM cart_items WHERE cart_id = 1;
