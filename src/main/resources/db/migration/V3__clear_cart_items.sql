-- Clear all cart items to resolve constraint issues
DELETE FROM cart_items WHERE TRUE;
