-- First, clear all cart items to avoid foreign key issues
DELETE FROM cart_items WHERE TRUE;

-- Then, keep only one active cart per user
-- This will delete duplicate active carts, keeping only the most recently updated one
DELETE c1 FROM carts c1
JOIN (
    SELECT user_id, status, MAX(updated_at) as max_updated_at
    FROM carts
    WHERE status = 'ACTIVE'
    GROUP BY user_id, status
) c2 ON c1.user_id = c2.user_id AND c1.status = c2.status AND c1.updated_at < c2.max_updated_at
WHERE c1.status = 'ACTIVE';

-- Add the unique constraint if it doesn't exist
-- Note: This might fail if the constraint already exists, which is fine
ALTER TABLE carts
ADD CONSTRAINT UK_user_active_cart UNIQUE (user_id, status);
