-- First, check if there are any carts with null IDs
SELECT * FROM carts WHERE cart_id IS NULL;

-- Check if there are any carts with null user_ids
SELECT * FROM carts WHERE user_id IS NULL;

-- Check if there are any duplicate active carts for the same user
SELECT user_id, COUNT(*) as cart_count
FROM carts
WHERE status = 'ACTIVE'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Delete all cart items to avoid foreign key issues
DELETE FROM cart_items WHERE TRUE;

-- Delete all carts to start fresh
DELETE FROM carts WHERE TRUE;

-- Create a new cart for user ID 3 (or replace with the user ID you're testing with)
INSERT INTO carts (user_id, total_price, total_quantity, status, created_at, updated_at)
VALUES (3, 0.00, 0, 'ACTIVE', NOW(), NOW());
