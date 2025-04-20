-- First, clear all cart items to avoid foreign key issues
DELETE FROM cart_items WHERE TRUE;

-- Delete all carts with null IDs or null user_ids (these shouldn't exist but just in case)
DELETE FROM carts WHERE cart_id IS NULL OR user_id IS NULL;

-- For each user, keep only the most recently updated active cart
-- This is a two-step process to avoid MySQL error 1093 (can't update a table we're selecting from)

-- Step 1: Create a temporary table with the carts to keep
CREATE TEMPORARY TABLE IF NOT EXISTS carts_to_keep AS
SELECT MAX(cart_id) as cart_id
FROM carts
WHERE status = 'ACTIVE'
GROUP BY user_id;

-- Step 2: Delete all active carts that are not in the temporary table
DELETE FROM carts 
WHERE status = 'ACTIVE' 
AND cart_id NOT IN (SELECT cart_id FROM carts_to_keep);

-- Drop the temporary table
DROP TEMPORARY TABLE IF EXISTS carts_to_keep;

-- Make sure the unique constraint exists
-- This might fail if the constraint already exists, which is fine
ALTER TABLE carts
ADD CONSTRAINT UK_user_active_cart UNIQUE (user_id, status);

-- Fix the MySQL syntax for the DELETE statement in DirectCartService
-- This creates a procedure that can be called to delete cart items for a user
DROP PROCEDURE IF EXISTS delete_cart_items_for_user;

DELIMITER //
CREATE PROCEDURE delete_cart_items_for_user(IN user_id_param INT)
BEGIN
    DELETE ci FROM cart_items ci 
    INNER JOIN carts c ON ci.cart_id = c.cart_id 
    WHERE c.user_id = user_id_param;
END //
DELIMITER ;
