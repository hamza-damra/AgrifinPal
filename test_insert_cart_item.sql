-- First, check if the cart exists
SELECT * FROM carts WHERE user_id = 2;

-- Check if there are any cart items
SELECT * FROM cart_items WHERE cart_id = 2;

-- Try to insert a cart item directly
INSERT INTO cart_items (cart_id, product_id, quantity, price, created_at, updated_at)
VALUES (2, 1, 1, 20.00, NOW(), NOW());

-- Check if the cart item was inserted
SELECT * FROM cart_items WHERE cart_id = 2;

-- Update the cart totals
UPDATE carts 
SET total_price = 20.00, 
    total_quantity = 1, 
    updated_at = NOW() 
WHERE cart_id = 2;
